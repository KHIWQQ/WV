-- ==========================================
-- Salary Management
-- A monthly salary ledger tailored to Thai (military) payroll plus a
-- per-user GPF (กบข.) cumulative snapshot.
--
--   salary_records      — one row per month (or back-pay adjustment).
--                         RTA gross + extra income streams + deduction
--                         line items (jsonb) + government GPF contributions
--                         (jsonb, not deducted from pay).
--   salary_gpf_summary  — one row per user; the cumulative กบข. statement
--                         (principal/gains, personal vs government, อทบ.).
--
-- Mirrors the transactions table conventions: soft-delete, RLS keyed on
-- auth.uid(), partial live index, and a soft_delete RPC.
-- ==========================================

-- ─── 1. salary_records ───────────────────────────────────────────
create table if not exists public.salary_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  -- First day of the salary month, e.g. 2025-01-01.
  period date not null,
  -- Officer rank key (see MILITARY_RANKS in code), e.g. '2nd_lieutenant'.
  rank text,
  -- Free-text pay-step label as printed on the slip, e.g. 'น.1 ชั้น 22.5'.
  pay_step text,
  -- Gross Royal Thai Army salary (deductions apply to this).
  gross_rta numeric not null default 0,
  -- Extra income streams tracked alongside the salary.
  income_tiny numeric not null default 0,
  income_sckt numeric not null default 0,
  -- Deduction line items withheld from gross_rta. Map of { typeKey: amount }.
  deductions jsonb not null default '{}'::jsonb,
  -- Government GPF contributions (สมทบ/ชดเชย). NOT withheld from pay; they
  -- flow into the กบข. fund. Map of { typeKey: amount }.
  gov_contrib jsonb not null default '{}'::jsonb,
  -- Marks a back-pay / adjustment entry (ตกเบิก) so it can sit alongside the
  -- regular row for the same period.
  is_backpay boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Only index live rows, ordered for the ledger view (newest first).
create index if not exists idx_salary_records_user_live
  on public.salary_records (user_id, period desc) where deleted_at is null;

alter table public.salary_records enable row level security;

drop policy if exists "Users read own salary records" on public.salary_records;
create policy "Users read own salary records"
  on public.salary_records for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own salary records" on public.salary_records;
create policy "Users insert own salary records"
  on public.salary_records for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update own salary records" on public.salary_records;
create policy "Users update own salary records"
  on public.salary_records for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users delete own salary records" on public.salary_records;
create policy "Users delete own salary records"
  on public.salary_records for delete to authenticated
  using (user_id = auth.uid());

-- ─── 2. salary_gpf_summary ───────────────────────────────────────
-- One snapshot row per user. Totals (own_total / gov_total / grand) are
-- derived in the app from the principal + gain columns.
create table if not exists public.salary_gpf_summary (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  -- Personal กบข. portion.
  own_principal numeric not null default 0,  -- ต้น
  own_gain numeric not null default 0,       -- กำไร
  -- Government กบข. portion (รัฐ).
  gov_principal numeric not null default 0,  -- ต้น รัฐ
  gov_gain numeric not null default 0,       -- กำไร รัฐ
  -- อทบ. (savings deposit) accumulated balance.
  atb_balance numeric not null default 0,
  -- Statement date the snapshot reflects.
  as_of date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.salary_gpf_summary enable row level security;

drop policy if exists "Users read own gpf summary" on public.salary_gpf_summary;
create policy "Users read own gpf summary"
  on public.salary_gpf_summary for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own gpf summary" on public.salary_gpf_summary;
create policy "Users insert own gpf summary"
  on public.salary_gpf_summary for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update own gpf summary" on public.salary_gpf_summary;
create policy "Users update own gpf summary"
  on public.salary_gpf_summary for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── 3. soft-delete RPC ──────────────────────────────────────────
create or replace function public.soft_delete_salary_record(p_id uuid)
returns void language plpgsql security invoker as $$
begin
  update public.salary_records set deleted_at = now()
  where id = p_id and user_id = auth.uid() and deleted_at is null;
end;
$$;
