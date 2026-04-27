-- ==========================================
-- Soft Delete + Audit Log
-- Adds deleted_at columns and a generic audit_log table
-- so we can recover deleted records and trace user/admin actions.
-- ==========================================

-- ─── 1. Soft-delete columns ──────────────────────────────────────
ALTER TABLE public.assets       ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.liabilities  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial indexes — only index live rows (smaller, faster filter pushdown)
CREATE INDEX IF NOT EXISTS idx_assets_user_live
    ON public.assets (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_liabilities_user_live
    ON public.liabilities (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user_live
    ON public.transactions (user_id, date DESC) WHERE deleted_at IS NULL;

-- ─── 2. Audit log table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
    id          bigserial PRIMARY KEY,
    user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action      text NOT NULL,           -- e.g. 'asset.create', 'liability.delete'
    entity_type text NOT NULL,           -- 'asset' | 'liability' | 'transaction' | 'profile' | ...
    entity_id   uuid,
    diff        jsonb,                   -- before/after snapshot (optional)
    metadata    jsonb,                   -- extra context (ip, user_agent, etc.)
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_time
    ON public.audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
    ON public.audit_log (entity_type, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit history
DROP POLICY IF EXISTS "Users read own audit log" ON public.audit_log;
CREATE POLICY "Users read own audit log"
    ON public.audit_log FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Inserts go through SECURITY DEFINER RPC below — no direct insert policy needed.

-- ─── 3. RPC: append audit entry ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_audit(
    p_action text,
    p_entity_type text,
    p_entity_id uuid,
    p_diff jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_log (user_id, actor_id, action, entity_type, entity_id, diff, metadata)
    VALUES (auth.uid(), auth.uid(), p_action, p_entity_type, p_entity_id, p_diff, p_metadata);
END;
$$;

-- ─── 4. RPC: soft-delete helpers ─────────────────────────────────
-- Centralized so callers don't need to know the column name.

CREATE OR REPLACE FUNCTION public.soft_delete_asset(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    UPDATE public.assets SET deleted_at = now()
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_liability(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    UPDATE public.liabilities SET deleted_at = now()
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_transaction(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    UPDATE public.transactions SET deleted_at = now()
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;
END;
$$;

-- ─── 5. RPC: restore (for admin / undo) ──────────────────────────
CREATE OR REPLACE FUNCTION public.restore_asset(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
    UPDATE public.assets SET deleted_at = NULL
    WHERE id = p_id AND user_id = auth.uid();
END;
$$;
