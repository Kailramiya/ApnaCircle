# Local setup and verification

## Current evidence

Source review and `git diff --check` were performed before each pushed increment. **No dependency installation, TypeScript compilation, lint execution, automated tests, SQL execution, app launch, screenshots or builds were performed in the authoring workspace**, as requested. The checks below are runnable instructions, not passing results.

The owner now reports **all of `npm run check` passed** after the composer follow-up (`e4c3b28`): TypeScript, ESLint and Node tests. The full successful transcript and test count were not supplied; this is recorded as an owner-reported pass. The last supplied Expo Doctor result is **21/21**; both scoped minimatch paths resolve to **11.0.1**, and the last audit has **3 high findings**, all along Router's URI-decoder dependency chain. Database, Storage API and native device validation remain pending.

After that pass, a signup failure was traced to **401 / `UNAUTHORIZED_INVALID_API_KEY`**: the supplied gateway log showed an extra leading `=` in the key value. Local `.env` correction and database setup guidance were supplied, and the owner now reports the app is working and has been manually tested. Known Auth failures also have specific bilingual messages and a new regression test file. Capture the current `npm run check`, dependency audit and lockfile status before packaging. The manual-testing report does not replace the SQL/Storage checks, detailed acceptance record or standalone APK verification.

## 1. Install and configure

Use Node.js **22.18 or newer**. From the repository root:

```bash
npm install
cp .env.example .env
npx expo install --check
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Fill both public variables in `.env`; do not paste a service-role or secret key. The legacy anon key is also accepted in `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Restart Metro whenever changing public environment values. Expo inlines these values into builds.

The first successful install creates `package-lock.json`. After resolving any compatibility errors and passing the checks, commit that lockfile. Native dependency versions were selected from Expo's SDK 57 module map; local installation must still establish that the full dependency tree resolves successfully. Do not blindly upgrade to the newest SDK or bypass peer errors with `--force`.

### Recovering from the first Windows install failure

