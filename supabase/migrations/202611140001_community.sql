-- Apply through Supabase migrations. Never run this against an unrelated project.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 60),
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  avatar_path text,
  bio text not null default '' check (char_length(bio) <= 180),
  city text not null default 'Jaipur' check (city = 'Jaipur'),
  locality text not null check (locality in ('Mansarovar', 'Vaishali Nagar', 'Malviya Nagar')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (avatar_path is null or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}/image\.jpg$'))
);
create table public.posts (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null check (char_length(btrim(description)) between 1 and 2000),
  image_path text,
  category text not null check (category in ('general', 'help', 'events', 'recommendations')),
  city text not null default 'Jaipur' check (city = 'Jaipur'),
  locality text not null check (locality in ('Mansarovar', 'Vaishali Nagar', 'Malviya Nagar')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (image_path is null or image_path = user_id::text || '/' || id::text || '/image.jpg')
);
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create table public.comments (
  id uuid primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  company_name text not null check (char_length(company_name) between 2 and 120),
  description text not null check (char_length(description) between 10 and 6000),
  salary_min integer check (salary_min >= 0),
  salary_max integer check (salary_max >= salary_min),
  employment_type text not null check (employment_type in ('full_time', 'part_time', 'internship', 'contract')),
  city text not null default 'Jaipur' check (city = 'Jaipur'),
  locality text not null check (locality in ('Mansarovar', 'Vaishali Nagar', 'Malviya Nagar')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted' check (status = 'submitted'),
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);
create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (job_id, user_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'comment')),
  post_id uuid not null references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (actor_id <> recipient_id),
  check ((type = 'like' and comment_id is null) or (type = 'comment' and comment_id is not null))
);
-- A like can be removed/re-added without sending repeated notifications.
create unique index notifications_like_once on public.notifications (recipient_id, actor_id, post_id) where type = 'like';
create unique index notifications_comment_once on public.notifications (comment_id) where type = 'comment';
create index posts_city_cursor on public.posts (city, created_at desc, id desc);
create index posts_category_cursor on public.posts (category, created_at desc, id desc);
create index posts_author_cursor on public.posts (user_id, created_at desc, id desc);
create index comments_post_cursor on public.comments (post_id, created_at desc, id desc);
create index comments_user on public.comments (user_id);
create index likes_user on public.likes (user_id);
create index saved_posts_owner_cursor on public.saved_posts (user_id, created_at desc, id desc);
create index jobs_city_cursor on public.jobs (city, created_at desc, id desc);
create index applications_owner_cursor on public.job_applications (user_id, created_at desc, id desc);
create index saved_jobs_owner_cursor on public.saved_jobs (user_id, created_at desc, id desc);
create index notifications_owner_cursor on public.notifications (recipient_id, created_at desc, id desc);
create index notifications_actor on public.notifications (actor_id);
create index notifications_post on public.notifications (post_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.notifications enable row level security;

-- Explicit column grants stop clients spoofing timestamps, demo flags and event fields.
revoke all on public.profiles, public.posts, public.likes, public.comments, public.saved_posts,
  public.jobs, public.job_applications, public.saved_jobs, public.notifications from anon, authenticated;
grant select on public.profiles, public.posts, public.likes, public.comments, public.saved_posts,
  public.jobs, public.job_applications, public.saved_jobs, public.notifications to authenticated;
grant insert (id, full_name, username, avatar_path, bio, city, locality, preferred_language) on public.profiles to authenticated;
grant update (full_name, username, avatar_path, bio, city, locality, preferred_language) on public.profiles to authenticated;
grant insert (id, user_id, description, image_path, category, city, locality) on public.posts to authenticated;
grant update (description, category) on public.posts to authenticated;
grant delete on public.posts to authenticated;
grant insert (post_id, user_id) on public.likes, public.saved_posts to authenticated;
grant delete on public.likes, public.saved_posts to authenticated;
grant insert (id, post_id, user_id, content) on public.comments to authenticated;
grant update (content) on public.comments to authenticated;
grant delete on public.comments to authenticated;
grant insert (job_id, user_id) on public.saved_jobs, public.job_applications to authenticated;
grant delete on public.saved_jobs to authenticated;
grant update (is_read) on public.notifications to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy posts_read on public.posts for select to authenticated using (true);
create policy posts_insert on public.posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy posts_update on public.posts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy posts_delete on public.posts for delete to authenticated using ((select auth.uid()) = user_id);
create policy likes_read on public.likes for select to authenticated using (true);
create policy likes_insert on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy likes_delete on public.likes for delete to authenticated using ((select auth.uid()) = user_id);
create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy comments_update on public.comments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy comments_delete on public.comments for delete to authenticated using ((select auth.uid()) = user_id);
create policy saved_posts_read on public.saved_posts for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_posts_insert on public.saved_posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_posts_delete on public.saved_posts for delete to authenticated using ((select auth.uid()) = user_id);
create policy jobs_read on public.jobs for select to authenticated using (true);
create policy applications_read on public.job_applications for select to authenticated using ((select auth.uid()) = user_id);
create policy applications_insert on public.job_applications for insert to authenticated with check ((select auth.uid()) = user_id and status = 'submitted');
create policy saved_jobs_read on public.saved_jobs for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_jobs_insert on public.saved_jobs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_jobs_delete on public.saved_jobs for delete to authenticated using ((select auth.uid()) = user_id);
create policy notifications_read on public.notifications for select to authenticated using ((select auth.uid()) = recipient_id);
create policy notifications_update on public.notifications for update to authenticated using ((select auth.uid()) = recipient_id) with check ((select auth.uid()) = recipient_id);

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger posts_updated before update on public.posts for each row execute function private.touch_updated_at();
create trigger comments_updated before update on public.comments for each row execute function private.touch_updated_at();

create function private.notify_post_owner() returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    values (owner_id, new.user_id, case when tg_table_name = 'likes' then 'like' else 'comment' end,
      new.post_id, case when tg_table_name = 'comments' then new.id else null end)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.touch_updated_at(), private.notify_post_owner() from public, anon, authenticated;
create trigger likes_notify after insert on public.likes for each row execute function private.notify_post_owner();
create trigger comments_notify after insert on public.comments for each row execute function private.notify_post_owner();

-- Public media is an intentional product choice. Paths contain no email/secret.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 10485760, array['image/jpeg']),
       ('profile-images', 'profile-images', true, 10485760, array['image/jpeg']);
create policy media_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('post-images', 'profile-images') and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/image\.jpg$'
);
create policy media_owner_read on storage.objects for select to authenticated using (
  bucket_id in ('post-images', 'profile-images') and (storage.foldername(name))[1] = (select auth.uid())::text
);
-- No UPDATE policy: uploaded objects are immutable, including on retry.
create policy media_unused_delete on storage.objects for delete to authenticated using (
  (storage.foldername(name))[1] = (select auth.uid())::text and (
    (bucket_id = 'post-images' and not exists (select 1 from public.posts p where p.image_path = name)) or
    (bucket_id = 'profile-images' and not exists (select 1 from public.profiles p where p.avatar_path = name))
  )
);
