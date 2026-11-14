# ApnaCircle — Architecture

## 1. High-level architecture

```text
User
 |
 v
React Native + Expo application
 |
 +-- Expo Router (navigation)
 |
 +-- Presentation layer
 |    +-- Screens
 |    +-- Reusable components
 |    +-- Feature components
 |
 +-- State layer
 |    +-- Zustand: client/UI preferences
 |    +-- TanStack Query: remote/server state
 |
 +-- Service layer
 |    +-- auth service
 |    +-- posts service
 |    +-- comments service
 |    +-- jobs service
 |    +-- profile service
 |
 v
Supabase client
 |
 +-- Supabase Auth
 +-- PostgreSQL
 +-- Supabase Storage
 +-- Row Level Security
```

## 2. Architectural responsibilities

### Presentation layer
Contains route screens and reusable UI components. Components should receive typed props and should not contain direct database access.

### Feature layer
Groups functionality by domain: authentication, feed, posts, comments, jobs, notifications, and profile.

### Hooks
Encapsulate reusable feature logic and connect screens/components to services and TanStack Query.

### Service layer
Contains Supabase queries and mutations. It is responsible for data access, query construction, and mapping backend responses into application types where needed.

### State management
- **Zustand:** selected location, language preference, temporary UI state, and other client-owned state.
- **TanStack Query:** posts, jobs, comments, profiles, notifications, and other server-owned data.
- Do not duplicate remote records in Zustand.
- Include the authenticated user ID in keys for private or personalized results, including feed/job records with saved, liked, or applied state.
- On logout/account change, cancel outgoing account queries, remove its cached data, reset its active drafts, and ignore late query/mutation results for that account.
- Preserve active composer input after recoverable errors and retain loaded query data during refresh. Durable offline drafts and queued writes are outside the MVP.

### Backend
Supabase provides authentication, PostgreSQL persistence, object storage, and RLS enforcement.

## 3. Suggested repository structure

```text
apnacircle/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── jobs.tsx
│   │   ├── create.tsx
│   │   ├── saved.tsx
│   │   └── profile.tsx
│   ├── posts/
│   │   └── [id].tsx
│   ├── jobs/
│   │   └── [id].tsx
│   ├── applications.tsx
│   ├── notifications.tsx
│   └── settings/
│       └── index.tsx
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── posts/
│   │   ├── jobs/
│   │   └── profile/
│   ├── features/
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── posts/
│   │   ├── comments/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   └── profile/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── lib/
│   ├── types/
│   ├── schemas/
│   ├── constants/
│   └── utils/
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── documentaion/
└── .env.example
```

Adapt this structure only when the repository or framework requires it. Do not create empty folders without a real use.

Bottom tabs are **Home · Jobs · Create · Saved · Profile**. Home and Jobs own search/filter controls. Post/job details, application history, and notifications are stack screens; a header icon opens notifications when implemented. Preserve the existing `documentaion/` directory unless a separate rename is requested.

## 4. Data flow example: loading the feed
1. Home screen calls a feature hook such as `usePosts`.
2. `usePosts` uses TanStack Query (`useInfiniteQuery`).
3. Query function calls `postsService.getPosts`.
4. Service queries Supabase with filters and a `(created_at, id)` cursor, ordered by both fields descending. Changing filters resets pagination.
5. Supabase applies RLS.
6. Data returns through the query cache to the screen.
7. UI renders the records with `FlatList`, retaining loaded content during refresh and showing retry feedback after recoverable failures.

## 5. Data flow example: creating a post
1. User fills the create-post form.
2. React Hook Form manages form state.
3. Zod validates the input.
4. The composer creates one post UUID per submission and reuses it on retries. An optional image is uploaded under an owner/post-specific Storage path.
5. `postsService.createPost` inserts the record using that UUID. A timeout triggers reconciliation against the same ID; it does not immediately trigger a second post or image deletion.
6. Confirmed success updates the active account's feed queries and clears the composer. Recoverable failure retains input and offers retry.
7. An unused upload is removed only when the post is confirmed absent and no write for that submission remains in flight. Uncertain outcomes and cleanup failures are retained for retry/maintenance. `API_DOCUMENTATION.md` defines the recovery contract; Storage and PostgreSQL writes are not one atomic transaction.

## 6. Data flow example: authentication
1. Login screen submits credentials through the auth service.
2. Supabase Auth validates credentials.
3. Auth state listener updates the application auth state.
4. Router redirects the user to the correct route group.
5. Protected data requests use the authenticated Supabase session.
6. RLS determines which database rows the user can access.
7. App lifecycle handling manages session refresh when returning to the foreground; register listeners once and clean them up appropriately.
8. Logout/account changes clear outgoing account data before the next account's screens are shown. Restart and background/foreground behavior must be tested on a device.

## 7. Important architecture decisions
- Keep database access out of UI components.
- Keep server state in TanStack Query.
- Keep client preferences/UI state in Zustand.
- Enforce authorization with RLS.
- Use migrations as the source of truth for schema changes.
- Keep environment variables documented in `.env.example`.
- Never ship the Supabase service-role key in the mobile app.
- Use trusted backend logic for like/comment notifications after core flows are stable. Defer reply and application-update events until their workflows exist.
- Keep application strings and locale-aware formatting centralized for English and Hindi; verify native layouts and accessibility in both languages.
- Deliver an Android release build first, with device/performance evidence; record iOS coverage separately.
