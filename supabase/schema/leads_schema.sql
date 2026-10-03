-- Quiz lead capture: the §02-9 "Consultation Card" email-capture form.
-- Run once in the Supabase SQL editor for this project. Not applied automatically — the app
-- falls back to localStorage (see src/lib/storage/localLeadStore.ts) until this table exists.
--
-- This is a write-only capture table: anyone can insert (it's a public lead-capture form), but
-- there is no select policy, so lead data is never publicly readable. Only saves the lead for
-- later manual/automated follow-up — nothing in this repo sends email off the back of it.

create table if not exists quiz_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  trip_date date,
  category text,
  concerns text[],
  vibes text[],
  top_treatment_id text,
  created_at timestamptz not null default now()
);

alter table quiz_leads enable row level security;

create policy "anyone can submit a lead" on quiz_leads for insert with check (true);
