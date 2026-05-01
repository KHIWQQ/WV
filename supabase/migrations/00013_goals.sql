-- ──────────────────────────────────────────────────────────────────────
-- 00013_goals.sql
--
-- Financial goals (Phase 7 of the roadmap).
--
-- Each user can have N goals (house, education, emergency fund, etc.).
-- Goals have a target amount + optional target date + an optional monthly
-- contribution the user has committed to. `current_amount` is updated by
-- the user manually for now; auto-linking to specific assets is a Phase 7+
-- follow-up.
--
-- Soft delete + audit conventions match assets/liabilities/transactions.
-- ──────────────────────────────────────────────────────────────────────

create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  goal_type text not null, -- house | car | education | emergency_fund | retirement | other
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  target_date date,
  monthly_contribution numeric default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index goals_user_live_idx
  on public.goals(user_id)
  where deleted_at is null;

alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete using (auth.uid() = user_id);

-- Soft-delete RPC mirroring soft_delete_asset/_liability/_transaction
create or replace function public.soft_delete_goal(p_id uuid)
returns void language plpgsql security invoker as $$
begin
  update public.goals
  set deleted_at = now()
  where id = p_id and user_id = auth.uid() and deleted_at is null;
end;
$$;
