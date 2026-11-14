# Backend setup (run locally)

Create a dedicated Supabase development project. In its SQL editor run the files in `migrations/` in filename order, then run `seed.sql` **only in your demo/development project**. Alternatively use the Supabase CLI migration workflow from your machine. These files have not been executed in the authoring workspace.

1. Enable email/password Auth. Keep email confirmation enabled for a public demo.
2. Configure email delivery and password-reset templates for your own project.
3. Add `apnacircle://auth/callback` and `apnacircle://auth/callback?mode=recovery` to Auth's redirect allowlist. A development build is recommended for testing the custom scheme; Expo Go has a different deep-link address. Open PKCE links on the installation that requested them.
4. Copy the project URL and publishable/anon key into the mobile `.env` file. The service-role/secret key must never enter the app.
5. Create two test accounts through the app. Seed authors cannot log in: no passwords or identities are provisioned.
6. Run `tests/rls.sql` as the database owner in a development project, then follow [`LOCAL_VERIFICATION.md`](../documentaion/LOCAL_VERIFICATION.md). Auth's minimum password length should be 8, matching client validation.

The seed creates 6 explicitly fictional authors, 360 posts and 24 jobs. It is repeatable by fixed primary keys, including exact timestamp ties. It does not erase existing user data.

## Diagnosing a failed signup

The app maps known Auth error codes to English/Hindi messages; an unknown failure still uses a generic message. In the project's **Logs** view, select the **Auth** log type and the time range covering the failed attempt, then inspect its error code, message and status. If there is no matching Auth event, check **API Gateway** events for `/auth/v1/signup` and confirm the device can reach the configured project. Share only the relevant error fields, not credentials, tokens or complete request headers. See [Logs in Studio](https://supabase.com/docs/guides/observability/logs).

| Error code | Action |
|---|---|
| Gateway `UNAUTHORIZED_INVALID_API_KEY` / HTTP 401 | Copy the publishable key from the same project as the URL. Check for an extra leading `=` or placeholder in `.env`, then restart Expo and fully reload the app. |
| `email_address_not_authorized` | The default email service sends only to existing organization members. Use an already-authorized address for development, or configure custom SMTP to send to other app users. |
| `over_email_send_rate_limit` / `over_request_rate_limit` | Wait for the limit to reset; repeated retries do not fix it. Review Auth limits and email delivery configuration. |
| `signup_disabled` / `email_provider_disabled` | Check that new-user signup and the email/password provider are enabled. |
| `weak_password` | Use a password that satisfies the project's configured strength requirements. |
| `unexpected_failure` or a database error | Inspect the related Auth/Postgres log entry before changing migrations, triggers or permissions. |

The owner's supplied event confirmed the gateway invalid-key branch: the key prefix began with an extra `=`. After configuration and migration guidance, the owner reported the app working. Use the other branches only when a new event supports them. Keep email confirmation enabled for the public demo. Default email restrictions and custom SMTP setup are documented in [Supabase's email guide](https://supabase.com/docs/guides/auth/auth-smtp); error meanings are in the [Auth error reference](https://supabase.com/docs/guides/auth/debugging/error-codes).

## Security and media

All client tables enforce RLS and column grants. Jobs are writable only by trusted administration. Notifications originate from database triggers; recipients can change only `is_read`. Read-model RPCs execute with the caller's permissions. Saved items and applications are private.

The two image buckets are intentionally **public**. Anyone with an image URL can view it; text content remains available only to authenticated users. Do not upload sensitive photos. Objects are immutable and owner-prefixed. The UI prepares JPEGs; the bucket enforces type and size. Profile storage uses `avatar_path` (not the original logical document's `avatar_url`); URLs are resolved in the client service.

Storage and PostgreSQL writes are separate. Never remove an image after an ambiguous publish response. The client retries with the same post UUID/path and reconciles the existing row. Potential abandoned uploads remain for maintenance rather than risking a published image.

For maintenance, query `storage.objects` older than 24 hours with no matching `posts.image_path` or `profiles.avatar_path`, review the candidates, and remove them through the **Storage API**, not SQL deletion of storage metadata. Do this only after excluding active/retryable submissions; age alone does not prove a delayed write cannot arrive. Review Storage API errors and retry confirmed unused paths. This MVP deliberately has no automatic garbage collector or durable submission queue.
