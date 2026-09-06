-- Curator itineraries. Run once in the Supabase SQL editor. The app falls back
-- to localStorage (src/lib/localItineraryStore.ts) until this table exists.
-- Existing creator_lists / list_spots are left in place; the product no longer
-- writes them.

create table if not exists curator_itineraries (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references creators(id) on delete cascade,
  title text not null,
  description text,
  days jsonb not null default '[]'::jsonb,
  estimated_spend_usd integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table curator_itineraries enable row level security;

create policy "public read curator itineraries" on curator_itineraries for select using (true);

create policy "curators insert own itineraries" on curator_itineraries for insert
  with check (auth.uid() = (select user_id from creators where creators.id = curator_id));

create policy "curators update own itineraries" on curator_itineraries for update
  using (auth.uid() = (select user_id from creators where creators.id = curator_id));

create policy "curators delete own itineraries" on curator_itineraries for delete
  using (auth.uid() = (select user_id from creators where creators.id = curator_id));
