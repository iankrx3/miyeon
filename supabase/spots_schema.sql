-- Spot catalog: the real place data behind itinerary generation.
--
-- This mirrors the `Spot` TypeScript interface (src/types.ts) column-for-column,
-- snake_case. It is created empty on purpose — rows are entered by hand (sourced
-- from Creatrip research), not synced from any API. The app's recommendation
-- engine (src/services/itinerary/generate.ts) still reads from the static
-- src/data/spots.ts array for now; wiring getSpot()/getSpots() to read from this
-- table is a separate follow-up once it has real data in it.
--
-- create table if not exists is a no-op against the live project — this file
-- exists for documentation/reproducibility of the table already created there.
create table if not exists spots (
  id text primary key,
  name text not null,
  parent_category text not null check (parent_category in ('hair-salon','k-beauty','dermatology')),
  subcategory text not null check (subcategory in (
    'color-perm','head-spa','hair-makeup','hair-extensions','color-analysis',
    'beauty-makeup','nail-art','permanent-makeup','waxing','glasses',
    'id-portrait','aesthetics','skin-care','shopping'
  )),
  description text,
  area text check (area in ('Gangnam','Seongsu','Hongdae','Myeongdong')),
  address text,
  latitude double precision,
  longitude double precision,
  price_min integer,
  price_max integer,
  duration_min integer,
  opening_hours text,
  booking_required boolean not null default false,
  booking_url text,
  languages text[] not null default '{}',
  downtime text check (downtime in ('none','few-hours','1-day','2-3-days')),
  procedure_intensity text check (procedure_intensity in ('low','medium','high')),
  needle_required boolean not null default false,
  tourist_friendly boolean not null default true,
  factory_like boolean not null default false,
  upselling_risk boolean not null default false,
  price_transparency boolean not null default true,
  images text[] not null default '{}',
  rating numeric,
  review_count integer default 0,
  experience_style text check (experience_style in ('relaxing','professional','medical','korean')),
  google_place_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table spots enable row level security;

-- Spot content is public, like the rest of the catalog — anyone can read.
create policy "public read spots" on spots for select using (true);

-- No insert/update/delete policy for anon/authenticated: rows are entered via
-- the Supabase SQL editor/dashboard under the service role, which bypasses RLS.
