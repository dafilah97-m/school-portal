-- SHG Designs School Portal & Edu-Vault — full schema
-- Run this once in the Supabase SQL editor on a fresh project.

create extension if not exists "pgcrypto";

create type user_role as enum ('super_admin', 'shop_admin', 'subject_admin', 'student_parent');
create type resource_status as enum ('draft', 'pending_approval', 'published', 'rejected');
create type payment_status as enum ('pending', 'paid', 'failed');
create type fulfillment_status as enum ('unfulfilled', 'processing', 'delivered');
create type occupation_type as enum ('student', 'teacher', 'parent');
create type teacher_review_status as enum ('pending', 'approved', 'dismissed');

-- ─────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  role                  user_role not null default 'student_parent',
  assigned_subject      text,
  full_name             text,
  phone                 text,
  id_number             text,
  occupation            occupation_type,
  teacher_subject       text,
  avatar_url            text,
  teacher_review_status teacher_review_status,
  created_at            timestamptz not null default now()
);

-- Registration collects KYC/occupation fields via supabase.auth.signUp's
-- `options.data` (raw_user_meta_data); this trigger copies them onto the
-- profiles row it creates. Teachers land in a Super Admin review queue —
-- picking "teacher" here is informational until approved, it does not
-- grant subject_admin access on its own.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- security-definer helper: reads the caller's own role without recursive RLS
create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- security-definer helper: a subject_admin with no assignment (null) may
-- post to any subject; one with an assignment is scoped to only that subject.
create or replace function public.current_assigned_subject()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select assigned_subject from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

create policy "view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "super_admin view all profiles"
  on public.profiles for select
  using (public.current_role() = 'super_admin');

create policy "update own profile, role unchanged"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role());

create policy "super_admin update any profile incl role"
  on public.profiles for update
  using (public.current_role() = 'super_admin')
  with check (true);

-- Safe-to-share subset of profiles (no email/phone/id_number) for
-- displaying names/avatars next to Q&A posts and similar community
-- content — runs as the view owner (bypasses RLS on the base table by
-- design, same mechanism as edu_resources_public), so its own column
-- list is the only security boundary.
create view public.profiles_public as
  select id, full_name, avatar_url from public.profiles;

