create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin audit readable by admin" on public.admin_audit_logs;
create policy "admin audit readable by admin"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "admin audit insertable by admin" on public.admin_audit_logs;
create policy "admin audit insertable by admin"
on public.admin_audit_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
