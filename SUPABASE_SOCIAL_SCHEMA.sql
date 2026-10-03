create extension if not exists pgcrypto;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author text not null,
  content text not null,
  type text not null check (type in ('discussion', 'testimony')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  replies integer not null default 0,
  timestamp timestamptz not null default now()
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author text not null,
  request text not null,
  prayers integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'archived')),
  timestamp timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.prayer_reactions (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (prayer_id, user_id)
);

create table if not exists public.sermon_comments (
  id uuid primary key default gen_random_uuid(),
  sermon_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sermon_reactions (
  id uuid primary key default gen_random_uuid(),
  sermon_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sermon_id, user_id)
);

create table if not exists public.media_posts (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  caption text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.media_post_reactions (
  id uuid primary key default gen_random_uuid(),
  media_post_id uuid not null references public.media_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (media_post_id, user_id)
);

create table if not exists public.media_post_comments (
  id uuid primary key default gen_random_uuid(),
  media_post_id uuid not null references public.media_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.community_replies enable row level security;
alter table public.prayer_reactions enable row level security;
alter table public.sermon_comments enable row level security;
alter table public.sermon_reactions enable row level security;
alter table public.media_posts enable row level security;
alter table public.media_post_reactions enable row level security;
alter table public.media_post_comments enable row level security;

create or replace function public.increment_post_replies(post_id_input uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.community_posts
  set replies = replies + 1
  where id = post_id_input;
$$;

alter table public.community_posts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.community_posts add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'));
alter table public.prayer_requests add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.media_posts add column if not exists storage_path text;
update public.community_posts set status = 'approved' where status is null;

drop policy if exists "community posts readable" on public.community_posts;
create policy "community posts readable"
on public.community_posts
for select
to authenticated
using (
  status = 'approved'
  or user_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "community posts insertable" on public.community_posts;
create policy "community posts insertable"
on public.community_posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community posts update by admin" on public.community_posts;
create policy "community posts update by admin"
on public.community_posts
for update
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

drop policy if exists "community posts deletable by admin" on public.community_posts;
create policy "community posts deletable by admin"
on public.community_posts
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "community replies readable" on public.community_replies;
create policy "community replies readable"
on public.community_replies
for select
to authenticated
using (true);

drop policy if exists "community replies insert own" on public.community_replies;
create policy "community replies insert own"
on public.community_replies
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prayer requests readable" on public.prayer_requests;
create policy "prayer requests readable"
on public.prayer_requests
for select
to authenticated
using (
  status = 'approved'
  or user_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "prayer requests insertable" on public.prayer_requests;
create policy "prayer requests insertable"
on public.prayer_requests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prayer requests updatable" on public.prayer_requests;
create policy "prayer requests updatable"
on public.prayer_requests
for update
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

drop policy if exists "prayer requests deletable by admin" on public.prayer_requests;
create policy "prayer requests deletable by admin"
on public.prayer_requests
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "prayer reactions readable" on public.prayer_reactions;
create policy "prayer reactions readable"
on public.prayer_reactions
for select
to authenticated
using (true);

drop policy if exists "prayer reactions insert own" on public.prayer_reactions;
create policy "prayer reactions insert own"
on public.prayer_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "prayer reactions delete own" on public.prayer_reactions;
create policy "prayer reactions delete own"
on public.prayer_reactions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "sermon comments readable" on public.sermon_comments;
create policy "sermon comments readable"
on public.sermon_comments
for select
to authenticated
using (true);

drop policy if exists "sermon comments insert own" on public.sermon_comments;
create policy "sermon comments insert own"
on public.sermon_comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "sermon reactions readable" on public.sermon_reactions;
create policy "sermon reactions readable"
on public.sermon_reactions
for select
to authenticated
using (true);

drop policy if exists "sermon reactions insert own" on public.sermon_reactions;
create policy "sermon reactions insert own"
on public.sermon_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "sermon reactions delete own" on public.sermon_reactions;
create policy "sermon reactions delete own"
on public.sermon_reactions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "media posts readable" on public.media_posts;
create policy "media posts readable"
on public.media_posts
for select
to authenticated
using (true);

drop policy if exists "media posts insertable by admin" on public.media_posts;
create policy "media posts insertable by admin"
on public.media_posts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "media posts deletable by admin" on public.media_posts;
create policy "media posts deletable by admin"
on public.media_posts
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "media post reactions readable" on public.media_post_reactions;
create policy "media post reactions readable"
on public.media_post_reactions
for select
to authenticated
using (true);

drop policy if exists "media post reactions insert own" on public.media_post_reactions;
create policy "media post reactions insert own"
on public.media_post_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "media post reactions delete own" on public.media_post_reactions;
create policy "media post reactions delete own"
on public.media_post_reactions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "media post comments readable" on public.media_post_comments;
create policy "media post comments readable"
on public.media_post_comments
for select
to authenticated
using (true);

drop policy if exists "media post comments insert own" on public.media_post_comments;
create policy "media post comments insert own"
on public.media_post_comments
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.cleanup_expired_social_content()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where bucket_id = 'gallery'
    and name in (
      select storage_path
      from public.media_posts
      where storage_path is not null
        and created_at < now() - interval '30 days'
    );

  delete from public.media_posts
  where created_at < now() - interval '30 days';

  delete from public.community_posts where timestamp < now() - interval '30 days';
  delete from public.prayer_requests where timestamp < now() - interval '30 days';
end;
$$;

grant execute on function public.cleanup_expired_social_content() to authenticated;

create extension if not exists pg_cron;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'cleanup-expired-social-content-daily'
  ) then
    perform cron.schedule(
      'cleanup-expired-social-content-daily',
      '0 3 * * *',
      'select public.cleanup_expired_social_content();'
    );
  end if;
exception
  when undefined_table or insufficient_privilege then
    null;
end;
$$;
