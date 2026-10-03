create extension if not exists pgcrypto;

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text not null,
  date text not null,
  duration integer not null default 0,
  media_type text not null check (media_type in ('audio', 'video')),
  image_url text,
  media_url text,
  mp3_url text,
  tags_json text not null default '[]',
  views integer not null default 0,
  downloads integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.merchandise (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price real not null default 0,
  description text,
  image_url text,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sermon_views (
  sermon_id uuid not null references public.sermons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (sermon_id, user_id)
);

alter table public.media_posts
  add column if not exists gallery_group_id text,
  add column if not exists gallery_index integer not null default 0;

alter table public.sermons enable row level security;
alter table public.merchandise enable row level security;
alter table public.sermon_views enable row level security;

drop policy if exists "sermons readable" on public.sermons;
create policy "sermons readable"
on public.sermons
for select
to authenticated
using (true);

drop policy if exists "admins can manage sermons" on public.sermons;
create policy "admins can manage sermons"
on public.sermons
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "merch readable" on public.merchandise;
create policy "merch readable"
on public.merchandise
for select
to authenticated
using (true);

drop policy if exists "admins can manage merch" on public.merchandise;
create policy "admins can manage merch"
on public.merchandise
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "sermon views insert own" on public.sermon_views;
create policy "sermon views insert own"
on public.sermon_views
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "sermon views readable by admin" on public.sermon_views;
create policy "sermon views readable by admin"
on public.sermon_views
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

create or replace function public.increment_sermon_view(sermon_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.sermon_views (sermon_id, user_id)
  values (sermon_id_input, auth.uid())
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.sermons
    set views = views + 1
    where id = sermon_id_input;
  end if;
end;
$$;

create or replace function public.increment_sermon_download(sermon_id_input uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.sermons
  set downloads = downloads + 1
  where id = sermon_id_input;
$$;

grant execute on function public.increment_sermon_view(uuid) to authenticated;
grant execute on function public.increment_sermon_download(uuid) to authenticated;