grant select on public.profiles_public to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- campaigns_stores
-- ─────────────────────────────────────────────────────────────────
create table public.campaigns_stores (
  id          uuid primary key default gen_random_uuid(),
  school_name text not null,
  slug        text not null unique,
  start_date  date,
  end_date    date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.campaigns_stores enable row level security;

create policy "public view active stores"
  on public.campaigns_stores for select
  using (is_active = true);

create policy "shop/super admin manage stores"
  on public.campaigns_stores for all
  using (public.current_role() in ('shop_admin', 'super_admin'))
  with check (public.current_role() in ('shop_admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────────
create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid references public.campaigns_stores(id) on delete cascade,
  title                text not null,
  description          text,
  price                numeric(10, 2) not null,
  fundraising_markup   numeric(10, 2) not null default 0,
  sizes                jsonb not null default '[]',
  customization_fields jsonb not null default '[]',
  images               text[] not null default '{}',
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create index products_store_idx on public.products (store_id);

alter table public.products enable row level security;

create policy "public view active products of active stores"
  on public.products for select
  using (
    is_active = true
    and exists (
      select 1 from public.campaigns_stores cs
      where cs.id = products.store_id and cs.is_active = true
    )
  );

create policy "shop/super admin manage products"
  on public.products for all
  using (public.current_role() in ('shop_admin', 'super_admin'))
  with check (public.current_role() in ('shop_admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────────
-- edu_resources
-- ─────────────────────────────────────────────────────────────────
create table public.edu_resources (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  subject           text not null,
  grade_level       text,
  year              int,
  price             numeric(10, 2) not null,
  file_url          text not null, -- path within the private bucket; never sent to the browser directly
  status            resource_status not null default 'draft',
  rejection_comment text,
  created_by        uuid references public.profiles(id),
  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index edu_resources_subject_status_idx on public.edu_resources (subject, status);
create index edu_resources_created_by_idx on public.edu_resources (created_by);

alter table public.edu_resources enable row level security;

create policy "public view published resources"
  on public.edu_resources for select
  using (status = 'published');

create policy "subject admin view own resources"
  on public.edu_resources for select
  using (created_by = auth.uid());

create policy "super admin view all resources"
  on public.edu_resources for select
  using (public.current_role() = 'super_admin');

create policy "subject admin insert own draft or pending"
  on public.edu_resources for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

create policy "subject admin update own non-published"
  on public.edu_resources for update
  using (created_by = auth.uid() and status <> 'published')
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

create policy "super admin update any resource"
  on public.edu_resources for update
  using (public.current_role() = 'super_admin')
  with check (true);

create policy "super admin delete resources"
  on public.edu_resources for delete
  using (public.current_role() = 'super_admin');

-- public-safe view: never exposes file_url
create view public.edu_resources_public as
  select id, title, subject, grade_level, year, price, created_at
  from public.edu_resources
  where status = 'published';

grant select on public.edu_resources_public to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- educational_videos — embedded YouTube/Vimeo links on the public
-- landing page. No file storage: just a URL, so no private bucket or
-- watermarking pipeline is needed here, unlike edu_resources.
-- ─────────────────────────────────────────────────────────────────
create table public.educational_videos (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  video_url         text not null,
  subject           text,
  status            resource_status not null default 'draft',
  rejection_comment text,
  created_by        uuid references public.profiles(id),
  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index educational_videos_status_idx on public.educational_videos (status);
create index educational_videos_created_by_idx on public.educational_videos (created_by);

alter table public.educational_videos enable row level security;

create policy "public view published videos"
  on public.educational_videos for select
  using (status = 'published');

create policy "subject admin view own videos"
  on public.educational_videos for select
  using (created_by = auth.uid());

create policy "super admin view all videos"
  on public.educational_videos for select
  using (public.current_role() = 'super_admin');

create policy "subject admin insert own draft or pending video"
  on public.educational_videos for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

create policy "subject admin update own non-published video"
  on public.educational_videos for update
  using (created_by = auth.uid() and status <> 'published')
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

create policy "super admin update any video"
  on public.educational_videos for update
  using (public.current_role() = 'super_admin')
  with check (true);

create policy "super admin delete videos"
  on public.educational_videos for delete
  using (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────────
-- news_events — public announcements/events page. Same draft →
-- pending_approval → published/rejected workflow as edu_resources
-- and educational_videos, so Subject Admin posts still pass through
-- Super Admin moderation.
-- ─────────────────────────────────────────────────────────────────
create table public.news_events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  body              text not null,
  event_date        date,
  status            resource_status not null default 'draft',
  rejection_comment text,
  created_by        uuid references public.profiles(id),
  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index news_events_status_idx on public.news_events (status);
create index news_events_created_by_idx on public.news_events (created_by);

alter table public.news_events enable row level security;

create policy "public view published news"
  on public.news_events for select
  using (status = 'published');

create policy "subject admin view own news"
  on public.news_events for select
  using (created_by = auth.uid());

create policy "super admin view all news"
  on public.news_events for select
  using (public.current_role() = 'super_admin');

create policy "subject admin insert own draft or pending news"
  on public.news_events for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
  );

create policy "subject admin update own non-published news"
  on public.news_events for update
  using (created_by = auth.uid() and status <> 'published')
  with check (created_by = auth.uid() and status in ('draft', 'pending_approval'));

create policy "super admin update any news"
  on public.news_events for update
  using (public.current_role() = 'super_admin')
  with check (true);

create policy "super admin delete news"
  on public.news_events for delete
  using (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────────
-- tests / test_questions — timed multiple-choice practice tests.
-- Same draft → pending_approval → published/rejected workflow as
-- edu_resources. Questions carry the correct answer, which must never
-- reach a student taking the test — test_questions has no public
-- select policy at all; students only ever read test_questions_public
-- (no correct_option_index column). Grading happens server-side via
-- the service-role client, which is the only thing ever allowed to
-- write test_attempts.score / test_attempt_answers.is_correct.
-- ─────────────────────────────────────────────────────────────────
create table public.tests (
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

create index tests_status_idx on public.tests (status);
create index tests_created_by_idx on public.tests (created_by);

alter table public.tests enable row level security;

create policy "public view published tests"
  on public.tests for select
  using (status = 'published');

create policy "subject admin view own tests"
  on public.tests for select
  using (created_by = auth.uid());

create policy "super admin view all tests"
  on public.tests for select
  using (public.current_role() = 'super_admin');

create policy "subject admin insert own draft or pending test"
  on public.tests for insert
  with check (
    created_by = auth.uid()
    and public.current_role() in ('subject_admin', 'super_admin')
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

create policy "subject admin update own non-published test"
  on public.tests for update
  using (created_by = auth.uid() and status <> 'published')
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending_approval')
    and (public.current_assigned_subject() is null or subject = public.current_assigned_subject())
  );

create policy "super admin update any test"
  on public.tests for update
  using (public.current_role() = 'super_admin')
  with check (true);

create policy "super admin delete tests"
  on public.tests for delete
  using (public.current_role() = 'super_admin');

create table public.test_questions (
  id                  uuid primary key default gen_random_uuid(),
  test_id             uuid not null references public.tests(id) on delete cascade,
  question_text       text not null,
  options             jsonb not null,
  correct_option_index int not null,
  order_index         int not null default 0,
  created_at          timestamptz not null default now()
);

create index test_questions_test_idx on public.test_questions (test_id);

alter table public.test_questions enable row level security;

create policy "subject admin manage own test questions"
  on public.test_questions for all
  using (exists (
    select 1 from public.tests t where t.id = test_questions.test_id and t.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from public.tests t where t.id = test_questions.test_id and t.created_by = auth.uid()
  ));

create policy "super admin manage all test questions"
  on public.test_questions for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- No general select policy for test_questions — students never read the
-- base table (it holds correct_option_index). They read this view instead:
create view public.test_questions_public as
  select tq.id, tq.test_id, tq.question_text, tq.options, tq.order_index
  from public.test_questions tq
  join public.tests t on t.id = tq.test_id
  where t.status = 'published';

grant select on public.test_questions_public to authenticated;

create table public.test_attempts (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references public.tests(id),
  user_id         uuid not null references public.profiles(id),
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  score           int,
  total_questions int not null,
  created_at      timestamptz not null default now()
);

create index test_attempts_user_idx on public.test_attempts (user_id);
create index test_attempts_test_idx on public.test_attempts (test_id);

alter table public.test_attempts enable row level security;

create policy "student view own attempts"
  on public.test_attempts for select
  using (user_id = auth.uid());

create policy "student start own attempt"
  on public.test_attempts for insert
  with check (user_id = auth.uid() and submitted_at is null and score is null);

create policy "test owner view attempts on own tests"
  on public.test_attempts for select
  using (exists (
    select 1 from public.tests t where t.id = test_attempts.test_id and t.created_by = auth.uid()
  ));

create policy "super admin view all attempts"
  on public.test_attempts for select
  using (public.current_role() = 'super_admin');

-- Deliberately no update policy: submitted_at/score are only ever set by
-- the service-role client inside the grading route, so a student can't
-- award themselves a perfect score by writing to their own attempt row.

create table public.test_attempt_answers (
  id                    uuid primary key default gen_random_uuid(),
  attempt_id            uuid not null references public.test_attempts(id) on delete cascade,
  question_id           uuid not null references public.test_questions(id),
  selected_option_index int,
  is_correct            boolean,
  created_at            timestamptz not null default now()
);

create index test_attempt_answers_attempt_idx on public.test_attempt_answers (attempt_id);

alter table public.test_attempt_answers enable row level security;

create policy "student view own attempt answers"
  on public.test_attempt_answers for select
  using (exists (
    select 1 from public.test_attempts a where a.id = test_attempt_answers.attempt_id and a.user_id = auth.uid()
  ));

-- No insert/update policy: these rows are graded and written exclusively
-- by the service-role client during submission.

-- ─────────────────────────────────────────────────────────────────
-- orders / order_items
-- ─────────────────────────────────────────────────────────────────
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id),
  customer_name      text not null,
  customer_email     text not null,
  grade_class        text,
  total_amount       numeric(10, 2) not null,
  payment_status     payment_status not null default 'pending',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  dpo_trans_token    text,
  created_at         timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_dpo_trans_token_idx on public.orders (dpo_trans_token);

alter table public.orders enable row level security;

create policy "customer view own orders"
  on public.orders for select
  using (user_id = auth.uid());

create policy "customer create own pending order"
  on public.orders for insert
  with check (user_id = auth.uid() and payment_status = 'pending');

create policy "shop/super admin view all orders"
  on public.orders for select
  using (public.current_role() in ('shop_admin', 'super_admin'));

create policy "shop/super admin update orders"
  on public.orders for update
  using (public.current_role() in ('shop_admin', 'super_admin'))
  with check (public.current_role() in ('shop_admin', 'super_admin'));

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id),
  resource_id       uuid references public.edu_resources(id),
  quantity          int not null default 1,
  selected_size     text,
  custom_text       text,
  price_at_purchase numeric(10, 2) not null,
  check (product_id is not null or resource_id is not null)
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "customer view own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create policy "customer insert own order items"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create policy "shop/super admin manage all order items"
  on public.order_items for all
  using (public.current_role() in ('shop_admin', 'super_admin'))
  with check (public.current_role() in ('shop_admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────────
-- purchased_resources
-- Deliberately NO insert/update/delete policy: only the service-role
-- key (used server-side after DPO payment verification) may write
-- rows here. This is what prevents a customer from granting
-- themselves a PDF without paying.
-- ─────────────────────────────────────────────────────────────────
create table public.purchased_resources (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id),
  resource_id   uuid not null references public.edu_resources(id),
  order_id      uuid references public.orders(id),
  purchase_date timestamptz not null default now(),
  unique (user_id, resource_id)
);

create index purchased_resources_user_idx on public.purchased_resources (user_id);

alter table public.purchased_resources enable row level security;

create policy "customer view own purchases"
  on public.purchased_resources for select
  using (user_id = auth.uid());

create policy "super admin view all purchases"
  on public.purchased_resources for select
  using (public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────────
-- qa_questions / qa_answers — a public-to-the-school-community forum
-- (any authenticated role) scoped by subject, unlike the other content
-- types this is NOT gated behind Super Admin approval — it's live
-- discussion, not published material. Attachments are optional and
-- point into the public qa-attachments storage bucket.
-- ─────────────────────────────────────────────────────────────────
create table public.qa_questions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id),
  subject         text not null,
  title           text not null,
  body            text,
  attachment_url  text,
  attachment_type text,
  created_at      timestamptz not null default now()
);

create index qa_questions_subject_idx on public.qa_questions (subject);

alter table public.qa_questions enable row level security;

create policy "authenticated view questions"
  on public.qa_questions for select
  to authenticated
  using (true);

create policy "authenticated ask own question"
  on public.qa_questions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "owner update own question"
  on public.qa_questions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "owner or super admin delete question"
  on public.qa_questions for delete
  using (user_id = auth.uid() or public.current_role() = 'super_admin');

create table public.qa_answers (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references public.qa_questions(id) on delete cascade,
  user_id         uuid not null references public.profiles(id),
  body            text,
  attachment_url  text,
  attachment_type text,
  created_at      timestamptz not null default now()
);

create index qa_answers_question_idx on public.qa_answers (question_id);

alter table public.qa_answers enable row level security;

create policy "authenticated view answers"
  on public.qa_answers for select
  to authenticated
  using (true);

create policy "authenticated post own answer"
  on public.qa_answers for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "owner update own answer"
  on public.qa_answers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "owner or super admin delete answer"
  on public.qa_answers for delete
  using (user_id = auth.uid() or public.current_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────────
-- analytics view — queried only via the service-role client from
-- the super-admin analytics route, never granted to anon/authenticated
-- ─────────────────────────────────────────────────────────────────
create or replace view public.v_revenue_by_day as
  select
    date_trunc('day', o.created_at) as day,
    sum(oi.price_at_purchase * oi.quantity) filter (where oi.product_id is not null) as merch_revenue,
    sum(oi.price_at_purchase * oi.quantity) filter (where oi.resource_id is not null) as edu_vault_revenue,
    sum(p.fundraising_markup * oi.quantity) filter (where oi.product_id is not null) as fundraising_profit
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  left join public.products p on p.id = oi.product_id
  where o.payment_status = 'paid'
  group by 1;

-- ─────────────────────────────────────────────────────────────────
-- storage buckets
-- ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('public-images', 'public-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('private-resources', 'private-resources', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('watermarked-cache', 'watermarked-cache', false)
  on conflict (id) do nothing;

create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'public-images');

create policy "shop/super admin write product images"
  on storage.objects for insert
  with check (bucket_id = 'public-images' and public.current_role() in ('shop_admin', 'super_admin'));

create policy "shop/super admin delete product images"
  on storage.objects for delete
  using (bucket_id = 'public-images' and public.current_role() in ('shop_admin', 'super_admin'));

-- private-resources: path convention {resource_id}/original.pdf
create policy "subject admin upload own resource file"
  on storage.objects for insert
  with check (
    bucket_id = 'private-resources'
    and public.current_role() = 'subject_admin'
    and exists (
      select 1 from public.edu_resources r
      where r.created_by = auth.uid()
        and (storage.foldername(name))[1] = r.id::text
    )
  );

create policy "subject admin read own resource file"
  on storage.objects for select
  using (
    bucket_id = 'private-resources'
    and public.current_role() = 'subject_admin'
    and exists (
      select 1 from public.edu_resources r
      where r.created_by = auth.uid()
        and (storage.foldername(name))[1] = r.id::text
    )
  );

create policy "super admin full access private resources"
  on storage.objects for all
  using (bucket_id = 'private-resources' and public.current_role() = 'super_admin')
  with check (bucket_id = 'private-resources' and public.current_role() = 'super_admin');

-- watermarked-cache: intentionally NO client-facing policies at all.
-- Only the service-role client (used inside the download API route)
-- ever reads or writes this bucket. There is no signed URL and no
-- RLS path that lets any authenticated client reach it directly —
-- this is the concrete mechanism that prevents unauthorized direct
-- URL access to Edu-Vault PDFs.

-- avatars: public read (profile pictures aren't sensitive); path
-- convention {user_id}/avatar.<ext>. The very first upload happens via
-- the service-role client during registration (before the user has a
-- session to satisfy these policies) — these policies cover any later
-- change a signed-in user makes to their own avatar.
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "user manage own avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- qa-attachments: public read (same security-through-obscurity-via-uuid
-- tradeoff as public-images — these are informal forum attachments, not
-- DRM'd content), path convention {user_id}/{uuid}.<ext>.
insert into storage.buckets (id, name, public)
  values ('qa-attachments', 'qa-attachments', true)
  on conflict (id) do nothing;

create policy "public read qa attachments"
  on storage.objects for select
  using (bucket_id = 'qa-attachments');

create policy "authenticated upload own qa attachment"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'qa-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
