-- Curated Creatrip-listed venues for the Glow Up V2 result (real places on a map, each with a
-- direct Creatrip booking page). Run in the Supabase SQL editor, then run seed_places.sql.
-- The app reads these tables and falls back to src/data/glowUpPlaces.json when they are empty
-- or Supabase isn't configured.

create table if not exists public.places (
  id text primary key,                       -- Creatrip spot id -> https://creatrip.com/en/spot/{id}
  name text not null,
  branch text,
  tagline text,
  subtype text not null check (subtype in
    ('skin','face','hair','nail','personal-color','makeup','permanent-makeup','photo','sauna','scrub','massage','yoga')),
  extra_subtypes text[] not null default '{}',
  city text not null default 'seoul' check (city in ('seoul','busan')),
  region text,
  address_en text,
  address_ko text,
  lat double precision,
  lng double precision,
  coord_approx boolean not null default false,   -- true = district-centre fallback, not a geocoded address
  rating numeric(3,2),
  review_count integer,
  languages text[] not null default '{}',
  korean_only_staff boolean not null default false,
  english_support boolean,
  subway text,
  hours text,
  price_from_usd numeric(10,2),
  minutes integer,
  downtime text check (downtime in ('none','mild','days')),
  downtime_note text,
  before_you_book text[] not null default '{}',
  reservation_confirm text,
  highlights text[] not null default '{}',
  verified_at timestamptz not null default now(),
  source text not null default 'creatrip'
);

create table if not exists public.place_products (
  place_id text not null references public.places(id) on delete cascade,
  position integer not null default 0,
  name text not null,
  price_usd numeric(10,2),
  original_price_usd numeric(10,2),
  booking_url text not null,
  primary key (place_id, position)
);

create index if not exists places_subtype_idx on public.places (subtype);
create index if not exists places_region_idx on public.places (region);

alter table public.places enable row level security;
alter table public.place_products enable row level security;

drop policy if exists "places are public" on public.places;
create policy "places are public" on public.places for select using (true);
drop policy if exists "place products are public" on public.place_products;
create policy "place products are public" on public.place_products for select using (true);
-- No insert/update/delete policies: writes happen through the SQL editor / service role only.
