-- DEMO DATABASE ONLY. No passwords or login identities are assigned to sample authors.
-- Sign up separate real test accounts through the app to test authentication/RLS.
begin;
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'authenticated', 'authenticated',
  'demo-' || n || '@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from generate_series(1, 6) n on conflict (id) do nothing;
insert into public.profiles (id, full_name, username, locality, bio)
select ('10000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  (array['Aarav · Demo','Meera · Demo','Kabir · Demo','Aditi · Demo','Riya · Demo','Dev · Demo'])[n],
  'demo_neighbour_' || n,
  (array['Mansarovar','Vaishali Nagar','Malviya Nagar'])[1 + (n - 1) % 3],
  'Fictional profile for the ApnaCircle portfolio demo.'
from generate_series(1, 6) n on conflict (id) do nothing;

insert into public.posts (id, user_id, description, category, locality, is_demo, created_at)
select ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad((1 + (n - 1) % 6)::text, 12, '0'))::uuid,
  (array[
    'Our weekend reading circle is welcoming new neighbours. Which book should we discuss next?',
    'Can anyone recommend a reliable cycle repair shop around the neighbourhood?',
    'पड़ोस में बच्चों के लिए पुस्तक विनिमय रखें? अपनी पसंद की किताब का नाम बताएँ।',
    'A small reminder to keep water bowls for birds clean during warm afternoons.',
    'Looking for a study partner for React Native interviews. Let’s practise together.',
    'कौन-सी स्थानीय चाय की दुकान आपकी पसंदीदा है? अपने सुझाव साझा करें।',
    'Thinking of starting a Sunday morning walking group. What time works for you?',
    'Does anyone know a quiet public reading space nearby? Tips welcome.'
  ])[1 + (n - 1) % 8] || E'\n\nSample conversation ' || n || ' · Demo content',
  (array['general','help','events','recommendations'])[1 + (n - 1) % 4],
  (array['Mansarovar','Vaishali Nagar','Malviya Nagar'])[1 + (n - 1) % 3], true,
  -- Groups share the exact microsecond timestamp to exercise keyset pagination.
  '2026-11-01 10:00:00.123456+00'::timestamptz - ((n - 1) / 25) * interval '1 hour'
from generate_series(1, 360) n on conflict (id) do nothing;

insert into public.jobs (id, title, company_name, description, salary_min, salary_max, employment_type, locality, is_demo, created_at)
select ('30000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  (array['React Native Intern','Community Coordinator','Customer Support Associate','Junior Designer','Retail Assistant','Content Intern'])[1 + (n - 1) % 6],
  (array['Pink City Studio · Demo','Neighbourhood Works · Demo','Jaipur Learning Lab · Demo'])[1 + (n - 1) % 3],
  'FICTIONAL DEMO LISTING. Explore a local role with a sample team. Practise communication, collaborate on everyday projects and learn from feedback. Basic computer skills and a willingness to learn are helpful. Applications only record interest in this portfolio app; no employer receives them.',
  8000 + n * 500, 12000 + n * 500,
  (array['internship','full_time','part_time','contract'])[1 + (n - 1) % 4],
  (array['Mansarovar','Vaishali Nagar','Malviya Nagar'])[1 + (n - 1) % 3], true,
  '2026-11-01 10:00:00.123456+00'::timestamptz - ((n - 1) / 8) * interval '1 day'
from generate_series(1, 24) n on conflict (id) do nothing;
commit;
