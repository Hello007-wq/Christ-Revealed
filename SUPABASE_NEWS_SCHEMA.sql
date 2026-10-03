create extension if not exists pgcrypto;

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  headline text,
  body text,
  caption text,
  story_group_id text,
  media_index integer not null default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.news_posts add column if not exists headline text;
alter table public.news_posts add column if not exists body text;
alter table public.news_posts add column if not exists story_group_id text;
alter table public.news_posts add column if not exists media_index integer not null default 0;

create table if not exists public.news_reactions (
  id uuid primary key default gen_random_uuid(),
  news_post_id uuid not null references public.news_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (news_post_id, user_id)
);

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  news_post_id uuid not null references public.news_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.news_posts enable row level security;
alter table public.news_reactions enable row level security;
alter table public.news_comments enable row level security;

drop policy if exists "news posts readable" on public.news_posts;
create policy "news posts readable"
on public.news_posts
for select
to authenticated
using (true);

drop policy if exists "news posts insertable by admin" on public.news_posts;
create policy "news posts insertable by admin"
on public.news_posts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "news posts deletable by admin" on public.news_posts;
create policy "news posts deletable by admin"
on public.news_posts
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "news reactions readable" on public.news_reactions;
create policy "news reactions readable"
on public.news_reactions
for select
to authenticated
using (true);

drop policy if exists "news reactions insert own" on public.news_reactions;
create policy "news reactions insert own"
on public.news_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "news reactions delete own" on public.news_reactions;
create policy "news reactions delete own"
on public.news_reactions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "news comments readable" on public.news_comments;
create policy "news comments readable"
on public.news_comments
for select
to authenticated
using (true);

drop policy if exists "news comments insert own" on public.news_comments;
create policy "news comments insert own"
on public.news_comments
for insert
to authenticated
with check (auth.uid() = user_id);
