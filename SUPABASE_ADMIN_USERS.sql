create table if not exists public.blocked_emails (
  email text primary key,
  blocked_at timestamptz not null default now(),
  blocked_by uuid references auth.users(id) on delete set null
);

alter table public.blocked_emails enable row level security;
alter table public.profiles enable row level security;

create or replace function public.is_admin_user(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id and is_admin = true
  );
$$;

create or replace function public.is_email_blocked(email_input text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.blocked_emails
    where email = lower(trim(coalesce(email_input, '')))
  );
$$;

drop policy if exists "admins can read all profiles" on public.profiles;
create policy "admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admins can manage blocked emails" on public.blocked_emails;
create policy "admins can manage blocked emails"
on public.blocked_emails
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create or replace function public.block_blocked_email_signups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.blocked_emails
    where email = lower(coalesce(new.email, ''))
  ) then
    raise exception 'This email address has been blocked.';
  end if;

  return new;
end;
$$;

drop trigger if exists before_auth_user_insert_blocked_email on auth.users;
create trigger before_auth_user_insert_blocked_email
before insert on auth.users
for each row
execute function public.block_blocked_email_signups();

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_email text;
begin
  if not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorized.';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'Admins cannot delete themselves from the app.';
  end if;

  select email into target_email
  from public.profiles
  where id = target_user_id;

  if target_email is null then
    raise exception 'User not found.';
  end if;

  insert into public.blocked_emails (email, blocked_by)
  values (lower(target_email), auth.uid())
  on conflict (email) do update
    set blocked_at = now(),
        blocked_by = excluded.blocked_by;

  delete from auth.users
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.is_admin_user(uuid) to authenticated;
grant execute on function public.is_email_blocked(text) to anon, authenticated;
