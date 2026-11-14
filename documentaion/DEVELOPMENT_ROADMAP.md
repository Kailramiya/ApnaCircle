# ApnaCircle — Development Roadmap

## Working method
Develop incrementally. Do not ask an AI coding agent to generate the entire application in one pass. Each phase should end with a working, testable state and updated documentation.

The first release demonstrates local community updates and nearby jobs in one city. Core delivery includes saved content, complete job applications/history, English/Hindi support, reliable native behavior, and an installable Android build. Like/comment notifications follow stable core flows; employer tools, reply/application-update notifications, push, and durable offline write queues remain later work.

## Phase 0 — Repository inspection
- Inspect existing files and package manager.
- Identify whether the repository is empty or already initialized.
- Check Node.js and Expo compatibility.
- Record existing decisions before changing anything.
- Select and record the demonstration city/localities and available Android/iOS test devices.

**Exit criteria:** Repository state and setup plan are documented.

## Phase 1 — Foundation
- Initialize/configure Expo and TypeScript.
- Configure Expo Router.
- Configure linting and formatting if appropriate.
- Establish the feature-based folder structure.
- Add environment variable handling.
- Add the Home, Jobs, Create, Saved, and Profile tab shell, plus stack routes for details and application history. Notifications use a header entry and stack screen when implemented.

**Exit criteria:** App launches and navigation shell works.

## Phase 2 — Design system
- Define color, spacing, typography, and radius tokens.
- Build buttons, inputs, avatars, chips, cards, and state components.
- Implement loading, empty, and error patterns.
- Establish English/Hindi strings and locale-aware formatting from the start; include validation, errors, and accessible labels.
- Verify reusable components with long Hindi text, larger system text, small/large screens, and keyboard-visible layouts.

**Exit criteria:** Shared components are used by initial screens.

## Phase 3 — Supabase and authentication
- Create Supabase project.
- Configure client for React Native session persistence.
- Add profiles table and initial migration.
- Implement registration, login, logout, and session restoration.
- Add protected route behavior.
- Test with separate user accounts.
- Scope private/personalized query keys to the account and clear outgoing data/drafts on logout. Prevent late requests from restoring old account state.
- Verify session restoration after restart and background/foreground transitions.

**Exit criteria:** Authentication and session restoration work, profile ownership is protected, and switching accounts reveals no previous account's data.

## Phase 4 — Feed
- Create posts schema, indexes, and RLS.
- Build PostCard.
- Implement posts service and query hooks.
- Add `(created_at, id)` cursor pagination and pull-to-refresh; test identical timestamps across page boundaries.
- Add debounced post search and location/category filtering; reset pagination when filters change.
- Seed clearly labeled, realistic posts for the demonstration city and retain loaded content during refresh or a recoverable network error.

**Exit criteria:** Feed loads real backend data and handles all UI states.

## Phase 5 — Create post and media
- Build post composer.
- Add category validation.
- Integrate Expo Image Picker.
- Configure Storage bucket and policies.
- Upload images and create post records.
- Handle cancellation and failures.
- Preserve active composer input after recoverable errors; support denied permissions and text-only posting.
- Reuse one post UUID per submission, reconcile uncertain outcomes, and track cleanup of confirmed-unused images according to `API_DOCUMENTATION.md`.
- Require an explicit discard choice when leaving unsaved content. Durable draft recovery/offline publishing is outside this phase.

**Exit criteria:** User can publish text and image posts, retries cannot duplicate posts, failed publishing retains input, and cleanup cannot remove a committed post's image.

## Phase 6 — Social interactions
- Implement likes and unique constraint.
- Implement comments.
- Implement saved posts.
- Add optimistic updates only where safe.
- Use desired-state like/save operations and pending controls; verify repeated requests and failure rollback.
- Surface saved posts in the Saved tab and check state after restart.

**Exit criteria:** Interactions persist and are scoped to the authenticated user.

## Phase 7 — Jobs
- Create jobs, applications, and saved jobs schema.
- Add development seed data.
- Build listing and detail screens.
- Add search and filters.
- Implement application and save flows.
- Add saved jobs to Saved and application history to a stack screen reachable from Jobs/Profile.
- Keep application status `submitted`; label seeded jobs and explain that applications remain inside the demo.
- Verify database uniqueness on repeated apply requests, private application history, and persisted saved/applied state after restart.

