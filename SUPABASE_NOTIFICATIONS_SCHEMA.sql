create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  scheduled_at timestamptz,
  sent boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

drop policy if exists "admins can read notifications" on public.notifications;
create policy "admins can read notifications"
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "users can read notifications" on public.notifications;
create policy "users can read notifications"
on public.notifications
for select
to authenticated
using (sent = true and (scheduled_at is null or scheduled_at <= now()));

drop policy if exists "admins can insert notifications" on public.notifications;
create policy "admins can insert notifications"
on public.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "admins can update notifications" on public.notifications;
create policy "admins can update notifications"
on public.notifications
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

drop policy if exists "users can read own notification reads" on public.notification_reads;
create policy "users can read own notification reads"
on public.notification_reads
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own notification reads" on public.notification_reads;
create policy "users can insert own notification reads"
on public.notification_reads
for insert
to authenticated
with check (auth.uid() = user_id);
