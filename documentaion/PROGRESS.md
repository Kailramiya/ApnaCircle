# ApnaCircle — Progress and session memory

## Current status

The MVP source is authored and pushed to `Kailramiya/ApnaCircle` in real feature increments. The owner now reports the app is working and has been manually tested. The repository contains an Expo SDK 57 app, Supabase migrations/seed, regression checks and local build instructions. A standalone release build and the remaining verification evidence are still pending.

The owner explicitly requested that dependencies, application code and tests not be installed or run in the authoring workspace. Each increment received source review and Git whitespace checks. Do not turn the pending checks below into passes without actual output/device evidence.

## Source authored

| Area | Source coverage | Execution status |
|---|---|---|
| Foundation | Strict TypeScript, SDK-compatible manifest, native tabs/stacks, theme, reusable controls | Owner reports app working; previous full check pass and Doctor 21/21; standalone build pending |
| Backend | Nine tables, constraints, column grants, RLS, immutable public media, read-model RPCs | Migration execution not confirmed |
| Authentication | Registration/login, PKCE callback/recovery, SecureStore sessions, lifecycle refresh | Invalid API-key cause identified; owner now reports app working; per-flow results not recorded |
| Onboarding/profile | Name/username/bio, avatars, Jaipur locality and English/Hindi preferences | Device checks pending |
| Community | Feed, search, filters, composite-cursor pagination, refresh, post details | Backend/device checks pending |
| Composer | Text/photo validation, stable submission UUID, retry reconciliation, retained drafts | Failure/device checks pending |
| Social/saved | Desired-state likes/saves, scoped optimistic rollback, comments, owner deletion | Two-user/runtime checks pending |
| Jobs | Listings/detail, filters, private saves, unique applications and history | Two-user/runtime checks pending |
| Activity | Trusted like/comment triggers, recipient-only feed, unread count and mark-read | Backend/device checks pending |
| Localization/UI | English/Hindi messages, locale formatting, scalable text and control labels | Screenshots/accessibility pending |
| Tests | Node logic checks, transactional RLS/cursor checks, opt-in Storage API integration check | Previous Node suite owner-reported pass; new auth error checks and SQL/Storage checks pending |
| Release | Local development-client scripts, EAS profiles and Windows APK/GitHub release guide | Awaiting owner build, standalone validation and artifact; nothing published |

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
- After the composer syntax correction, the owner's next typecheck reported 20 errors in seven test files: Node built-in modules/Buffer were not loaded, and the missing assertion types prevented PKCE narrowing. TypeScript 6 defaults `compilerOptions.types` to `[]`; the shared config now explicitly includes the already-installed `@types/node`. The latest owner run confirms **TypeScript passes**.
- That run reached ESLint and stopped with **5 errors and 2 warnings**: synchronous effect state updates in auth, render-time comment ref reads, and React Hook Form `watch()` compiler warnings. Source corrections derive invalid callbacks directly, reset readiness in the retry handler, render comment lock state from React state, and subscribe with `useWatch` in both forms. The full check rerun remains pending; Node tests have not been reached.
- After pulling `3f53bb8` with local edits successfully autostashed/restored, the owner again passed TypeScript. ESLint now reports **1 error and 0 warnings**: the composer's render-time `handleSubmit` call receives a callback that reads refs. That call now runs inside the button's press handler, retaining validation, submission tracking and the stable retry snapshot. The next full check remains pending; Node tests are still not reached.
- The latest owner dependency tree confirms `minimatch@11.0.1` under both fingerprint and TypeScript ESLint. The new audit has **3 high findings**, down from 13 (10 moderate, 3 high); no minimatch finding remains. The URI decoder remains unresolved through `expo-router` → `query-string` → `decode-uri-component`: its patched release is ESM-only and is not a callable CommonJS replacement for `query-string@7`. Do not infer security status from the repeated Doctor **21/21** pass.
- After the composer follow-up (`e4c3b28`), the owner reports **all checks passed**, confirming TypeScript, ESLint and the Node test command, including dependency compatibility checks. This is an owner-reported result; the full successful transcript, test count and exact local working-tree revision were not supplied. SQL, Storage API and native build/device results remain pending.
- The owner subsequently reported a Windows `JAVA_HOME` build error, then an in-app missing-Supabase-configuration screen and a failed signup. Local environment/database setup guidance was supplied. The signup screen discarded all server errors; a shared Auth code mapper now supplies specific bilingual messages for known failures across signup, sign-in and password reset. Added runnable regression checks. The real server error, successful signup, and post-change check results remain pending; default SMTP restrictions are only a possibility until logs confirm them.
- The supplied signup event subsequently established a gateway **401 / `UNAUTHORIZED_INVALID_API_KEY`**, with an extra leading `=` in the public-key value. Guided the owner to correct `.env` and reload; also supplied migration/table verification steps when no tables were visible. The owner now reports the app is working and has been tested throughout. This is a manual-testing report, not new npm/SQL/Storage test output, a measured performance result or standalone APK evidence. The previously suggested SMTP restriction was not the cause shown in that event.
- Confirmed the current jobs scope: authenticated users browse/save jobs and submit demo applications; trusted administration supplies listings. User job posting and employer workflows are not implemented, and no expansion has been authorized yet.

## Pending owner-run validation

- [x] Owner installed dependencies and obtained an Expo Doctor 21/21 pass.
- [ ] Validate and commit the owner's generated `package-lock.json`.
- [x] Pass TypeScript after the Node type configuration correction.
- [x] Rerun the full TypeScript, ESLint and Node checks after the React hooks corrections (owner reports all passed).
- [x] Verify both scoped minimatch updates locally and capture the reduced audit report.
- [x] Execute the minimatch consumer compatibility checks included in `npm test` (covered by the reported full check pass).
- [x] Reach a working app and perform manual testing (owner report; individual cases not supplied).
- [ ] Capture the current full source-check result after the Auth error-message patch.
- [ ] Resolve the remaining URI-decoder advisory through a compatible upstream fix or a separately validated Router/SDK migration before release.
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

Use [`LOCAL_VERIFICATION.md`](LOCAL_VERIFICATION.md) for commands, acceptance cases and the evidence record. [`ANDROID_RELEASE.md`](ANDROID_RELEASE.md) covers the signed preview APK, exact source commit, checksum and GitHub Release handoff. The latest supplied audit still has 3 high findings; the owner's modified `.gitignore`, `expo-env.d.ts`, `package.json` and untracked lockfile require review before packaging.

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
