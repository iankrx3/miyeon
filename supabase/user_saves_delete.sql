-- Ensure signed-in users can DELETE their own saves.
-- Tables already exist (SELECT/INSERT work). PostgREST DELETE was a no-op or 401
-- because GRANT DELETE / DELETE RLS never landed on the live project.
--
-- Idempotent. Run in the Supabase SQL editor (or `apply_migration`).
-- Does not drop data.

grant select, insert, update, delete on table saved_places to authenticated;
grant select, insert, update, delete on table saved_itineraries to authenticated;
grant select, insert, update, delete on table user_itineraries to authenticated;

alter table saved_places enable row level security;
alter table saved_itineraries enable row level security;
alter table user_itineraries enable row level security;

drop policy if exists "users delete own saved places" on saved_places;
create policy "users delete own saved places"
  on saved_places for delete
  using (auth.uid() = user_id);

drop policy if exists "users delete own saved itineraries" on saved_itineraries;
create policy "users delete own saved itineraries"
  on saved_itineraries for delete
  using (auth.uid() = user_id);

drop policy if exists "users delete own itineraries" on user_itineraries;
create policy "users delete own itineraries"
  on user_itineraries for delete
  using (auth.uid() = user_id);

-- Explicit delete RPCs so the client can tell 0-row (RLS miss) from success.
create or replace function delete_own_saved_place(p_place_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from saved_places
  where user_id = auth.uid()
    and place_id = p_place_id;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function delete_own_user_itinerary(p_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from user_itineraries
  where user_id = auth.uid()
    and id = p_id;
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function delete_own_saved_itinerary(p_itinerary_id text, p_row_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from saved_itineraries
  where user_id = auth.uid()
    and (
      itinerary_id = p_itinerary_id
      or (p_row_id is not null and id = p_row_id)
    );
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function delete_own_saved_place(text) from public, anon;
revoke all on function delete_own_user_itinerary(text) from public, anon;
revoke all on function delete_own_saved_itinerary(text, uuid) from public, anon;
grant execute on function delete_own_saved_place(text) to authenticated;
grant execute on function delete_own_user_itinerary(text) to authenticated;
grant execute on function delete_own_saved_itinerary(text, uuid) to authenticated;
