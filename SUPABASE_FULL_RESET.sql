-- Full content reset for Christ Revealed app
-- Keeps auth users/profiles, clears app content, clears banned emails,
-- and sets only the two specified emails as admins.

begin;

-- Social + engagement
delete from public.media_post_comments;
delete from public.media_post_reactions;
delete from public.media_posts;

delete from public.sermon_comments;
delete from public.sermon_reactions;
delete from public.sermon_views;

delete from public.community_replies;
delete from public.prayer_reactions;
delete from public.community_posts;
delete from public.prayer_requests;

-- Notifications
delete from public.notification_reads;
delete from public.notifications;

-- Core content
delete from public.merchandise;
delete from public.sermons;

-- Admin user management state
delete from public.blocked_emails;

-- Reset all admins, then assign only the intended two
update public.profiles
set is_admin = false;

update public.profiles
set is_admin = true
where lower(email) in (
  'hellocooperations@gmail.com',
  'richardrudanda1@gmail.com'
);

commit;

-- Storage note:
-- This script removes photo/merch database rows only.
-- To remove the actual uploaded files too, empty these buckets in Supabase Storage:
--   1. gallery
--   2. merch
--
-- Supabase Dashboard -> Storage -> select bucket -> Empty bucket
