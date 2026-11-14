# Backend setup (run locally)

Create a dedicated Supabase development project. In its SQL editor run the files in `migrations/` in filename order, then run `seed.sql` **only in your demo/development project**. Alternatively use the Supabase CLI migration workflow from your machine. These files have not been executed in the authoring workspace.

1. Enable email/password Auth. Keep email confirmation enabled for a public demo.
2. Configure email delivery and password-reset templates for your own project.
3. Add `apnacircle://auth/callback` and `apnacircle://auth/callback?mode=recovery` to Auth's redirect allowlist. A development build is recommended for testing the custom scheme; Expo Go has a different deep-link address. Open PKCE links on the installation that requested them.
4. Copy the project URL and publishable/anon key into the mobile `.env` file. The service-role/secret key must never enter the app.
5. Create two test accounts through the app. Seed authors cannot log in: no passwords or identities are provisioned.
6. Run `tests/rls.sql` as the database owner in a development project, then follow [`LOCAL_VERIFICATION.md`](../documentaion/LOCAL_VERIFICATION.md). Auth's minimum password length should be 8, matching client validation.

The seed creates 6 explicitly fictional authors, 360 posts and 24 jobs. It is repeatable by fixed primary keys, including exact timestamp ties. It does not erase existing user data.

## Security and media

All client tables enforce RLS and column grants. Jobs are writable only by trusted administration. Notifications originate from database triggers; recipients can change only `is_read`. Read-model RPCs execute with the caller's permissions. Saved items and applications are private.

The two image buckets are intentionally **public**. Anyone with an image URL can view it; text content remains available only to authenticated users. Do not upload sensitive photos. Objects are immutable and owner-prefixed. The UI prepares JPEGs; the bucket enforces type and size. Profile storage uses `avatar_path` (not the original logical document's `avatar_url`); URLs are resolved in the client service.

Storage and PostgreSQL writes are separate. Never remove an image after an ambiguous publish response. The client retries with the same post UUID/path and reconciles the existing row. Potential abandoned uploads remain for maintenance rather than risking a published image.

For maintenance, query `storage.objects` older than 24 hours with no matching `posts.image_path` or `profiles.avatar_path`, review the candidates, and remove them through the **Storage API**, not SQL deletion of storage metadata. Do this only after excluding active/retryable submissions; age alone does not prove a delayed write cannot arrive. Review Storage API errors and retry confirmed unused paths. This MVP deliberately has no automatic garbage collector or durable submission queue.
