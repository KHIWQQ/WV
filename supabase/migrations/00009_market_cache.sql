-- ==========================================
-- Market Cache Table
-- Stores cached API responses from Yahoo/CoinGecko
-- to reduce external API calls and speed up responses.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.market_cache (
    key text PRIMARY KEY,
    data jsonb NOT NULL,
    provider text NOT NULL DEFAULT 'unknown',
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for cleanup of expired entries
CREATE INDEX idx_market_cache_expires_at ON public.market_cache (expires_at);

-- RPC: get cache entry (returns null if expired)
CREATE OR REPLACE FUNCTION public.get_market_cache(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_data jsonb;
BEGIN
    SELECT data INTO v_data
    FROM public.market_cache
    WHERE key = p_key AND expires_at > now();

    RETURN v_data;
END;
$$;

-- RPC: set cache entry (upsert)
CREATE OR REPLACE FUNCTION public.set_market_cache(
    p_key text,
    p_data jsonb,
    p_provider text,
    p_ttl_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.market_cache (key, data, provider, expires_at)
    VALUES (p_key, p_data, p_provider, now() + (p_ttl_seconds || ' seconds')::interval)
    ON CONFLICT (key) DO UPDATE SET
        data = EXCLUDED.data,
        provider = EXCLUDED.provider,
        expires_at = EXCLUDED.expires_at,
        created_at = now();
END;
$$;

-- Cleanup: delete expired entries (call periodically or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_market_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.market_cache WHERE expires_at < now();
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- Enable RLS
ALTER TABLE public.market_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role via server client)
CREATE POLICY "Allow authenticated read" ON public.market_cache
    FOR SELECT TO authenticated USING (true);
