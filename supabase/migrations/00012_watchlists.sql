-- ──────────────────────────────────────────────────────────────────────
-- 00012_watchlists.sql
--
-- Watchlist tables. The server actions in `src/lib/actions/watchlist.ts`
-- and the `<AddToWatchlistDialog>` UI have existed in the codebase for a
-- while but the underlying tables were never migrated, so any runtime
-- call to these features would fail with "relation does not exist".
-- This migration plumbs the schema so the existing TypeScript actually
-- works against the database.
--
-- Schema:
--   watchlists           : a user can have N named lists ("Tech", "Thai banks")
--   watchlist_items      : symbols within a list
--
-- Hard-delete only — watchlist data isn't financially sensitive, so the
-- soft-delete + audit pattern used for assets/liabilities/transactions
-- isn't required here. Server-side actions still call logAudit on
-- mutation as a usage-tracking signal (see audit.ts for action types).
-- ──────────────────────────────────────────────────────────────────────

-- Watchlists
create table public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index watchlists_user_id_idx on public.watchlists(user_id);

alter table public.watchlists enable row level security;

create policy "Users can view own watchlists"
  on public.watchlists for select using (auth.uid() = user_id);

create policy "Users can insert own watchlists"
  on public.watchlists for insert with check (auth.uid() = user_id);

create policy "Users can update own watchlists"
  on public.watchlists for update using (auth.uid() = user_id);

create policy "Users can delete own watchlists"
  on public.watchlists for delete using (auth.uid() = user_id);

-- Watchlist items
create table public.watchlist_items (
  id uuid default gen_random_uuid() primary key,
  watchlist_id uuid references public.watchlists(id) on delete cascade not null,
  symbol text not null,
  display_name text not null,
  asset_type text not null,
  exchange text,
  sort_order int not null default 0,
  added_at timestamptz not null default now(),
  -- prevent the same symbol appearing twice in one list (matches the 23505
  -- handling in addWatchlistItem)
  unique(watchlist_id, symbol)
);

create index watchlist_items_watchlist_id_idx on public.watchlist_items(watchlist_id);

alter table public.watchlist_items enable row level security;

-- Item policies authorize via ownership of the parent watchlist.
create policy "Users can view items in own watchlists"
  on public.watchlist_items for select using (
    exists (
      select 1 from public.watchlists w
      where w.id = watchlist_items.watchlist_id and w.user_id = auth.uid()
    )
  );

create policy "Users can insert items in own watchlists"
  on public.watchlist_items for insert with check (
    exists (
      select 1 from public.watchlists w
      where w.id = watchlist_items.watchlist_id and w.user_id = auth.uid()
    )
  );

create policy "Users can update items in own watchlists"
  on public.watchlist_items for update using (
    exists (
      select 1 from public.watchlists w
      where w.id = watchlist_items.watchlist_id and w.user_id = auth.uid()
    )
  );

create policy "Users can delete items in own watchlists"
  on public.watchlist_items for delete using (
    exists (
      select 1 from public.watchlists w
      where w.id = watchlist_items.watchlist_id and w.user_id = auth.uid()
    )
  );
