-- Run as the database owner in a disposable development project, after migrations.
-- Every fixture is rolled back. Any failed assertion aborts the transaction.
begin;
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('40000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-a@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('40000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-b@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
insert into public.profiles (id, full_name, username, locality) values
  ('40000000-0000-4000-8000-000000000001', 'RLS User A', 'rls_fixture_a', 'Mansarovar'),
  ('40000000-0000-4000-8000-000000000002', 'RLS User B', 'rls_fixture_b', 'Vaishali Nagar');
insert into public.posts (id, user_id, description, category, locality, created_at) values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Post A', 'general', 'Mansarovar', '2026-10-01'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Post B', 'general', 'Vaishali Nagar', '2026-10-01');
insert into public.posts (id, user_id, description, category, locality, created_at)
select ('50000000-0000-4000-8000-' || lpad((1000 + n)::text, 12, '0'))::uuid,
  '40000000-0000-4000-8000-000000000002', 'Tied timestamp ' || n, 'general', 'Vaishali Nagar', '2026-11-01 10:00:00.123456+00'::timestamptz
from generate_series(1, 45) n;
insert into public.jobs (id, title, company_name, description, employment_type, locality)
values ('60000000-0000-4000-8000-000000000001', 'Test internship', 'Test employer', 'A fictional test position.', 'internship', 'Mansarovar');
insert into public.saved_posts (post_id, user_id) values ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002');
insert into public.saved_jobs (job_id, user_id) values ('60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002');
insert into public.job_applications (job_id, user_id) values ('60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare affected integer; first_ids uuid[]; second_ids uuid[]; third_ids uuid[]; last_item jsonb; saved_item jsonb;
begin
  if (select count(*) from public.saved_posts) <> 0 then raise exception 'A can read another user saved posts'; end if;
  if (select count(*) from public.saved_jobs) <> 0 then raise exception 'A can read another user saved jobs'; end if;
  if (select count(*) from public.job_applications) <> 0 then raise exception 'A can read another user applications'; end if;
  update public.posts set description = 'Hacked' where id = '50000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'A edited B post'; end if;
  delete from public.posts where id = '50000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'A deleted B post'; end if;
  update public.profiles set full_name = 'Hacked' where id = '40000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'A edited B profile'; end if;
  update public.posts set description = 'A updated own post' where id = '50000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner update failed'; end if;

  begin
    insert into public.posts (id, user_id, description, category, locality)
    values ('50000000-0000-4000-8000-000000009999', '40000000-0000-4000-8000-000000000002', 'Spoofed owner', 'general', 'Mansarovar');
    raise exception 'Spoofed post ownership accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.posts set is_demo = true where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'Client changed trusted demo flag';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.jobs (title, company_name, description, employment_type, locality)
    values ('Fake job', 'Fake employer', 'Client-created job', 'internship', 'Mansarovar');
    raise exception 'Client created an admin-only listing';
  exception when insufficient_privilege then null; end;

  insert into public.likes (post_id, user_id) values ('50000000-0000-4000-8000-000000000002', auth.uid()) on conflict (post_id,user_id) do nothing;
  insert into public.likes (post_id, user_id) values ('50000000-0000-4000-8000-000000000002', auth.uid()) on conflict (post_id,user_id) do nothing;
  if (select count(*) from public.likes where post_id = '50000000-0000-4000-8000-000000000002' and user_id = auth.uid()) <> 1 then raise exception 'Duplicate like'; end if;
  delete from public.likes where post_id = '50000000-0000-4000-8000-000000000002' and user_id = auth.uid();
  insert into public.likes (post_id, user_id) values ('50000000-0000-4000-8000-000000000002', auth.uid());
  insert into public.likes (post_id, user_id) values ('50000000-0000-4000-8000-000000000001', auth.uid());
  if (select count(*) from public.notifications) <> 0 then raise exception 'Recipient isolation or self-notification exclusion failed'; end if;
  insert into public.comments (id, post_id, user_id, content)
  values ('70000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', auth.uid(), 'A helpful reply');
  begin
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values ('40000000-0000-4000-8000-000000000002', auth.uid(), 'like', '50000000-0000-4000-8000-000000000002');
    raise exception 'Client fabricated activity';
  exception when insufficient_privilege then null; end;

  insert into public.saved_posts (post_id, user_id) values ('50000000-0000-4000-8000-000000000002', auth.uid()) on conflict (post_id,user_id) do nothing;
  insert into public.saved_posts (post_id, user_id) values ('50000000-0000-4000-8000-000000000002', auth.uid()) on conflict (post_id,user_id) do nothing;
  if (select count(*) from public.saved_posts) <> 1 then raise exception 'Duplicate save'; end if;
  select item into saved_item from public.list_posts(p_saved => true) as page(item);
  if (saved_item->>'sort_id')::uuid <> (select id from public.saved_posts) then raise exception 'Saved cursor is not based on saved record'; end if;
  if (saved_item->>'sort_at')::timestamptz <> (select created_at from public.saved_posts) then raise exception 'Saved timestamp is incorrect'; end if;

  insert into public.job_applications (job_id, user_id) values ('60000000-0000-4000-8000-000000000001', auth.uid()) on conflict (job_id,user_id) do nothing;
  insert into public.job_applications (job_id, user_id) values ('60000000-0000-4000-8000-000000000001', auth.uid()) on conflict (job_id,user_id) do nothing;
  if (select count(*) from public.job_applications) <> 1 then raise exception 'Duplicate application'; end if;
  if (select status from public.job_applications) <> 'submitted' then raise exception 'Incorrect application status'; end if;
  begin
    update public.job_applications set status = 'submitted';
    raise exception 'Client received application update privilege';
  exception when insufficient_privilege then null; end;
  insert into public.saved_jobs (job_id,user_id) values ('60000000-0000-4000-8000-000000000001',auth.uid()) on conflict (job_id,user_id) do nothing;
  insert into public.saved_jobs (job_id,user_id) values ('60000000-0000-4000-8000-000000000001',auth.uid()) on conflict (job_id,user_id) do nothing;
  if (select count(*) from public.saved_jobs) <> 1 then raise exception 'Duplicate saved job'; end if;

  select array_agg((item->>'id')::uuid) into first_ids from public.list_posts(p_author => '40000000-0000-4000-8000-000000000002', p_limit => 20) as page(item);
  select item into last_item from public.list_posts(p_author => '40000000-0000-4000-8000-000000000002', p_limit => 20) as page(item) offset 19 limit 1;
  if (last_item->>'sort_at')::timestamptz <> '2026-11-01 10:00:00.123456+00'::timestamptz then raise exception 'Timestamp precision was lost'; end if;
  select array_agg((item->>'id')::uuid) into second_ids from public.list_posts(p_author => '40000000-0000-4000-8000-000000000002', p_cursor_time => (last_item->>'sort_at')::timestamptz, p_cursor_id => (last_item->>'sort_id')::uuid, p_limit => 20) as page(item);
  select item into last_item from public.list_posts(p_author => '40000000-0000-4000-8000-000000000002', p_cursor_time => (last_item->>'sort_at')::timestamptz, p_cursor_id => (last_item->>'sort_id')::uuid, p_limit => 20) as page(item) offset 19 limit 1;
  select array_agg((item->>'id')::uuid) into third_ids from public.list_posts(p_author => '40000000-0000-4000-8000-000000000002', p_cursor_time => (last_item->>'sort_at')::timestamptz, p_cursor_id => (last_item->>'sort_id')::uuid, p_limit => 20) as page(item);
  if cardinality(first_ids) <> 20 or cardinality(second_ids) <> 20 or cardinality(third_ids) <> 6 then raise exception 'Tied rows were skipped'; end if;
  if first_ids && second_ids or first_ids && third_ids or second_ids && third_ids then raise exception 'Cursor returned duplicates'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$
declare affected integer;
begin
  if (select count(*) from public.notifications) <> 2 then raise exception 'Expected one like and one comment event, without repeated-like spam'; end if;
  update public.notifications set is_read = true;
  get diagnostics affected = row_count;
  if affected <> 2 then raise exception 'Recipient cannot mark own notifications read'; end if;
  begin
    update public.notifications set actor_id = auth.uid();
    raise exception 'Recipient changed trusted event fields';
  exception when insufficient_privilege then null; end;
  delete from public.comments where id = '70000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'B deleted A comment'; end if;
  if (select count(*) from public.saved_posts) <> 1 then raise exception 'B private saves are not isolated'; end if;
  if (select count(*) from public.job_applications) <> 1 then raise exception 'B applications are not isolated'; end if;
end;
$$;

set local role anon;
do $$
begin
  begin perform id from public.posts limit 1; raise exception 'Anonymous post read permitted';
  exception when insufficient_privilege then null; end;
  begin perform public.list_posts(); raise exception 'Anonymous RPC execution permitted';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
rollback;
select 'RLS, duplicate-write and cursor assertions completed; all fixtures rolled back.' as result;
