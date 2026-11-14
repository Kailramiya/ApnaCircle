# ApnaCircle — Service and API Contracts

## 1. Purpose
This document describes the intended client-facing service layer. These are application service contracts, not a promise that the functions already exist. Update this document to match the actual implementation.

## 2. Service organization
Suggested files:
- `auth.service.ts`
- `posts.service.ts`
- `comments.service.ts`
- `jobs.service.ts`
- `profile.service.ts`
- `notifications.service.ts`

Screens and presentational components should call feature hooks. Hooks should call service functions. Service functions communicate with Supabase.

## 3. Authentication service
Suggested functions:
```ts
signUp(input: { email: string; password: string; fullName: string })
signIn(input: { email: string; password: string })
signOut()
getCurrentSession()
```

Responsibilities:
- Call Supabase Auth.
- Return typed results.
- Normalize and surface errors.
- Keep session persistence configured in the Supabase client.
- Manage foreground/background session refresh and listener cleanup using the supported React Native setup.
- On logout/account change, cancel old queries, remove outgoing account cache/drafts, and prevent late results from updating the next account's UI.
- Never store plaintext passwords.

## 4. Posts service
Suggested contracts:
```ts
getPosts(input: {
  city?: string;
  locality?: string;
  category?: string;
  search?: string;
  cursor?: string;
  limit: number;
})

getPostById(postId: string)

createPost(input: {
  postId: string;
  description: string;
  category: string;
  city: string;
  locality?: string;
  imageUri?: string;
})

deletePost(postId: string)

setPostLiked(input: {
  postId: string;
  liked: boolean;
})

setPostSaved(input: {
  postId: string;
  saved: boolean;
})

getSavedPosts(input: { cursor?: string; limit: number })
```

Implementation notes:
- Feed pagination uses `created_at DESC, id DESC`. The cursor encodes both values from the last item, retaining database timestamp precision; the next page uses a strict tuple comparison. Validate cursors and bound page size.
- Apply the same two-field ordering/cursor contract to newest-first jobs, comments, saved content, application history, user posts, and notifications. Saved content uses the saved record's timestamp/ID, not the underlying post/job's. Reset pages when filters or the account change; deduplicate merged results by record ID.
- Ensure the database has matching indexes.
- RLS must enforce ownership.
- Avoid relying on a client-supplied `user_id` for authorization.
- `setPostLiked` and `setPostSaved` set a desired state. Repeating an insert for an existing unique pair or deleting an absent pair is safe. Do not implement retryable operations as blind toggles.

### Publish and upload recovery
- Generate `postId` as a UUID once per new submission; reuse it for all retries of that submission. Derive ownership from the authenticated session and enforce it through RLS.
- Store an optional image under an owner/post-specific path and retain that path while publishing. The post stores `image_path`; services resolve display URLs according to bucket visibility.
- Keep one publish attempt in flight. Clear the active composer only after confirming that this post exists for the current user; otherwise preserve text, category, and image selection for retry.
- If the response is lost or times out, look up the same post ID before retrying. The primary key prevents a second row; on a conflict, reconcile the existing owned post rather than overwriting it or generating another ID.
- Delete an uploaded object only after a definite insertion failure/confirmed absence with no in-flight write. If the outcome is still uncertain, keep the object and retry reconciliation; never delete a possibly committed post's image.
- Track unresolved object paths and cleanup failures in development diagnostics for retry/maintenance. An interrupted app may require maintenance cleanup; the MVP does not promise a durable recovery queue or atomic Storage/database writes.

## 5. Comments service
Suggested contracts:
```ts
getComments(input: { postId: string; cursor?: string; limit: number })
createComment(input: { postId: string; content: string })
deleteComment(commentId: string)
```

Validate content and enforce ownership in the database.

## 6. Jobs service
Suggested contracts:
```ts
getJobs(input: {
  city?: string;
  locality?: string;
  search?: string;
  employmentType?: string;
  cursor?: string;
  limit: number;
})

getJobById(jobId: string)
applyForJob(jobId: string)
getMyApplications(input: { cursor?: string; limit: number })
setJobSaved(input: { jobId: string; saved: boolean })
getSavedJobs(input: { cursor?: string; limit: number })
```

Enforce one application per user/job with a unique constraint. `applyForJob` derives the user from the session and returns the existing application on a duplicate retry without changing its status. `setJobSaved` sets the requested state safely on repeated calls. Applications start as `submitted`; no employer delivery/review or status-update API is part of the demo MVP.

## 7. Profile service
Suggested contracts:
```ts
getProfile(userId: string)
updateProfile(input: {
  fullName?: string;
  username?: string;
  bio?: string;
  city?: string;
  locality?: string;
  preferredLanguage?: string;
  avatarUri?: string;
})
getUserPosts(input: { userId: string; cursor?: string; limit: number })
```

A user must only update their own profile.

## 8. Notifications service
Suggested contracts:
```ts
getNotifications(input: { cursor?: string; limit: number })
markNotificationRead(notificationId: string)
markAllNotificationsRead()
```

A user can only access and update notifications addressed to them.

This service is a secondary feature after core release flows are stable. MVP notification types are `like` and `comment`, generated by trusted backend logic after successful interactions and excluding self-actions. Mark-read operations may change only read state. Reply and application-update notifications are deferred until their data models and authorized workflows exist.

## 9. Query key conventions
Use stable, structured keys. Here `userId` is the authenticated viewer and `profileId` is the profile being viewed:
```ts
['posts', userId, { city, locality, category, search }]
['post', userId, postId]
['comments', userId, postId]
['jobs', userId, { city, locality, search, employmentType }]
['job', userId, jobId]
['profile', userId, profileId]
['user-posts', userId, profileId]
['notifications', userId]
['saved-posts', userId]
['saved-jobs', userId]
['applications', userId]
```

Keep query keys consistent and avoid putting non-serializable objects in them. Disable authenticated queries until the user ID is available. Feed/job data includes account-specific liked, saved, or applied state and must not be reused across accounts. Logout must cancel old requests, remove outgoing account data (including any persisted cache), and prevent late completions from repopulating it. Cache keys do not replace RLS.

## 10. Mutation cache behavior
After a successful mutation:
- Creating a post: refresh or update relevant feed queries.
- Liking a post: update/invalidate the post/feed data.
- Saving a post/job: update/invalidate its detail/list state and the account's Saved tab queries.
- Adding a comment: update/invalidate comments and comment count.
- Applying for a job: update application state and relevant job detail.
- Updating a profile: update profile queries and visible author data as needed.

If using optimistic updates, implement rollback on failure. Scope updates to the initiating account and ignore stale completions after logout/account changes. Preserve existing list content during refresh; a failed refresh should show retry feedback without replacing usable content with a full-screen loader.

## 11. Error handling contract
Service functions should return typed data or throw/return a normalized error consistently. Choose one convention and apply it across the app. User-facing messages should be clear and should not expose internal secrets or SQL details.
