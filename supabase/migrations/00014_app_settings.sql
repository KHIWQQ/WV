-- ──────────────────────────────────────────────────────────────────────
-- 00014_app_settings.sql
--
-- Singleton table holding app-wide feature-flag settings, controlled
-- from /dashboard/admin/features by superadmin.
--
-- Initial use case: a "free promo mode" master switch the founder can
-- flip on to make every premium-gated feature accessible to all users
-- (for marketing / customer acquisition) without changing per-user
-- subscription_tier values.
--
-- Schema is forward-compatible: `feature_overrides` JSONB lets us add
-- granular per-feature toggles in Phase 2 without another migration.
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.app_settings (
  id            int        primary key default 1,
  -- Master kill-switch. When true, requirePremium() and <PremiumGate>
  -- bypass all checks.
  all_features_free boolean    not null default false,
  -- Per-feature overrides for Phase 2:
  --   { "portfolio_analytics": "free" | "premium",
  --     "retirement_planning": "free" | "premium", ... }
  -- Empty object = use defaults (everything in PREMIUM_FEATURES is gated).
  feature_overrides jsonb     not null default '{}'::jsonb,
  updated_at        timestamptz not null default now(),
  updated_by        uuid       references public.profiles(id) on delete set null,
  -- Enforce singleton: only ever one row.
  constraint app_settings_singleton check (id = 1)
);

-- Seed the row so getAppSettings() never returns null.
insert into public.app_settings (id) values (1)
  on conflict (id) do nothing;

-- Read-only for everyone signed in. Writes via service-role from the
-- updateAppSettings() server action (which checks superadmin role).
alter table public.app_settings enable row level security;

create policy "Anyone authenticated can read app settings"
  on public.app_settings for select
  using (auth.role() = 'authenticated');

-- No INSERT/UPDATE/DELETE policies for non-service roles. The seed row
-- already exists; updates flow through the service-role action which
-- bypasses RLS.
