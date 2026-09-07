-- Curator write features: profiles, lists, list spots.
-- Run once in the Supabase SQL editor for this project. Not applied automatically —
-- the app falls back to localStorage (see src/lib/localCuratorStore.ts) until these
-- tables exist, so it keeps working either way. Also fills a pre-existing gap:
-- `creators`/`creator_picks` were previously read by the app with no schema file.

create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  created_at timestamptz not null default now()
);

-- place_id intentionally has no FK: real place ids are dynamic (Google/KTO live
-- search results). There is no `places` table anymore — it was an ad hoc,
-- never-synced cache and has been dropped.
create table if not exists creator_picks (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  place_id text not null,
  personal_note text,
  created_at timestamptz not null default now()
);

create table if not exists creator_lists (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references creators(id) on delete cascade,
  title text not null,
  description text,
  cover_photo_url text,
  created_at timestamptz not null default now()
);

-- place_id intentionally has no FK to `places` — see note on creator_picks above.
-- place_snapshot stores the full Place object as of when it was added: since there's
-- no FK, PostgREST can't embed-join `places` (it resolves embeds from FK metadata
-- only), and `places` is never populated anyway — so place data is captured here
-- instead of joined at read time.
create table if not exists list_spots (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references creator_lists(id) on delete cascade,
  place_id text not null,
  place_snapshot jsonb not null default '{}'::jsonb,
  note text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table creators enable row level security;
alter table creator_picks enable row level security;
alter table creator_lists enable row level security;
alter table list_spots enable row level security;

-- Curator content is public, like an Instagram/TikTok profile — anyone can read.
create policy "public read creators" on creators for select using (true);
create policy "public read creator_picks" on creator_picks for select using (true);
create policy "public read creator_lists" on creator_lists for select using (true);
create policy "public read list_spots" on list_spots for select using (true);

-- Only the authenticated owner may write, and only as themselves.
create policy "users create own creator profile" on creators for insert with check (auth.uid() = user_id);
create policy "users update own creator profile" on creators for update using (auth.uid() = user_id);

create policy "curators manage own lists" on creator_lists for insert
  with check (auth.uid() = (select user_id from creators where creators.id = curator_id));
create policy "curators update own lists" on creator_lists for update
  using (auth.uid() = (select user_id from creators where creators.id = curator_id));
create policy "curators delete own lists" on creator_lists for delete
  using (auth.uid() = (select user_id from creators where creators.id = curator_id));

create policy "curators manage own list spots" on list_spots for insert
  with check (
    auth.uid() = (
      select creators.user_id from creators
      join creator_lists on creator_lists.curator_id = creators.id
      where creator_lists.id = list_id
    )
  );
create policy "curators delete own list spots" on list_spots for delete
  using (
    auth.uid() = (
      select creators.user_id from creators
      join creator_lists on creator_lists.curator_id = creators.id
      where creator_lists.id = list_id
    )
  );
