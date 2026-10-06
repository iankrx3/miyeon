-- Visitor behavior for /insights. Run once in the Supabase SQL editor. Not applied automatically.
--
-- Anyone can insert a row (the public site). Only emails listed in analytics_readers can select.

create table if not exists analytics_readers (
  email text primary key
);

create table if not exists product_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  visitor_id text not null,
  path text,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_created_at_idx on product_events (created_at desc);

alter table analytics_readers enable row level security;
alter table product_events enable row level security;

-- No select policy on analytics_readers. The definer function below is the only reader.

create or replace function public.is_analytics_reader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from analytics_readers r
    where lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.product_event_props_ok(props jsonb)
returns boolean
language sql
stable
as $$
  select
    props is not null
    and octet_length(props::text) <= 2000
    and props::text !~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
    and (
      select coalesce(bool_and(key = any (array[
        'lang','path','entry','step','city','trip_days','budget_band','place_count',
        'subtype','surface','ok','category','area',
        'utm_source','utm_medium','utm_campaign','utm_content','picked'
      ])), true)
      from jsonb_object_keys(props) as key
    );
$$;

drop policy if exists "anyone can insert a product event" on product_events;
create policy "anyone can insert a product event" on product_events
  for insert
  to anon, authenticated
  with check (
    name = any (array[
      'page_view','quiz_start','quiz_step','quiz_complete',
      'result_view','outbound_click','plan_email','map_pin'
    ])
    and char_length(visitor_id) between 8 and 64
    and char_length(coalesce(path, '')) <= 200
    and public.product_event_props_ok(props)
  );

drop policy if exists "readers can select product events" on product_events;
create policy "readers can select product events" on product_events
  for select
  to authenticated
  using (public.is_analytics_reader());

revoke all on function public.is_analytics_reader() from public;
revoke all on function public.product_event_props_ok(jsonb) from public;
grant execute on function public.is_analytics_reader() to authenticated;
-- Insert checks call this as the visitor, so anon must be allowed to execute it.
grant execute on function public.product_event_props_ok(jsonb) to anon, authenticated;

grant insert on table public.product_events to anon, authenticated;
grant select on table public.product_events to authenticated;

insert into analytics_readers (email) values ('iankrx3@gmail.com'), ('seungchan0605@gmail.com')
on conflict (email) do nothing;
