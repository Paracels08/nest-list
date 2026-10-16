-- Nest List database setup. Paste all of this into Supabase -> SQL Editor -> New query, then Run.
-- Safe to run more than once.

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create unique index if not exists lists_one_per_owner on public.lists(owner);

create table if not exists public.list_viewers (
  list_id uuid not null references public.lists on delete cascade,
  email text not null check (email = lower(email)),
  created_at timestamptz not null default now(),
  primary key (list_id, email)
);

alter table public.lists enable row level security;
alter table public.list_viewers enable row level security;

-- Helpers run with elevated rights so the two tables' rules can check each other without looping.
create or replace function public.owns_list(lid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.lists where id = lid and owner = auth.uid()) $$;

create or replace function public.views_list(lid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.list_viewers where list_id = lid and email = lower(coalesce(auth.jwt()->>'email', ''))) $$;

-- Lists: the owner reads and writes; people it is shared with can only read.
drop policy if exists "owner or viewer reads" on public.lists;
create policy "owner or viewer reads" on public.lists for select to authenticated
  using (owner = auth.uid() or public.views_list(id));
drop policy if exists "owner creates" on public.lists;
create policy "owner creates" on public.lists for insert to authenticated with check (owner = auth.uid());
drop policy if exists "owner updates" on public.lists;
create policy "owner updates" on public.lists for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "owner deletes" on public.lists;
create policy "owner deletes" on public.lists for delete to authenticated using (owner = auth.uid());

-- Sharing: only the owner adds or removes people; a person can see invites made to their own email.
drop policy if exists "owner manages sharing" on public.list_viewers;
create policy "owner manages sharing" on public.list_viewers for all to authenticated
  using (public.owns_list(list_id)) with check (public.owns_list(list_id));
drop policy if exists "invitee sees own invite" on public.list_viewers;
create policy "invitee sees own invite" on public.list_viewers for select to authenticated
  using (email = lower(coalesce(auth.jwt()->>'email', '')));

-- Live updates, so your partner's phone refreshes when you tick something.
do $$ begin
  alter publication supabase_realtime add table public.lists;
exception when duplicate_object then null; end $$;
