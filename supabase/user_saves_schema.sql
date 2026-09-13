-- Persistence for signed-in Google users. Guest / demo sessions stay in localStorage.
-- Run in the Supabase SQL editor (idempotent). The app fail-softs to localStorage
-- until these tables exist.
-- If save works but delete does not, run supabase/user_saves_delete.sql (GRANT DELETE + RPCs).
--
--   saved_places      — places pinned to My Map
--   saved_itineraries — bookmarked trips (snapshot JSON)
--   user_itineraries  — trips the user built themselves
--
-- curator_itineraries lives in itineraries_schema.sql.

create table if not exists saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  snapshot jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table saved_places enable row level security;
grant select, insert, update, delete on table saved_places to authenticated;

do $$ begin
  create policy "users read own saved places" on saved_places for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users insert own saved places" on saved_places for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users update own saved places" on saved_places for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users delete own saved places" on saved_places for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create table if not exists saved_itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  itinerary_id text not null,
  source text not null,
  snapshot jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  unique (user_id, itinerary_id)
);

alter table saved_itineraries enable row level security;
grant select, insert, update, delete on table saved_itineraries to authenticated;

do $$ begin
  create policy "users read own saved itineraries" on saved_itineraries for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users insert own saved itineraries" on saved_itineraries for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users update own saved itineraries" on saved_itineraries for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users delete own saved itineraries" on saved_itineraries for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create table if not exists user_itineraries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  days jsonb not null default '[]'::jsonb,
  estimated_spend_usd integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_itineraries enable row level security;
grant select, insert, update, delete on table user_itineraries to authenticated;

do $$ begin
  create policy "users read own itineraries" on user_itineraries for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users insert own itineraries" on user_itineraries for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users update own itineraries" on user_itineraries for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users delete own itineraries" on user_itineraries for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