The owner's first `npm install` failed with `ERESOLVE`: npm selected `react-dom@19.3.1` against the app's `react@19.2.3`, and warned about `react-native-worklets@0.13.1` outside Expo Modules Core's supported range. The manifest now explicitly declares Router's renderer and animation/gesture peers using the [SDK 57 version map](https://github.com/expo/expo/blob/sdk-57/packages/expo/bundledNativeModules.json): React DOM `19.2.3`, Reanimated `4.5.1`, Worklets `0.10.1`, Gesture Handler `~2.32.0`, and React Native Web `~0.21.0`. These pins address that reported conflict; the latest owner results are recorded above.

For this failed first installation, pull the fix and remove only the generated install artifacts before retrying. Run each command separately in **PowerShell** from the repository root; stop if a command fails. If pulling reports local source changes, preserve them and resolve that conflict before proceeding.

```powershell
git pull --ff-only
if (Test-Path -LiteralPath node_modules) { Remove-Item -LiteralPath node_modules -Recurse -Force }
if (Test-Path -LiteralPath package-lock.json) { Remove-Item -LiteralPath package-lock.json -Force }
npm install
npm ls react react-dom react-native-reanimated react-native-worklets react-native-gesture-handler react-native-web
npx expo install --check
```

The cleanup above is for the initial failed install with no validated lockfile. Keep and commit the lockfile after a successful verified installation; subsequent clean checkouts should use `npm ci`. Do not add `--legacy-peer-deps` or `--force` to suppress this conflict. `npm ls` must exit successfully without invalid peers, and Expo's compatibility check must pass before continuing.

### Resolving the subsequent Expo Font warning

The owner's next Expo Doctor run passed 19/21 checks. It reported that `expo-symbols` requires `expo-font` as a direct dependency, and found both `expo-font@58.0.12` and `expo-font@57.0.4` in the installed tree. The manifest now declares `expo-font: ~57.0.4`, matching SDK 57. Update the existing install and lockfile with the following commands, one at a time; no lockfile deletion is needed for this correction:

```powershell
git pull --ff-only
npm install
npm ls expo-font --all
npx expo install --check
npx expo-doctor
npm run check
```

Expect an SDK 57 font version with other references deduped to it, and no missing peer or duplicate native module checks failing. If either check still fails, preserve the `npm ls expo-font --all` and Doctor output for diagnosis. The owner subsequently reported a 21/21 Doctor pass; see the current evidence above for remaining checks. If the previous npm cache `ENOENT` recurs, use the fresh cache configured for the current PowerShell session rather than bypassing peer dependency checks.

Follow [`supabase/README.md`](../supabase/README.md) to create a dedicated development backend, apply both migrations in order and optionally load the demo seed. Set Auth's minimum password length to 8. Add `apnacircle://auth/callback` and `apnacircle://auth/callback?mode=recovery` to the redirect allowlist. Use your project's standard Supabase confirmation/recovery link templates. PKCE confirmation/recovery links must return to the device/app installation that requested them, where the verifier is stored.

## 2. Source and logic checks

```bash
npm run check
npx expo-doctor
```

`npm run check` runs TypeScript, Expo ESLint, then Node's built-in test runner. The tests cover session chunking/failed storage, account epochs, native-crypto bridging, timestamp precision, row deduplication, publish retries, lost responses, desired-state likes, bilingual key/interpolation parity and validation boundaries. They do not render React Native components, simulate a device or establish backend permissions.

Type-generated routes may require an initial `npm start` so Expo can create `.expo/types`. If a check fails, fix the cause and record the failure and fix before continuing. Only owner-provided results are recorded as passes.

### Pulling the composer and TypeScript correction

Expo's compatibility repair changed the owner's local `package.json`. Use Git's autostash option to preserve tracked local edits while pulling the matching repository change. Run each command separately; if Git reports a merge or stash-application conflict, resolve it before continuing. Keep the generated lockfile.

```powershell
git pull --ff-only --autostash
npm install
npm run check
```

The corrected category ternary must parse in both locked and editable states. A source fix is not evidence of a passing typecheck; retain the new output. On-device category/locality selection, locked retry state, keyboard layout and accessibility remain part of the device checklist.

TypeScript 6 defaults `compilerOptions.types` to an empty array. The shared config explicitly includes `node` for `node:test`, `node:crypto`, `Buffer`, and assertion narrowing. Do not remove tests from the typecheck or add non-null assertions to suppress these errors. See the [TypeScript 6 release note](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html#types-now-defaults-to-).

Also run `npm audit` and retain the full report to identify affected packages, dependency paths and compatible fixes. Do not run `npm audit fix --force` blindly: it can move dependencies outside their supported ranges, including major-version changes. The 21/21 Doctor result does not resolve these audit findings.

### Pulling the React hooks correction

The latest fixes change source only. Keep the existing installation and lockfile, and run these commands separately in PowerShell. Stop if Git reports a merge or stash-application conflict.

```powershell
git pull --ff-only --autostash
npm run check
```

The existing ESLint rules are the direct regression checks for the reported synchronous effect updates, render-time ref reads, and incompatible form subscriptions. No lint suppression was added. TypeScript checks the typed `useWatch` subscriptions, and the existing Node tests check publish reconciliation and account epochs. These do not exercise native screen interactions.

The follow-up composer correction invokes `handleSubmit(submit)()` inside `onPress`, so the ref-reading callback is passed to the library only after a press. The returned handler is invoked, not merely created; React Hook Form still validates the form and tracks `isSubmitting` while the async submission settles. Confirm locally that Publish and Retry both submit and display loading, invalid text is rejected, and an interrupted publish reuses its original UUID/text/photo snapshot.

When running the development build locally, check these affected paths:

- Open a callback without a code: show the invalid-link message immediately. An expired code must also show an error; a valid recovery link must open password reset after exchange.
- Retry a session-loading error: show loading while the session request is retried, then the appropriate destination or error.
- Change profile language/locality and composer description/category/locality: selections and character count must update immediately, and clearing the draft must reset subscribed fields.
- Send a comment with rapid repeated taps and an interrupted response: keep the same text/UUID, disable editing while the outcome is uncertain, show Retry after failure, and create exactly one reply after reconciliation. Successful submission must clear and unlock the editor. Switching accounts must still reject late results.

### Audit remediation status

The owner's full report identifies these dependency paths:

| Path | Evidence and action | Local validation status |
|---|---|---|
| `@expo/fingerprint` / `@typescript-eslint/typescript-estree` → `minimatch` | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) is patched in 11.0.1. Scoped overrides target these two consumers. Their used APIs and the patched Node engine range were reviewed. | Owner confirms both paths resolve to 11.0.1 and minimatch findings are absent from the new audit; compatibility tests are included in the subsequently reported full check pass |
| `expo-router` → `query-string@7` → `decode-uri-component` | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) require 0.5.1, whose ESM default export does not match query-string 7's callable CommonJS dependency. A modern query-string override also changes the namespace API used by SDK 57 Router. | Unresolved; requires a compatible upstream fix or a separately validated Router/SDK migration before release |

