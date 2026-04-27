-- WealthView TH — Initial Schema
-- Phase 1: Core tables with Row Level Security

-- ────────────────────────────────────
-- 1. Profiles
-- ────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  avatar_url text,
  currency text not null default 'THB',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────
-- 2. Assets (ทรัพย์สิน)
-- ────────────────────────────────────
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null,
  name text not null,
  symbol text,
  quantity numeric not null default 0,
  cost_basis numeric not null default 0,
  current_price numeric not null default 0,
  current_value numeric not null default 0,
  currency text not null default 'THB',
  is_auto_update boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "Users can view own assets"
  on public.assets for select using (auth.uid() = user_id);

create policy "Users can insert own assets"
  on public.assets for insert with check (auth.uid() = user_id);

create policy "Users can update own assets"
  on public.assets for update using (auth.uid() = user_id);

create policy "Users can delete own assets"
  on public.assets for delete using (auth.uid() = user_id);

-- ────────────────────────────────────
-- 3. Liabilities (หนี้สิน)
-- ────────────────────────────────────
create table public.liabilities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null,
  principal numeric not null default 0,
  balance numeric not null default 0,
  interest_rate numeric not null default 0,
  monthly_payment numeric not null default 0,
  start_date date not null default current_date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.liabilities enable row level security;

create policy "Users can view own liabilities"
  on public.liabilities for select using (auth.uid() = user_id);

create policy "Users can insert own liabilities"
  on public.liabilities for insert with check (auth.uid() = user_id);

create policy "Users can update own liabilities"
  on public.liabilities for update using (auth.uid() = user_id);

create policy "Users can delete own liabilities"
  on public.liabilities for delete using (auth.uid() = user_id);

-- ────────────────────────────────────
-- 4. Transactions (รายรับ-รายจ่าย)
-- ────────────────────────────────────
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- income, expense, buy, sell
  category text not null,
  amount numeric not null default 0,
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete using (auth.uid() = user_id);

-- ────────────────────────────────────
-- 5. Net Worth History (snapshot รายวัน)
-- ────────────────────────────────────
create table public.net_worth_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  total_assets numeric not null default 0,
  total_liabilities numeric not null default 0,
  net_worth numeric not null default 0,
  asset_breakdown jsonb not null default '{}',
  recorded_at timestamptz not null default now()
);

alter table public.net_worth_history enable row level security;

create policy "Users can view own net worth history"
  on public.net_worth_history for select using (auth.uid() = user_id);

create policy "Users can insert own net worth history"
  on public.net_worth_history for insert with check (auth.uid() = user_id);

-- ────────────────────────────────────
-- 6. Price History (ประวัติราคา)
-- ────────────────────────────────────
create table public.price_history (
  id uuid default gen_random_uuid() primary key,
  symbol text not null,
  price numeric not null,
  currency text not null default 'THB',
  recorded_at timestamptz not null default now()
);

-- Price history is public read (no user-specific data)
alter table public.price_history enable row level security;

create policy "Anyone can read price history"
  on public.price_history for select using (true);

-- ────────────────────────────────────
-- Indexes
-- ────────────────────────────────────
create index idx_assets_user_id on public.assets(user_id);
create index idx_liabilities_user_id on public.liabilities(user_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(user_id, date desc);
create index idx_net_worth_history_user on public.net_worth_history(user_id, recorded_at desc);
create index idx_price_history_symbol on public.price_history(symbol, recorded_at desc);

-- ────────────────────────────────────
-- Updated_at trigger
-- ────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_assets_updated_at
  before update on public.assets
  for each row execute procedure public.update_updated_at();

create trigger set_liabilities_updated_at
  before update on public.liabilities
  for each row execute procedure public.update_updated_at();

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute procedure public.update_updated_at();
