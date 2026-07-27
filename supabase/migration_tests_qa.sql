-- Adds timed practice tests (with auto-grading) and a subject-scoped
-- Q&A forum. Run this once against a project that already ran
-- schema.sql before this feature existed. Safe to skip on a brand-new
-- project — it's already folded into schema.sql for fresh installs.
-- Written to be safe to re-run if it partially fails partway through.

-- ── profiles_public (safe subset for Q&A author display) ────────────
create or replace view public.profiles_public as
  select id, full_name, avatar_url from public.profiles;

grant select on public.profiles_public to authenticated;

-- ── tests / test_questions ──────────────────────────────────────────
create table if not exists public.tests (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  subject           text not null,
  grade_level       text,
  duration_minutes  int not null,
  status            resource_status not null default 'draft',
  rejection_comment text,
  created_by        uuid references public.profiles(id),
  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists tests_status_idx on public.tests (status);
create index if not exists tests_created_by_idx on public.tests (created_by);

alter table public.tests enable row level security;

drop policy if exists "public view published tests" on public.tests;
create policy "public view published tests"
  on public.tests for select
  using (status = 'published');

drop policy if exists "subject admin view own tests" on public.tests;
create policy "subject admin view own tests"
  on public.tests for select
  using (created_by = auth.uid());

drop policy if exists "super admin view all tests" on public.tests;
create policy "super admin view all tests"
  on public.tests for select
  using (public.current_role() = 'super_admin');

drop policy if exists "subject admin insert own draft or pending test" on public.tests;
create policy "subject admin insert own draft or pending test"
  on public.tests for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "subject admin update own non-published test" on public.tests;
create policy "subject admin update own non-published test"
  on public.tests for update
  using (created_by = auth.uid() and status <> 'published')
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

drop policy if exists "super admin update any test" on public.tests;
create policy "super admin update any test"
  on public.tests for update
  using (public.current_role() = 'super_admin')
  with check (true);

drop policy if exists "super admin delete tests" on public.tests;
create policy "super admin delete tests"
  on public.tests for delete
  using (public.current_role() = 'super_admin');

create table if not exists public.test_questions (
  id                    uuid primary key default gen_random_uuid(),
  test_id               uuid not null references public.tests(id) on delete cascade,
  question_text         text not null,
  options               jsonb not null,
  correct_option_index  int not null,
  order_index           int not null default 0,
  created_at            timestamptz not null default now()
);

create index if not exists test_questions_test_idx on public.test_questions (test_id);

alter table public.test_questions enable row level security;

drop policy if exists "subject admin manage own test questions" on public.test_questions;
create policy "subject admin manage own test questions"
  on public.test_questions for all
  using (exists (
    select 1 from public.tests t where t.id = test_questions.test_id and t.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from public.tests t where t.id = test_questions.test_id and t.created_by = auth.uid()
  ));

drop policy if exists "super admin manage all test questions" on public.test_questions;
create policy "super admin manage all test questions"
  on public.test_questions for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

create or replace view public.test_questions_public as
  select tq.id, tq.test_id, tq.question_text, tq.options, tq.order_index
  from public.test_questions tq
  join public.tests t on t.id = tq.test_id
  where t.status = 'published';

grant select on public.test_questions_public to authenticated;

create table if not exists public.test_attempts (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references public.tests(id),
  user_id         uuid not null references public.profiles(id),
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  score           int,
  total_questions int not null,
  created_at      timestamptz not null default now()
);

create index if not exists test_attempts_user_idx on public.test_attempts (user_id);
create index if not exists test_attempts_test_idx on public.test_attempts (test_id);

alter table public.test_attempts enable row level security;

drop policy if exists "student view own attempts" on public.test_attempts;
create policy "student view own attempts"
  on public.test_attempts for select
  using (user_id = auth.uid());

drop policy if exists "student start own attempt" on public.test_attempts;
create policy "student start own attempt"
  on public.test_attempts for insert
  with check (user_id = auth.uid() and submitted_at is null and score is null);

drop policy if exists "test owner view attempts on own tests" on public.test_attempts;
create policy "test owner view attempts on own tests"
  on public.test_attempts for select
  using (exists (
    select 1 from public.tests t where t.id = test_attempts.test_id and t.created_by = auth.uid()
  ));

drop policy if exists "super admin view all attempts" on public.test_attempts;
create policy "super admin view all attempts"
  on public.test_attempts for select
  using (public.current_role() = 'super_admin');

create table if not exists public.test_attempt_answers (
  id                    uuid primary key default gen_random_uuid(),
  attempt_id            uuid not null references public.test_attempts(id) on delete cascade,
  question_id           uuid not null references public.test_questions(id),
  selected_option_index int,
  is_correct            boolean,
  created_at            timestamptz not null default now()
);

create index if not exists test_attempt_answers_attempt_idx on public.test_attempt_answers (attempt_id);

alter table public.test_attempt_answers enable row level security;

drop policy if exists "student view own attempt answers" on public.test_attempt_answers;
create policy "student view own attempt answers"
  on public.test_attempt_answers for select
  using (exists (
    select 1 from public.test_attempts a where a.id = test_attempt_answers.attempt_id and a.user_id = auth.uid()
  ));

-- ── qa_questions / qa_answers ────────────────────────────────────────
create table if not exists public.qa_questions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id),
  subject         text not null,
  title           text not null,
  body            text,
  attachment_url  text,
  attachment_type text,
  created_at      timestamptz not null default now()
);

create index if not exists qa_questions_subject_idx on public.qa_questions (subject);

alter table public.qa_questions enable row level security;

drop policy if exists "authenticated view questions" on public.qa_questions;
create policy "authenticated view questions"
  on public.qa_questions for select
  to authenticated
  using (true);

drop policy if exists "authenticated ask own question" on public.qa_questions;
create policy "authenticated ask own question"
  on public.qa_questions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "owner update own question" on public.qa_questions;
create policy "owner update own question"
  on public.qa_questions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner or super admin delete question" on public.qa_questions;
create policy "owner or super admin delete question"
  on public.qa_questions for delete
  using (user_id = auth.uid() or public.current_role() = 'super_admin');

create table if not exists public.qa_answers (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references public.qa_questions(id) on delete cascade,
  user_id         uuid not null references public.profiles(id),
  body            text,
  attachment_url  text,
  attachment_type text,
  created_at      timestamptz not null default now()
);

create index if not exists qa_answers_question_idx on public.qa_answers (question_id);

alter table public.qa_answers enable row level security;

drop policy if exists "authenticated view answers" on public.qa_answers;
create policy "authenticated view answers"
  on public.qa_answers for select
  to authenticated
  using (true);

drop policy if exists "authenticated post own answer" on public.qa_answers;
create policy "authenticated post own answer"
  on public.qa_answers for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "owner update own answer" on public.qa_answers;
create policy "owner update own answer"
  on public.qa_answers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "owner or super admin delete answer" on public.qa_answers;
create policy "owner or super admin delete answer"
  on public.qa_answers for delete
  using (user_id = auth.uid() or public.current_role() = 'super_admin');

-- ── qa-attachments storage bucket ───────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('qa-attachments', 'qa-attachments', true)
  on conflict (id) do nothing;

drop policy if exists "public read qa attachments" on storage.objects;
create policy "public read qa attachments"
  on storage.objects for select
  using (bucket_id = 'qa-attachments');

drop policy if exists "authenticated upload own qa attachment" on storage.objects;
create policy "authenticated upload own qa attachment"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'qa-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
