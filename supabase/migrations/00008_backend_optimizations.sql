-- ==========================================
-- 1. Rate Limiting Table & RPC
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    count integer DEFAULT 1,
    reset_at timestamp with time zone NOT NULL
);

-- RPC for checking and updating rate limits in a single transaction
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_max_requests integer,
    p_window_seconds integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
    v_reset_at timestamp with time zone;
    v_now timestamp with time zone := now();
    v_allowed boolean;
BEGIN
    -- Cleanup expired entries periodically (easiest to do incrementally here)
    -- We can delete 1% of the time to avoid heavy locks, or just rely on a cron, 
    -- but for simplicity we just upsert and rely on the UI.
    
    -- Try to find existing key
    SELECT count, reset_at INTO v_count, v_reset_at
    FROM public.rate_limits
    WHERE key = p_key
    FOR UPDATE; -- lock row for concurrency

    IF NOT FOUND THEN
        -- Insert new record
        v_reset_at := v_now + (p_window_seconds || ' seconds')::interval;
        INSERT INTO public.rate_limits (key, count, reset_at)
        VALUES (p_key, 1, v_reset_at);
        
        RETURN json_build_object(
            'allowed', true,
            'remaining', p_max_requests - 1,
            'resetAt', extract(epoch from v_reset_at) * 1000
        );
    END IF;

    -- If window expired, reset
    IF v_now > v_reset_at THEN
        v_reset_at := v_now + (p_window_seconds || ' seconds')::interval;
        UPDATE public.rate_limits
        SET count = 1, reset_at = v_reset_at
        WHERE key = p_key;
        
        RETURN json_build_object(
            'allowed', true,
            'remaining', p_max_requests - 1,
            'resetAt', extract(epoch from v_reset_at) * 1000
        );
    END IF;

    -- Within window, check limit
    IF v_count >= p_max_requests THEN
        RETURN json_build_object(
            'allowed', false,
            'remaining', 0,
            'resetAt', extract(epoch from v_reset_at) * 1000
        );
    END IF;

    -- Allowed, increment
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;

    RETURN json_build_object(
        'allowed', true,
        'remaining', p_max_requests - (v_count + 1),
        'resetAt', extract(epoch from v_reset_at) * 1000
    );
END;
$$;

-- ==========================================
-- 2. Transaction Summary RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_transaction_summary(
    p_user_id uuid,
    p_date_from date,
    p_date_to date
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_total_income numeric := 0;
    v_total_expense numeric := 0;
    v_income_by_category json;
    v_expense_by_category json;
BEGIN
    -- Calculate totals
    SELECT COALESCE(SUM(amount), 0) INTO v_total_income
    FROM public.transactions
    WHERE user_id = p_user_id AND type = 'income' AND date >= p_date_from AND date <= p_date_to;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
    FROM public.transactions
    WHERE user_id = p_user_id AND type = 'expense' AND date >= p_date_from AND date <= p_date_to;

    -- Group Income
    SELECT COALESCE(json_agg(
        json_build_object(
            'category', category,
            'amount', amount,
            'count', count,
            'percent', CASE WHEN v_total_income > 0 THEN (amount / v_total_income) * 100 ELSE 0 END
        ) ORDER BY amount DESC
    ), '[]'::json) INTO v_income_by_category
    FROM (
        SELECT category, SUM(amount) as amount, COUNT(*) as count
        FROM public.transactions
        WHERE user_id = p_user_id AND type = 'income' AND date >= p_date_from AND date <= p_date_to
        GROUP BY category
    ) sub;

    -- Group Expense
    SELECT COALESCE(json_agg(
        json_build_object(
            'category', category,
            'amount', amount,
            'count', count,
            'percent', CASE WHEN v_total_expense > 0 THEN (amount / v_total_expense) * 100 ELSE 0 END
        ) ORDER BY amount DESC
    ), '[]'::json) INTO v_expense_by_category
    FROM (
        SELECT category, SUM(amount) as amount, COUNT(*) as count
        FROM public.transactions
        WHERE user_id = p_user_id AND type = 'expense' AND date >= p_date_from AND date <= p_date_to
        GROUP BY category
    ) sub;

    RETURN json_build_object(
        'totalIncome', v_total_income,
        'totalExpense', v_total_expense,
        'net', v_total_income - v_total_expense,
        'incomeByCategory', v_income_by_category,
        'expenseByCategory', v_expense_by_category
    );
END;
$$;


-- ==========================================
-- 3. Monthly Trend RPC
-- ==========================================
-- Provides aggregated totals grouped by YYYY-MM
CREATE OR REPLACE FUNCTION public.get_monthly_trend(
    p_user_id uuid,
    p_date_from date
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result json;
BEGIN
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json) INTO v_result
    FROM (
        SELECT 
            to_char(date, 'YYYY-MM') as month_key,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM public.transactions
        WHERE user_id = p_user_id AND type IN ('income', 'expense') AND date >= p_date_from
        GROUP BY to_char(date, 'YYYY-MM')
    ) sub;

    RETURN v_result;
END;
$$;


-- ==========================================
-- 4. Batch Update Asset Prices RPC
-- ==========================================
-- Expects jsonb like: [{"id": "uuid", "price": 100.5, "value": 500.5}, ...]
CREATE OR REPLACE FUNCTION public.update_asset_prices_batch(
    p_user_id uuid,
    p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_payload)
    LOOP
        UPDATE public.assets
        SET 
            current_price = (item->>'price')::numeric,
            current_value = (item->>'value')::numeric,
            updated_at = now()
        WHERE 
            id = (item->>'id')::uuid 
            AND user_id = p_user_id;
    END LOOP;
END;
$$;
