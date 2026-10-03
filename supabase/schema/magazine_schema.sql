-- Magazine write feature: curator-authored columns.
-- Run once in the Supabase SQL editor for this project. Not applied automatically —
-- the app falls back to localStorage (see src/lib/storage/localMagazineStore.ts) until this
-- table exists, so it keeps working either way.

create table if not exists magazine_articles (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references creators(id) on delete cascade,
  author_name text not null,
  author_avatar_url text,
  kind text not null check (kind in ('TREATMENT','GUIDE','TREND')),
  title text not null,
  excerpt text not null,
  body text not null,
  image_url text not null,
  minutes integer not null default 1,
  created_at timestamptz not null default now()
);

alter table magazine_articles enable row level security;

-- Anyone can read the magazine, like the community feed.
create policy "public read magazine_articles" on magazine_articles for select using (true);

-- Only a signed-in curator may publish, and only as themselves — mirrors the
-- creator_lists insert/delete policies in creators_schema.sql.
create policy "curators insert own articles" on magazine_articles for insert
  with check (
    auth.uid() = (select user_id from creators where creators.id = curator_id)
  );
create policy "curators delete own articles" on magazine_articles for delete
  using (
    auth.uid() = (select user_id from creators where creators.id = curator_id)
  );
