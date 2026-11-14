# ApnaCircle — Service and API contracts

These contracts match the authored source in `src/services`. They remain unverified against a running backend. Migrations are the source of truth for SQL permissions and column names; Zod schemas in `src/lib/models.ts` validate read results and form input.

## Authentication

`auth.ts` exports:

- `authenticate(credentials, register)` — sign in or register an email/password account. Profile creation is a separate onboarding step. Registration may return no session until email confirmation.
- `requestPasswordReset(email)` — request a recovery link to the app's callback.
- `exchangeAuthCode(code)` — exchange a PKCE code from `apnacircle://auth/callback`.
- `updatePassword(password)` — update the authenticated recovery session's password.
- `signOut()` — sign out this device session.

`src/providers.tsx` owns the session listener, restoration and foreground/background refresh. `src/lib/supabase.ts` configures encrypted session storage and request cancellation/timeouts. No password is persisted by the app. PKCE verifiers and session data use SecureStore; callbacks must return to the requesting installation.

## Read contracts

All growing lists use pages of 20 rows and a cursor `{ time: string, id: string }`. PostgreSQL timestamp strings keep their full precision. Returned rows contain `sort_at` and `sort_id`; use these fields rather than reconstructing timestamps with JavaScript `Date`.

| Service | Signature | SQL read model |
|---|---|---|
| Posts | `getPosts(filters, cursor, signal)` | `list_posts` |
| Comments | `getComments(postId, cursor, signal)` | `list_comments` |
| Jobs | `getJobs(filters, cursor, signal)` | `list_jobs` |
| Activity | `getNotifications(cursor, signal)` | `list_notifications` |
| Profile | `getProfile(userId, signal)` | Own profile query |
| Unread activity | `getUnreadCount(signal)` | Recipient-only count |

Post filters: `search`, `category`, `locality`, `author`, `saved`, `postId`. Job filters: `search`, `type`, `locality`, `saved`, `applied`, `jobId`. A detail query supplies its entity ID. Saved/application history uses the same read function with the relevant flag.

RPCs execute as the caller and retain RLS. Search is a bounded, case-insensitive literal substring; it is not ranked full-text search. Standard lists sort by `(created_at DESC, id DESC)`. Saved lists use saved-record timestamps/IDs; application history uses application timestamps/IDs. The next page uses a strict tuple comparison. Query keys include the viewer and all filters; merged rows are deduplicated by entity ID.

## Post submission and media

`createPost(submission)` receives:

```ts
type PostSubmission = {
  id: string;       // UUID generated once for this submission
  ownerId: string;  // Must equal the active account; RLS is authoritative
  values: {
    description: string;
    category: 'general' | 'help' | 'events' | 'recommendations';
    locality: 'Mansarovar' | 'Vaishali Nagar' | 'Malviya Nagar';
  };
  photo: { uri: string; width: number; height: number } | null;
};
```

The composer freezes these values on its first attempt. One attempt runs at a time. Retry first looks up the same owned post ID. If absent, it uploads the same immutable image path and inserts the row. An insert error triggers another lookup; a confirmed existing row is success. No retry overwrites an existing post or invents another UUID.

An absent lookup after a timeout is **not** proof that a delayed write cannot commit. The app therefore preserves its draft and media and asks the user to retry. Only confirmed success clears the composer. Tab changes keep the in-memory draft; discard/back removal asks for confirmation; logout clears it. No durable draft queue is promised.

`media.ts` exports `choosePhoto(maxDimension?)`, `uploadPhoto(bucket, path, photo)` and `mediaUrl(bucket, path)`. Photos are prepared as JPEGs, bounded to 1600 pixels for posts/640 for avatars and 10 MB. Paths are `<owner UUID>/<submission UUID>/image.jpg`. Objects are immutable; a retry can confirm an existing upload. `posts.image_path` and `profiles.avatar_path` store paths, not URLs.

Both image buckets are public by design. Retained Storage objects provide the inventory for manual orphan review. Never delete an image after an uncertain write or delete Storage metadata directly through SQL. See `supabase/README.md` for reviewed maintenance limits.

## Social mutations

- `setPostState(postId, 'liked' | 'saved', desired)` safely sets a desired state with an insert-on-conflict-do-nothing or owner-scoped delete. It implements the originally proposed `setPostLiked` and `setPostSaved` operations.
- `deletePost(postId)` deletes only the current user's post; cascading comments/social records follow SQL constraints. Media remains for reviewed maintenance.
- `addComment(id, postId, content)` preserves a client UUID and text across uncertain retries and reconciles the existing owned comment.
- `deleteComment(id)` deletes only the author's comment.

Likes/saves optimistically update relevant caches and roll back only their own fields on failure. Actions on other posts or other fields survive that rollback. Database unique constraints enforce one like/save per user/post.

## Jobs and applications

- `setJobSaved(jobId, saved)` is a desired-state mutation with uniqueness and owner RLS.
- `applyToJob(jobId)` inserts at most one application for the current user/job. It reads the existing application after insertion, including after an ambiguous response. It cannot advance status.

Applications return `id`, `status: 'submitted'` and `created_at`. The UI labels every application as a portfolio demo. There is no employer delivery, employer dashboard or review-status endpoint.

## Profiles and preferences

- `saveProfile(input, isNew, avatarPath?)` validates name, username, bio, locality and language. A failed new-profile insert reconciles an existing own row. Updates target the current account only.
- `savePreferences(locality, language)` writes only those preference fields, avoiding unrelated profile overwrites.

Usernames contain 3–24 lowercase ASCII letters, digits or underscores. Names contain 2–60 characters; bios allow 180. The server also validates these limits. Avatar paths must belong to the profile owner.

## Activity

`markRead(id)` writes only `is_read: true` for the recipient. Clients cannot create or rewrite events. Database triggers derive like/comment recipients from post ownership, exclude self-actions and deduplicate repeated like events. Comment deletion removes its notification. Push delivery and application-status events are outside this version.

## Account and failure boundaries

Each personalized query key starts with the user ID. Account changes cancel outgoing queries, clear caches, remount signed-in navigation and invalidate an account epoch. Async work checks that epoch before another write or UI/cache update. Mutation retries are explicit; offline writes are not queued.

User-visible errors and validation keys resolve through the English/Hindi dictionary. Low-level SQL/auth details do not appear in UI messages. Source checks, SQL policy checks, native callbacks, actual image I/O and concurrent retries still require the local procedure in `LOCAL_VERIFICATION.md`.