**Exit criteria:** User can browse jobs, apply once, and view their applications.

## Phase 8 — Profile and settings
- Build profile screen.
- Add profile editing and avatar upload.
- Display the user's posts, application history, and a shortcut to Saved.
- Add language/location preferences.
- Add logout.

**Exit criteria:** User can manage profile and preferences.

## Phase 9 — Localization completion and optional notifications
- Finish English/Hindi translations across complete core journeys, including validation, errors, loading/empty states, and accessible labels.
- Verify locale-aware dates/numbers, persisted language choice, long strings, font rendering, and system text scaling.
- After the core flows are stable, add trusted backend generation of like/comment notifications, excluding self-actions.
- Add unread/read behavior on a stack screen reached from a header icon. Limit client updates to read state.
- Defer replies, application updates, and push notifications until their supporting workflows are designed and implemented.

**Exit criteria:** English/Hindi core journeys pass layout and behavior checks. Like/comment notifications are either verified or explicitly recorded as deferred; they do not block the core release.

## Phase 10 — Quality and release preparation
- Test key flows in an installable Android release on a physical device. Test iOS where available and record its coverage separately; do not claim iOS verification without testing it.
- Fix layout and navigation issues.
- Check RLS and storage policies.
- Run the critical automated checks below using the smallest suitable existing tooling.
- Check release-build feed scrolling with several hundred seeded posts. Record device/OS, build, dataset size, observed issues, and any measured improvements; optimize based on evidence.
- Add screenshots, environment variable names, database/seed setup, run/build/check commands, and known limitations to README.
- Provide the installable Android build and a short demo showing authentication, location filtering, image posting, social interactions, saved content, job application/history, and Hindi support.
- Record one resolved bug and one architectural tradeoff with verification evidence for portfolio discussion.
- Remove secrets and local-only files from Git.
- Update all documentation.

**Exit criteria:** A reviewer can install and demonstrate the core MVP, reproduce setup/checks, and see honest device, language, and platform coverage. All required core checks pass. Record failures in `PROGRESS.md` and leave this phase incomplete until they are resolved.

### Required verification record
Record actual commands/results for automated checks and device/OS/build details for native checks. These are planned checks, not claims of completion.

| Check | Expected result | Verification |
|---|---|---|
| Two authenticated users | A cannot edit B's post or read B's saved content/applications | Automated database/service check under both user sessions |
| Repeated likes and applications | One row per unique pair; retrying the same request does not reverse desired state | Automated mutation/constraint check |
| Failed publish | Text/category/image remain available for retry; no false success | Automated composer failure check |
| Upload succeeds, insert fails or times out | Confirmed-unused upload is cleaned or tracked; uncertain/committed uploads are retained until reconciled; retries reuse one post ID | Automated service failure/retry check |
| Equal timestamps across feed pages | Stable ordering without missing/duplicate seeded records; filters restart pagination | Automated pagination check |
| Restart, backgrounding, and account switch | Valid session and completed actions persist; previous account's data never appears | Native-device flow check |
| Permissions, keyboard, back, slow network | Denied/canceled picker retains text; controls stay reachable; back offers discard; failed refresh retains content | Native-device flow check |
| English/Hindi and accessibility | Core copy is translated; long/scaled text fits; screen-reader controls have meaningful names/states | Small/large layout comparison and native accessibility check |
| Feed scrolling | Release build checked with several hundred posts; device, dataset, and actual observations recorded | Physical Android device check |

## Immediate internship-focused priority
If time is limited, prioritize:
1. Professional Home/Jobs/Create/Saved/Profile navigation and reusable accessible components.
2. Authentication, lifecycle handling, and account isolation.
3. Supabase-backed feed with search/filters, stable pagination, and refresh/retry behavior.
4. Post creation and image upload with input preservation and duplicate-safe recovery.
5. Likes, basic comments, and saved posts.
6. Complete job discovery, saved jobs, application, and history flows.
7. Profile and complete English/Hindi support.
8. Native checks, critical automated checks, Android release, README, and demo.

If time is limited, defer optional notifications and later features first. Do not mark missing core requirements complete or spend early time on push notifications, advanced recommendations, or an employer dashboard.
