-- Adds enforcement for profiles.assigned_subject: a subject_admin with an
-- assignment can only create/edit past papers and videos tagged with that
-- subject. Run this once against a project that already ran schema.sql
-- before this feature existed. Safe to skip on a brand-new project — it's
-- already folded into schema.sql for fresh installs.

create or replace function public.current_assigned_subject()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select assigned_subject from public.profiles where id = auth.uid();
$$;

drop policy if exists "subject admin insert own draft or pending" on public.edu_resources;
create policy "subject admin insert own draft or pending"
  on public.edu_resources for insert
  with check (
    created_by = auth.uid()
    and public.current_role() = 'subject_admin'
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "subject admin update own non-published" on public.edu_resources;
create policy "subject admin update own non-published"
  on public.edu_resources for update
  using (created_by = auth.uid() and status <> 'published')
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "subject admin insert own draft or pending video" on public.educational_videos;
create policy "subject admin insert own draft or pending video"
  on public.educational_videos for insert
  with check (
    created_by = auth.uid()
    and public.current_role() = 'subject_admin'
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "subject admin update own non-published video" on public.educational_videos;
create policy "subject admin update own non-published video"
  on public.educational_videos for update
  using (created_by = auth.uid() and status <> 'published')
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );
