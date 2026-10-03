create or replace function public.admin_stats_user_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint from public.profiles;
$$;

grant execute on function public.admin_stats_user_count() to authenticated;
