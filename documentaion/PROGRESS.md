# ApnaCircle — Progress and Session Memory

> This file is the source of truth for the current implementation status. Update it after every meaningful coding session. Do not mark a feature complete based only on generated code; verify it.

## Current status
- [x] Workspace inspected: nine documentation files only; no app source or package configuration found
- [x] Internship-focused documentation revision completed (2026-11-14)
- [ ] Expo project configured
- [ ] TypeScript configured
- [ ] Expo Router configured
- [ ] Home/Jobs/Create/Saved/Profile tabs and detail/history stack routes implemented
- [ ] Design tokens created
- [ ] Reusable components implemented
- [ ] Supabase client configured
- [ ] Database migrations created
- [ ] RLS policies implemented and tested
- [ ] Authentication implemented
- [ ] Session restoration after restart/backgrounding verified
- [ ] Account-scoped caching and logout/account-switch isolation verified
- [ ] Onboarding implemented
- [ ] Home feed implemented
- [ ] Feed pagination implemented
- [ ] Equal-timestamp cursor pagination verified
- [ ] Pull-to-refresh implemented
- [ ] Post/job search and location filters implemented
- [ ] Post creation implemented
- [ ] Image upload implemented
- [ ] Failed-publish input preservation and duplicate-safe upload recovery verified
- [ ] Likes implemented
- [ ] Comments implemented
- [ ] Saved posts implemented
- [ ] Job listings implemented
- [ ] Job details implemented
- [ ] Job applications implemented
- [ ] Application history and persisted applied state verified
- [ ] Saved jobs implemented
- [ ] Profile implemented
- [ ] In-app notifications implemented
- [ ] Hindi localization implemented
- [ ] English/Hindi validation, errors, empty states, accessible labels, and locale formatting verified
- [ ] Native keyboard/back/permissions and small/large text layouts verified
- [ ] Slow-network retry behavior and loaded-content preservation verified
- [ ] Critical automated checks in the roadmap pass
- [ ] Demo city/localities and clearly labeled seed content recorded
- [ ] Release-build scrolling checked with several hundred posts on a physical Android device
- [ ] Android testing completed
- [ ] iOS testing completed
- [ ] Installable Android release and short demo available
- [ ] README completed

## Current development phase
Planning revised; application implementation has not started. The local `apnacircle/` directory contains documentation only and is not a Git repository. Phase 0 inspection is complete, but environment/package compatibility and demo-city/device selection remain pending before Phase 1.

## Completed features
Add only features that have been implemented and tested.
- None recorded yet.

## In progress
- None recorded yet.

## Pending work
- Confirm Expo and package versions.
- Record the demonstration city/localities and available test devices.
- Set up the foundation.
- Implement core features in roadmap order: feed/social, saved content, complete jobs/applications, profile, and English/Hindi support.
- Implement and record the roadmap's automated/native checks, then prepare an Android release and demo.
- Add optional like/comment notifications only after the core flows are stable. iOS remains unverified until tested.

## Known bugs
- No application exists to test yet; this is not evidence of a bug-free implementation. Add reproducible details when bugs are discovered.

## Architecture decisions
Record decisions with date, reason, and impact.
- Use Expo + React Native + TypeScript.
- Use Expo Router for navigation.
- Use Zustand for client-owned state.
- Use TanStack Query for server state.
- Use Supabase for Auth, PostgreSQL, and Storage.
- Use RLS as the authorization boundary.
- 2026-11-14: Focus the first release on one demonstration city's community updates and nearby jobs, with clearly labeled seed content.
- 2026-11-14: Use Home/Jobs/Create/Saved/Profile tabs; keep search in Home/Jobs and notifications behind a header entry to a stack screen.
- 2026-11-14: Make saved content, applications/history, English/Hindi, native reliability, and an installable Android release core requirements.
- 2026-11-14: Scope personalized queries by account, use `(created_at, id)` cursors, and preserve active composer input with one post UUID across retries.
- 2026-11-14: Restrict initial notifications to trusted like/comment events after core flows; defer replies, application updates, push, and durable offline write queues.

## Environment setup
Maintain variable names only. Never commit real secrets.
Expected variables may include:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Do not add service-role credentials to the mobile application.

## Last session summary
2026-11-14: Reviewed and revised all nine documentation files for the agreed internship-focused scope, navigation, mobile behavior, failure recovery, and release verification. No app code, database migrations, builds, or application tests were created or run. All implementation checkboxes remain unchecked.

## Next recommended task
Finish Phase 0 environment/compatibility checks and record the demo city/test devices, then implement Phase 1 of `DEVELOPMENT_ROADMAP.md`. Use the existing `documentaion/` directory and preserve the revised core scope.

## Instructions for the next AI session
1. Read `PROJECT_CONTEXT.md`.
2. Read `ARCHITECTURE.md`.
3. Read `CODING_RULES.md`.
4. Read this `PROGRESS.md`.
5. Inspect the actual source code and package configuration.
6. Compare the implementation with the roadmap.
7. Continue from the real repository state; do not assume unchecked items are complete.
8. Update this file and relevant documentation before ending the session.
