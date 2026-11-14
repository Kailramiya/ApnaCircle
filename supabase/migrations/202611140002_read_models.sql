-- Security invoker functions retain the caller's RLS and privileges.
-- Full-precision timestamps are returned as strings, never rounded in JavaScript.
create function public.list_posts(
  p_search text default '', p_category text default null, p_locality text default null,
  p_author uuid default null, p_saved boolean default false, p_post_id uuid default null,
  p_cursor_time timestamptz default null, p_cursor_id uuid default null, p_limit integer default 20
) returns setof jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(p) || jsonb_build_object(
    'author', jsonb_build_object('id', a.id, 'full_name', a.full_name, 'username', a.username, 'avatar_path', a.avatar_path),
    'like_count', (select count(*) from public.likes l where l.post_id = p.id),
    'comment_count', (select count(*) from public.comments c where c.post_id = p.id),
    'liked', exists(select 1 from public.likes l where l.post_id = p.id and l.user_id = (select auth.uid())),
    'saved', s.id is not null,
    'sort_at', case when p_saved then s.created_at else p.created_at end,
    'sort_id', case when p_saved then s.id else p.id end
  )
  from public.posts p join public.profiles a on a.id = p.user_id
  left join public.saved_posts s on s.post_id = p.id and s.user_id = (select auth.uid())
  where (p_category is null or p.category = p_category)
    and (p_locality is null or p.locality = p_locality)
    and (p_author is null or p.user_id = p_author)
    and (p_post_id is null or p.id = p_post_id)
    and (not p_saved or s.id is not null)
    and (p_search = '' or strpos(lower(p.description), lower(left(p_search, 100))) > 0)
    and (p_cursor_time is null or (
      case when p_saved then s.created_at else p.created_at end,
      case when p_saved then s.id else p.id end
    ) < (p_cursor_time, p_cursor_id))
  order by case when p_saved then s.created_at else p.created_at end desc,
           case when p_saved then s.id else p.id end desc
  limit greatest(1, least(p_limit, 50));
$$;

create function public.list_comments(p_post_id uuid, p_cursor_time timestamptz default null, p_cursor_id uuid default null, p_limit integer default 20)
returns setof jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(c) || jsonb_build_object('author', jsonb_build_object(
    'id', a.id, 'full_name', a.full_name, 'username', a.username, 'avatar_path', a.avatar_path),
    'sort_at', c.created_at, 'sort_id', c.id)
  from public.comments c join public.profiles a on a.id = c.user_id
  where c.post_id = p_post_id and (p_cursor_time is null or (c.created_at, c.id) < (p_cursor_time, p_cursor_id))
  order by c.created_at desc, c.id desc limit greatest(1, least(p_limit, 50));
$$;

create function public.list_jobs(
  p_search text default '', p_type text default null, p_locality text default null,
  p_saved boolean default false, p_applied boolean default false, p_job_id uuid default null,
  p_cursor_time timestamptz default null, p_cursor_id uuid default null, p_limit integer default 20
) returns setof jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(j) || jsonb_build_object('saved', s.id is not null, 'applied', a.id is not null,
    'application_created_at', a.created_at,
    'sort_at', case when p_applied then a.created_at when p_saved then s.created_at else j.created_at end,
    'sort_id', case when p_applied then a.id when p_saved then s.id else j.id end)
  from public.jobs j
  left join public.saved_jobs s on s.job_id = j.id and s.user_id = (select auth.uid())
  left join public.job_applications a on a.job_id = j.id and a.user_id = (select auth.uid())
  where (p_type is null or j.employment_type = p_type)
    and (p_locality is null or j.locality = p_locality)
    and (p_job_id is null or j.id = p_job_id)
    and (not p_saved or s.id is not null) and (not p_applied or a.id is not null)
    and (p_search = '' or strpos(lower(j.title || ' ' || j.company_name), lower(left(p_search, 100))) > 0)
    and (p_cursor_time is null or (
      case when p_applied then a.created_at when p_saved then s.created_at else j.created_at end,
      case when p_applied then a.id when p_saved then s.id else j.id end
    ) < (p_cursor_time, p_cursor_id))
  order by case when p_applied then a.created_at when p_saved then s.created_at else j.created_at end desc,
           case when p_applied then a.id when p_saved then s.id else j.id end desc
  limit greatest(1, least(p_limit, 50));
$$;

create function public.list_notifications(p_cursor_time timestamptz default null, p_cursor_id uuid default null, p_limit integer default 20)
returns setof jsonb language sql stable security invoker set search_path = '' as $$
  select to_jsonb(n) || jsonb_build_object('actor_name', a.full_name, 'sort_at', n.created_at, 'sort_id', n.id)
  from public.notifications n join public.profiles a on a.id = n.actor_id
  where n.recipient_id = (select auth.uid()) and (p_cursor_time is null or (n.created_at, n.id) < (p_cursor_time, p_cursor_id))
  order by n.created_at desc, n.id desc limit greatest(1, least(p_limit, 50));
$$;

revoke all on function public.list_posts(text,text,text,uuid,boolean,uuid,timestamptz,uuid,integer),
  public.list_comments(uuid,timestamptz,uuid,integer), public.list_jobs(text,text,text,boolean,boolean,uuid,timestamptz,uuid,integer),
  public.list_notifications(timestamptz,uuid,integer) from public, anon;
grant execute on function public.list_posts(text,text,text,uuid,boolean,uuid,timestamptz,uuid,integer),
  public.list_comments(uuid,timestamptz,uuid,integer), public.list_jobs(text,text,text,boolean,boolean,uuid,timestamptz,uuid,integer),
  public.list_notifications(timestamptz,uuid,integer) to authenticated;
