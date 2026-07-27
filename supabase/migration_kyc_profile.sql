-- Adds KYC fields, occupation (student/teacher/parent), teacher review
-- queue, and profile avatars. Run this once against a project that
-- already ran schema.sql before this feature existed. Safe to skip on a
-- brand-new project — it's already folded into schema.sql for fresh
-- installs.

create type occupation_type as enum ('student', 'teacher', 'parent');
create type teacher_review_status as enum ('pending', 'approved', 'dismissed');

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists id_number text,
  add column if not exists occupation occupation_type,
  add column if not exists teacher_subject text,
  add column if not exists avatar_url text,
  add column if not exists teacher_review_status teacher_review_status;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  occ occupation_type := nullif(meta->>'occupation', '')::occupation_type;
begin
  insert into public.profiles (
    id, email, full_name, phone, id_number, occupation, teacher_subject, teacher_review_status
  ) values (
    new.id,
    new.email,
    meta->>'full_name',
    meta->>'phone',
    meta->>'id_number',
    occ,
    meta->>'teacher_subject',
    case when occ = 'teacher' then 'pending'::teacher_review_status else null end
  );
  return new;
end;
$$;

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "user manage own avatar" on storage.objects;
create policy "user manage own avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
