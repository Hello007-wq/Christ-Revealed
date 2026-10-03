create extension if not exists pgcrypto;

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.device_push_tokens enable row level security;

drop policy if exists "users can read own push tokens" on public.device_push_tokens;
create policy "users can read own push tokens"
on public.device_push_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own push tokens" on public.device_push_tokens;
create policy "users can insert own push tokens"
on public.device_push_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own push tokens" on public.device_push_tokens;
create policy "users can update own push tokens"
on public.device_push_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admins can read all push tokens" on public.device_push_tokens;
create policy "admins can read all push tokens"
on public.device_push_tokens
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
