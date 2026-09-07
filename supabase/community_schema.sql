-- Community write features: posts, likes, comments.
-- Run once in the Supabase SQL editor for this project. Not applied automatically —
-- the app falls back to localStorage (see src/lib/localCommunityStore.ts) until these
-- tables exist, so it keeps working either way.

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar_url text,
  -- No FK: real place ids are dynamic (Google/KTO live search results). There
  -- is no `places` table anymore — it was an ad hoc, never-synced cache and
  -- has been dropped.
  place_id text,
  place_name text,
  treatment_name text,
  category text not null check (category in ('trending','treatment-reviews','seoul-places','questions')),
  text text not null,
  photos text[],
  rating numeric,
  created_at timestamptz not null default now()
);

create table if not exists post_likes (
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar_url text,
  text text not null,
  created_at timestamptz not null default now()
);

alter table community_posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- Anyone (including anonymous visitors, for the public /community/:id share URL) can read.
create policy "public read posts" on community_posts for select using (true);
create policy "public read likes" on post_likes for select using (true);
create policy "public read comments" on post_comments for select using (true);

-- Only the authenticated author may write, and only as themselves.
create policy "authors insert own posts" on community_posts for insert with check (auth.uid() = author_id);
create policy "authors delete own posts" on community_posts for delete using (auth.uid() = author_id);
create policy "users like as self" on post_likes for insert with check (auth.uid() = user_id);
create policy "users unlike as self" on post_likes for delete using (auth.uid() = user_id);
create policy "authors insert own comments" on post_comments for insert with check (auth.uid() = author_id);
create policy "authors delete own comments" on post_comments for delete using (auth.uid() = author_id);