These findings concern denial of service. The original report counted 13 affected packages; the latest report counts 3 high findings along the same decoder chain, including its parent packages. The root application does not directly import either package, but that does not prove the transitive runtime/tooling paths are unreachable. Keep the high-severity decoder finding open.

After pulling the fixes, run each command separately and retain failures:

```powershell
git pull --ff-only --autostash
npm install
npm run check
npm ls minimatch decode-uri-component --all
npx expo-doctor
npm audit
```

The compatibility test resolves dependencies through the actual consuming packages rather than assuming npm hoists them to the root. It checks fingerprint ignores, negation, dotfiles and parent paths, plus ESLint's matching API. This verifies selected integration behavior, not a complete performance/security proof. The new install must generate an updated lockfile; keep it. `npm audit` is expected to continue reporting the unresolved decoder path until a compatible remediation is implemented. Remove the minimatch overrides when both upstream consumers accept a patched release and the compatibility tests and audit confirm that no vulnerable copy remains. Do not use npm's suggested Expo 52 downgrade or Router 58 upgrade in isolation.

## 3. Database checks

Run [`supabase/tests/rls.sql`](../supabase/tests/rls.sql) in a **dedicated development project** as its database owner, after applying the migrations. It creates two temporary auth users and fixtures inside a transaction, switches to the authenticated/anonymous roles, asserts ownership and private-data rules, and rolls everything back. It also exercises duplicate likes/saves/applications, trusted notifications and equal-timestamp pagination.

Use the Supabase SQL editor or an already configured local `psql` client:

```bash
psql "$APNACIRCLE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
```

Keep that privileged database URL in your local environment, never in Expo variables or Git. On any assertion failure, stop; the test is not a pass. If your SQL editor retains the failed transaction, issue `ROLLBACK`.

