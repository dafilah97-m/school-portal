-- Fixes a gap where Super Admin could see the "create" forms for past
-- papers, videos, and news/events (they're in the sidebar), but every
-- insert silently violated RLS because the insert policy only ever
-- allowed the literal role 'subject_admin' — there was no matching
-- policy letting Super Admin insert directly. This broadens those
-- three policies to also allow super_admin. (tests isn't affected here
-- since that table doesn't exist in your database yet — the fix for it
-- is already folded into migration_tests_qa.sql, not run yet either.)

drop policy if exists "subject admin insert own draft or pending" on public.edu_resources;
create policy "subject admin insert own draft or pending"
  on public.edu_resources for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "subject admin insert own draft or pending video" on public.educational_videos;
create policy "subject admin insert own draft or pending video"
  on public.educational_videos for insert
  with check (
    
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "subject admin insert own draft or pending news" on public.news_events;
create policy "subject admin insert own draft or pending news"
  on public.news_events for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
  );
