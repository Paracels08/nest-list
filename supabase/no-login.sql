-- Nest List without accounts. Paste all of this into Supabase -> SQL Editor -> New query, then Run.
-- Run setup.sql first on a brand-new project. Safe to run more than once.
--
-- Each list gets a secret key. The app opens a list with a link like .../nest-list/?list=<key>.
-- Anyone who has the link can see and change that list; without it, nothing can be read.
-- The tables stay locked (row-level security, no public rules). The app only reaches them
-- through the three functions below, which each need the list's key.

alter table public.lists alter column owner drop not null;
alter table public.lists add column if not exists share_key text;
update public.lists set share_key = replace(gen_random_uuid()::text, '-', '') where share_key is null;
alter table public.lists alter column share_key set default replace(gen_random_uuid()::text, '-', '');
alter table public.lists alter column share_key set not null;
create unique index if not exists lists_share_key on public.lists(share_key);

create or replace function public.nest_get(k text) returns jsonb
language sql stable security definer set search_path = public as
$$ select data from public.lists where share_key = k $$;

create or replace function public.nest_save(k text, d jsonb) returns void
language sql security definer set search_path = public as
$$ update public.lists set data = d, updated_at = now() where share_key = k $$;

create or replace function public.nest_create(d jsonb) returns text
language sql security definer set search_path = public as
$$ insert into public.lists (owner, data) values (null, d) returning share_key $$;

revoke all on function public.nest_get(text), public.nest_save(text, jsonb), public.nest_create(jsonb) from public;
grant execute on function public.nest_get(text), public.nest_save(text, jsonb), public.nest_create(jsonb) to anon, authenticated;

-- Your existing list's link. Open it on each phone (it replaces signing in).
select 'https://paracels08.github.io/nest-list/?list=' || share_key as your_link, updated_at
from public.lists order by updated_at desc;
