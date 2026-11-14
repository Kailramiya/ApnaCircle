# ApnaCircle — Progress and session memory

## Current status

The MVP source is authored and pushed to `Kailramiya/ApnaCircle` in real feature increments. The repository now contains an Expo SDK 57 app, Supabase migrations/seed, regression checks and local build instructions. This is **not a runtime-verified release**.

The owner explicitly requested that dependencies, application code and tests not be installed or run in the authoring workspace. Each increment received source review and Git whitespace checks. Do not turn the pending checks below into passes without actual output/device evidence.

## Source authored

| Area | Source coverage | Execution status |
|---|---|---|
| Foundation | Strict TypeScript, SDK-compatible manifest, native tabs/stacks, theme, reusable controls | Owner install completed; Doctor 21/21; typecheck failed, correction awaiting rerun |
| Backend | Nine tables, constraints, column grants, RLS, immutable public media, read-model RPCs | Migrations not executed |
| Authentication | Registration/login, PKCE callback/recovery, SecureStore sessions, lifecycle refresh | Native/email checks pending |
| Onboarding/profile | Name/username/bio, avatars, Jaipur locality and English/Hindi preferences | Device checks pending |
| Community | Feed, search, filters, composite-cursor pagination, refresh, post details | Backend/device checks pending |
| Composer | Text/photo validation, stable submission UUID, retry reconciliation, retained drafts | Failure/device checks pending |
| Social/saved | Desired-state likes/saves, scoped optimistic rollback, comments, owner deletion | Two-user/runtime checks pending |
| Jobs | Listings/detail, filters, private saves, unique applications and history | Two-user/runtime checks pending |
| Activity | Trusted like/comment triggers, recipient-only feed, unread count and mark-read | Backend/device checks pending |
| Localization/UI | English/Hindi messages, locale formatting, scalable text and control labels | Screenshots/accessibility pending |
| Tests | Node logic checks, transactional RLS/cursor checks, opt-in Storage API integration check | Authored, not run |
| Release | Local development-client scripts and EAS development/preview/production profiles | No build or store submission |

## Verified in this workspace

- [x] Existing product documents read and revised.
- [x] Dependency versions/source APIs inspected against upstream SDK/package metadata.
- [x] Feature source and security/failure paths reviewed.
- [x] Git whitespace checks completed for delivered increments.
- [x] Feature commits pushed with `Kailramiya <amankundu369@gmail.com>` and actual commit dates.

These checks are evidence of source delivery, not evidence of a working native build.

## Owner-reported local results

- Windows: Java/Javac versions verified by the owner; ADB `37.0.0` reports the connected Android phone as `device` (authorized).
- First `npm install`: **failed** with React DOM/React `ERESOLVE` and an incompatible Worklets peer warning.
- Follow-up manifest correction explicitly declares the SDK 57 renderer, gesture and animation peer versions. A later install attempt hit a local npm cache `ENOENT`; fresh-cache retry instructions were supplied.
- Initial Expo Doctor result: **19/21 checks passed**, with a missing direct `expo-font` peer and SDK 57/58 font duplicates. The manifest now explicitly declares `expo-font: ~57.0.4`.
- Latest owner-run compatibility check updated TypeScript to `~6.0.3` and completed installation. Expo Doctor then reported **21/21 checks passed**. The repository now records the same TypeScript range, matching Expo's SDK 57 template.
- `npm run check` stopped at TypeScript with TS2657/TS1005 in `src/screens/composer.tsx`: the category conditional lacked its closing `}`. The source is corrected; typecheck rerun, lint and Node tests remain pending.
- npm reported **13 vulnerabilities (10 moderate, 3 high)**. Advisory/package details have not been supplied; audit triage and any necessary compatible fixes are pending. Do not infer security status from the Doctor pass.

## Pending owner-run validation

- [x] Owner installed dependencies and obtained an Expo Doctor 21/21 pass.
- [ ] Validate and commit the owner's generated `package-lock.json`.
- [ ] Pass TypeScript, ESLint and Node regression checks after the composer correction.
- [ ] Review the owner's full `npm audit` report and resolve or document affected dependency paths before release.
- [ ] Apply migrations and demo seed in a dedicated Supabase development project.
- [ ] Pass SQL RLS/duplicate-write/equal-timestamp checks and Storage API integration checks.
- [ ] Test confirmation/reset links on the requesting app installation.
- [ ] Test session restoration, background refresh and account isolation during slow requests.
- [ ] Test picker permission/cancellation, keyboard, Android back and draft preservation.
- [ ] Test post/image/comment/application retry behavior against the live backend.
- [ ] Compare English/Hindi screenshots at small/large widths and large system text.
- [ ] Test TalkBack and VoiceOver independently.
- [ ] Record release scrolling on physical Android with 360 seeded posts.
- [ ] Produce an installable APK, app icon/splash assets and a short honest demo.
- [ ] Record iOS validation separately; it is currently unverified.

Use [`LOCAL_VERIFICATION.md`](LOCAL_VERIFICATION.md) for commands, acceptance cases and the evidence record.

## Decisions and limits

- SDK 57 / React Native 0.86.3; new-project routes use `src/app`.
- Jaipur demo: Mansarovar, Vaishali Nagar and Malviya Nagar; seed includes 6 fictional authors, 360 posts and 24 jobs.
- React Native styles/system fonts keep native text scaling and Hindi support without an extra styling/font dependency.
- TanStack Query owns remote data. Zustand persists only the device language preference.
- Sessions use chunked SecureStore entries; native randomness and SHA-256 bridge the PKCE calls required by Supabase.
- Every personalized cache key includes the account ID; account epochs reject late work.
- Posts freeze their UUID/text/photo on submission. Uncertain outcomes retain media; reviewed maintenance handles abandoned uploads.
- Image buckets are intentionally public. Never treat an image URL as private.
- Job applications are demo records; no employer receives them. Status remains `submitted`.
- Activity source exists but is not validated as stable. Push, replies, employer workflows, durable offline queues and automated media cleanup remain outside the MVP.
- Store signing, real Supabase/Expo configuration, generated native folders and build artifacts are not committed.

## Environment variables

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable or legacy anon key)

Never use a service-role/secret key in the mobile app. Test-account passwords belong only in the ignored `.env.test.local` file for the explicit Storage integration check.

## Next session

Continue from the current source and Git history. Do not scaffold another app or rewrite the product plan. If the owner supplies local errors, reproduce/trace the relevant path, fix it in a focused commit and update the evidence record. The owner's no-install/no-execution constraint remains in force until changed.
