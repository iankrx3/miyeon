-- Creatrip place DB for the Glow Up result. One row per Creatrip spot, columns mirror places.csv
-- (the creatrip_place_DB scraper output). Run this, then seed_places.sql (scripts/build-places.mjs).
-- The app maps rows to GlowUpPlace in src/services/places/glowUpPlaces.ts and falls back to
-- src/data/glowUpPlaces.json (same rows) when the table is empty or Supabase isn't configured.

drop table if exists public.place_products cascade;
drop table if exists public.places cascade;

create table public.places (
  id text primary key,                         -- Creatrip spot id -> https://creatrip.com/en/spot/{id}
  name text not null,                          -- "Name | tagline" as listed on Creatrip
  subtype text not null check (subtype in
    ('dermatology','hair_salon','nail_art','personal_color','makeup','permanent_makeup','photo_studio',
     'sauna','body_scrub','massage','yoga_wellness')),
  extra_subtypes text[] not null default '{}',
  onboarding text not null check (onboarding in ('FIX','CHANGE','RESTORE','PHOTO')),
  city text not null,                          -- Seoul / Busan / Gyeonggi-do / Incheon
  region text,
  lat double precision,
  lng double precision,
  address text,                                -- Korean address
  nearest_station text,
  price_type text not null check (price_type in ('paid','deposit','free_reservation')),
  price_min_usd numeric(10,2),
  deposit_usd numeric(10,2),
  languages jsonb not null default '[]',       -- [{"code":"en","source":"listed"|"mentioned"}]
  duration_min integer,
  hours text,                                  -- "mon 10:00-19:00; tue closed; ..."
  closed_days text[] not null default '{}',
  fix_targets text[] not null default '{}',    -- face / skin
  procedures jsonb not null default '[]',      -- [{"key","downtime_grade","downtime_days_min","downtime_days_max"}]
  downtime_grade text check (downtime_grade in ('none','low','high')),
  downtime_days_max integer,
  needs_before text[] not null default '{}',
  rating numeric(2,1),
  review_count integer,
  active boolean not null default true,
  missing_fields text[] not null default '{}',
  url text not null,
  imported_at timestamptz not null default now()
);

create index places_subtype_idx on public.places (subtype);
create index places_city_region_idx on public.places (city, region);

alter table public.places enable row level security;

create policy "places are public" on public.places for select using (true);
-- No insert/update/delete policies: writes happen through the SQL editor / service role only.
