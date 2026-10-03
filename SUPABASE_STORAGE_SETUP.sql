insert into storage.buckets (id, name, public)
values ('merch', 'merch', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('news', 'news', true)
on conflict (id) do nothing;

drop policy if exists "Merch images are public" on storage.objects;
create policy "Merch images are public"
on storage.objects
for select
to public
using (bucket_id = 'merch');

drop policy if exists "Admins can upload merch images" on storage.objects;
create policy "Admins can upload merch images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'merch'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can update merch images" on storage.objects;
create policy "Admins can update merch images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'merch'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
)
with check (
  bucket_id = 'merch'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can delete merch images" on storage.objects;
create policy "Admins can delete merch images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'merch'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Gallery images are public" on storage.objects;
create policy "Gallery images are public"
on storage.objects
for select
to public
using (bucket_id = 'gallery');

drop policy if exists "Admins can upload gallery images" on storage.objects;
create policy "Admins can upload gallery images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can delete gallery images" on storage.objects;
create policy "Admins can delete gallery images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "News media are public" on storage.objects;
create policy "News media are public"
on storage.objects
for select
to public
using (bucket_id = 'news');

drop policy if exists "Admins can upload news media" on storage.objects;
create policy "Admins can upload news media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'news'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "Admins can delete news media" on storage.objects;
create policy "Admins can delete news media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'news'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
