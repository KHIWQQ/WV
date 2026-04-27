-- ==========================================
-- Cleanup RPCs for periodic Trigger.dev jobs.
-- These are SECURITY DEFINER so the background worker
-- can call them with the service role.
-- ==========================================

-- ─── Price history retention ─────────────────────────────────────
-- Keep raw daily ticks for 1 year; older rows can be deleted
-- (or aggregated into monthly buckets — TODO when volume warrants).
CREATE OR REPLACE FUNCTION public.cleanup_price_history(p_keep_days integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.price_history
    WHERE recorded_at < now() - (p_keep_days || ' days')::interval;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ─── Rate limit table cleanup ────────────────────────────────────
-- The check_rate_limit RPC doesn't prune expired rows; do it here.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.rate_limits WHERE reset_at < now() - interval '1 hour';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ─── Audit log retention ─────────────────────────────────────────
-- Keep 2 years by default. Adjust as compliance requires.
CREATE OR REPLACE FUNCTION public.cleanup_audit_log(p_keep_days integer DEFAULT 730)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.audit_log
    WHERE created_at < now() - (p_keep_days || ' days')::interval;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ─── Hard-delete soft-deleted records past grace period ──────────
-- 30-day grace period before permanent deletion (allows undo / restore).
CREATE OR REPLACE FUNCTION public.purge_soft_deleted(p_grace_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assets integer;
    v_liabilities integer;
    v_transactions integer;
BEGIN
    DELETE FROM public.assets
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - (p_grace_days || ' days')::interval;
    GET DIAGNOSTICS v_assets = ROW_COUNT;

    DELETE FROM public.liabilities
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - (p_grace_days || ' days')::interval;
    GET DIAGNOSTICS v_liabilities = ROW_COUNT;

    DELETE FROM public.transactions
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - (p_grace_days || ' days')::interval;
    GET DIAGNOSTICS v_transactions = ROW_COUNT;

    RETURN jsonb_build_object(
        'assets', v_assets,
        'liabilities', v_liabilities,
        'transactions', v_transactions
    );
END;
$$;