Test storage through its API, following [Supabase's storage-schema guidance](https://supabase.com/docs/guides/storage/schema/design). Create two development accounts and finish onboarding. In a local, ignored `.env.test.local` file set `APNACIRCLE_TEST_A_EMAIL`, `APNACIRCLE_TEST_A_PASSWORD`, `APNACIRCLE_TEST_B_EMAIL`, `APNACIRCLE_TEST_B_PASSWORD` and `APNACIRCLE_TEST_JPEG` (an absolute path to a non-sensitive JPEG smaller than 10 MB). Then run:

```bash
npm run test:storage
```

This opt-in check creates a uniquely named temporary post/photo, checks foreign-path rejection, immutability and referenced-image protection, then cleans up through the Storage API. It never runs as part of `npm test`. If cleanup fails, it reports the exact generated paths for review. Use only a disposable development project; bucket MIME/size validation and visible image rendering also need device checks.

## 4. Launch on Android

For the custom auth scheme and native permissions, use a development build with Android Studio/SDK and a device or emulator configured locally:

```bash
npm run android:build
```

This generates the native project, builds and installs it, and starts Metro. On later sessions with that development build already installed:

```bash
npm run dev
```

On a Mac with Xcode, `npm run ios:build` provides the equivalent iOS development build. Expo Go can help with a basic SDK-compatible smoke check, but it does not establish that this app's custom-scheme email callbacks work. No web build is currently targeted; Playwright browser tests would not validate these native flows.

## 5. Device acceptance checklist

Create two accounts, A and B, through the app. Keep screenshots and observations in a local evidence folder. Check each row in English and Hindi where it affects user-visible copy.

| Flow | Required observation | Result |
|---|---|---|
| Register/confirm/sign in | Validation works; email confirmation returns to the requesting installation; duplicate/invalid login shows a useful error | Pending |
| Password recovery | Email opens native callback; a new password works; expired/reused links fail clearly | Pending |
| Onboarding | Name, unique username, Jaipur locality and language persist; a failed insert retains input | Pending |
| Session lifecycle | Restart and 10+ minutes in background preserve/refresh a valid session; expiry returns to auth | Pending |
| Account isolation | Start slow queries/mutations as A, sign out, sign in as B; A's drafts, private saves, likes and applications never appear in B's UI | Pending |
| Feed | 360 demo posts load by pages; ties do not skip/duplicate rows; search and filters never mix result sets | Pending |
| Refresh/offline | Loaded rows stay visible on refresh failure; failed next page offers retry; initial offline state is clear | Pending |
| Composer | Empty/oversized content rejected; text/category/locality survive failure; tab switches retain the active draft | Pending |
| Native photo picker | Cancel/deny/limited access preserve text; unsupported/oversized photos fail clearly; JPEG renders after restart | Pending |
| Publish recovery | Interrupt upload/insert responses, retry the same draft and verify one row/one referenced path; never delete a possibly published image | Pending |
| Navigation | Android back and discard choices work; keyboard does not cover inputs; successful publish opens details; deep links/back work | Pending |
| Likes and saves | Repeated taps/retries keep one DB row; offline failure rolls back the affected field; another post's optimistic update survives | Pending |
| Comments | Failed reply retains text and ID; retry creates one reply; only its author can delete it | Pending |
| Saved lists | Posts/jobs show only the current user's records; unsave persists; saved-date ordering/cursors are stable | Pending |
| Jobs/applications | Search/filter/save work; repeated applications produce one `submitted` row; history survives restart and states that it is a demo | Pending |
| Profiles/preferences | Name/bio/avatar and language/locality save; duplicate usernames fail clearly; changed avatars do not overwrite old object bytes | Pending |
| Activity | B likes/comments on A's post; A sees events, B cannot read them; self-actions are excluded; repeated like/unlike does not spam A | Pending |
| Accessibility | TalkBack/VoiceOver labels and selected/disabled states are announced; touch targets remain usable; text is not clipped at largest system scale | Pending |
| Responsive layout | Small phone, landscape and tablet widths keep readable content and usable controls; Hindi labels wrap | Pending |

Compare screenshots at the same device size, orientation, language and text scale. Include login, feed, composer with keyboard, saved, jobs/detail, profile and activity. No screenshot comparison has been performed yet.

## 6. APK and performance evidence

The owner chose **local Windows packaging**. Follow [ANDROID_RELEASE.md](ANDROID_RELEASE.md) to synchronize the native project, use the working local Supabase environment, and build with Android Studio's **Generate Signed Bundle / APK** wizard. Verify that the APK's signing certificate matches the private release keystore, then test with Metro stopped. The template's release variant can otherwise retain debug signing. EAS cloud configuration remains optional; EAS `--local` is not a native Windows build route.

No signed standalone APK or GitHub release has been verified yet. Screenshots, demo video, store icon/splash assets and signing/distribution evidence remain pending; none are supplied as fabricated artifacts.

On a physical Android device, use the preview/release build and the 360-post seed. Record device model, OS, build hash, dataset size, initial load, a long scroll, image loading, keyboard behavior and any measured frame/memory problems. A development build's apparent speed is not release-performance evidence. Record iOS independently rather than inferring it from Android.

## Evidence record

| Item | Actual result |
|---|---|
| Commit tested | Owner reports all checks passed after the e4c3b28 handoff; exact local revision/diff and successful transcript not supplied |
| Node/npm and lockfile | Owner installation completed; generated lockfile not yet committed |
| Expo Doctor | Owner again reported 21/21 passing with the scoped minimatch overrides installed |
| TypeScript | Owner reported pass before the Auth error-message patch; new rerun pending |
| ESLint | Owner reported pass before the Auth error-message patch; new rerun pending |
| Node tests | Previous suite owner-reported pass, including dependency compatibility; new auth error checks pending |
| npm audit | Owner report reduced from 13 findings to 3 high findings in Router's decoder chain; both minimatch overrides resolve to 11.0.1 |
| Migrations / SQL regression checks | Execution not confirmed |
| Android model / OS / build | Owner reports app working and manually tested; device/build details, case-by-case evidence and standalone APK verification pending |
| Account creation | Gateway invalid-key error with an extra leading equals sign identified; owner subsequently reports app working |
| iOS model / OS / build | Not tested |
| English/Hindi screenshots | Not captured |
| Accessibility review | Not performed on device |
| Release scrolling observations | Not recorded |
| Installable APK / demo link | Not created |
