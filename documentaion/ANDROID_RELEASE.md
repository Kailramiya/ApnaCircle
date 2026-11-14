# Android APK and GitHub release

This procedure builds a signed, standalone APK using the existing EAS `preview` profile, then attaches that exact binary to a GitHub Release. Run the commands yourself in **Windows PowerShell**. No installation, build or release has been performed in the authoring workspace. Cloud builds consume your Expo plan's build allowance; check its current limits before starting.

## Audit status before packaging

The owner's latest report contains **3 high findings on one dependency chain**: `expo-router` → `query-string` → `decode-uri-component`. There are two decoder advisories, not three independent defects. Malformed encoded input can cause excessive CPU use. The [second advisory](https://github.com/advisories/GHSA-qr28-fpjm-wq7f) requires decoder **0.5.1**; **0.5.0 is still affected**.

As of this review, npm's `sdk-57` Router tag is **57.0.31** and `latest` is **58.0.31**. SDK 57's [Router manifest](https://github.com/expo/expo/blob/sdk-57/packages/expo-router/package.json) still depends on `query-string@^7.1.3`. That consumer requires a callable CommonJS decoder; the patched decoder exposes an ESM default export. A direct override is not a verified fix. A modern query-string override also changes the export shape used by this Router version.

**Do not run `npm audit fix --force`:** the supplied suggestion upgrades Router to SDK 58 without migrating the rest of the SDK. No dependency change or audit suppression is part of this release preparation. A compatible upstream backport or a coordinated SDK migration with routing/auth-link tests is still needed. Recommend resolving this before public distribution. An internal APK can be built for testing meanwhile; marking a release as a beta does not fix the vulnerability. If publishing a preview with it unresolved, retain the disclosure in the release notes below.

## 1. Preserve the local installation and review changes

Run commands separately and stop on unexpected failures or Git conflicts:

```powershell
cd C:\projects\ApnaCircle
git diff -- package.json .gitignore expo-env.d.ts
git pull --ff-only --autostash
git status --short
```

The supplied status shows three modified tracked files and an untracked `package-lock.json`. Keep that lockfile. Review the diffs before staging; do not reset those files, delete the lockfile or use `git add .`. Autostash preserves tracked edits during the pull but is not a backup of untracked files.

With the intended manifest and existing installation aligned, capture current results:

```powershell
npx expo install --check
npx expo-doctor
npm run check
npm ls expo-router query-string decode-uri-component --all
npm audit
```

The source checks and Doctor must pass. Audit currently reports the unresolved decoder findings and exits nonzero; retain that report rather than disguising the result. If the manifest changes during remediation, run `npm install` to update the existing lockfile and rerun the checks. After the lockfile is committed, fresh checkouts use `npm ci`.

## 2. Link Expo and configure the preview environment

Use an Expo account you control. These commands run EAS CLI on your PC; the later build runs on Expo's servers:

```powershell
npx eas-cli@23.2.0 login
npx eas-cli@23.2.0 init
```

Link the existing ApnaCircle project if already created; otherwise create it in your account. Review the resulting `app.json` change, including `extra.eas.projectId`. Keep Android package `com.kailramiya.apnacircle` and scheme `apnacircle`. The existing `eas.json` already has the APK profile; it does not need to be replaced.

In that Expo project's **Project settings → Environment variables**, add these project variables to **preview**, with **Plain text** visibility:

| Name | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | The URL of your working Supabase project |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The matching publishable key, starting with `sb_publishable_`, or its legacy anon key |

Paste only the value, without a leading `=` or surrounding quotes. These values are embedded in the APK and are public; never enter a service-role key, secret key or database password. `.env` is ignored by Git and EAS's default upload rules, so a working local `.env` does not configure the cloud build. A changed public value requires a new APK for this project.

Keep both existing Supabase migrations applied and the auth callback URLs allowed as described in [the backend guide](../supabase/README.md). Check permissions with the existing two-account SQL/Storage procedures in [LOCAL_VERIFICATION.md](LOCAL_VERIFICATION.md); a publishable key relies on those database policies.

## 3. Save the exact build source

After reviewing the local changes and passing the source/compatibility checks, commit the intended package/configuration changes. Include the matching lockfile. Stage any other reviewed changes explicitly; generated `expo-env.d.ts` changes need review too. Never stage `.env`, downloaded credentials or signing keys.

For the reviewed package and Expo-link changes:

```powershell
git add package.json package-lock.json app.json
git diff --cached --stat
git diff --cached -- package.json app.json
git commit -m "chore: lock dependencies and link Expo release project"
git push origin main
git status --short
```

The working tree must be clean before recording the source commit. Resolve any remaining intended changes in their own focused commit; do not discard them to satisfy this condition. If no changes needed committing, skip the empty commit.

Keep artifacts outside the checkout. Use a new directory/tag for each published build:

```powershell
$releaseDir = 'C:\projects\ApnaCircle-releases\v1.0.0-beta.1'
New-Item -ItemType Directory -Force -Path $releaseDir
git rev-parse HEAD | Set-Content -Encoding ascii "$releaseDir\source-commit.txt"
```

## 4. Build the signed standalone APK

```powershell
npx eas-cli@23.2.0 build --platform android --profile preview
```

Use **preview**, which produces an APK with bundled JavaScript. The development profile requires the development workflow; the production profile produces a Play Store AAB.

For the first release, let EAS generate an Android keystore when prompted. If a release signing key already exists, reuse it. Keep a secure backup of the keystore and its passwords outside Git; future APK updates must use the same signing identity. EAS credentials can be managed with `npx eas-cli@23.2.0 credentials --platform android`. Downloaded credential files, including `credentials.json`, contain secrets and must not be committed or uploaded as release assets.

Record the build URL/ID, source commit and Android version code from the build details. Confirm the source commit matches `source-commit.txt`. Wait for **Finished**, then download its APK and save it as:

```text
C:\projects\ApnaCircle-releases\v1.0.0-beta.1\ApnaCircle-v1.0.0-beta.1.apk
```

For subsequent releases, use a higher Android version code. The project uses remote version management; use EAS version management or enable `autoIncrement` for preview before the next build. Do not reuse an old tag or replace a published APK with different bytes.

## 5. Test the exact downloaded APK

Stop Metro, then install the downloaded file on your connected phone:

```powershell
$apk = "$releaseDir\ApnaCircle-v1.0.0-beta.1.apk"
adb devices
adb install -r "$apk"
```

If Android reports a signing mismatch with the development app, use a second device or remove the development installation only after saving any drafts/data you need. Uninstalling clears that installation's local data and sessions; do not automatically uninstall on every install error.

Open the app from its icon without Metro and test sign-in, session restoration, account switching, posts/photos, comments, saved items, jobs and demo applications. Request and open fresh confirmation/recovery emails on this installation; an old development-installation PKCE verifier does not transfer. Confirm English/Hindi, offline error recovery and Android back behavior. Record the device/OS, build ID, tested cases and failures; the previous development-app report is not standalone APK evidence.

Verify the APK signature with `apksigner.bat` from an installed Android SDK Build Tools version. Find its path, then substitute that path in the second command:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" -Filter apksigner.bat -Recurse
& 'C:\Users\hp\AppData\Local\Android\Sdk\build-tools\<installed-version>\apksigner.bat' verify --verbose --print-certs "$apk"
```

Verification must succeed. Record the certificate SHA-256 fingerprint and confirm the signing identity is the intended release key, not the generic Android debug certificate. Once the final APK passes testing, write its checksum:

```powershell
$apkHash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
"$apkHash  ApnaCircle-v1.0.0-beta.1.apk" | Set-Content -Encoding ascii "$releaseDir\SHA256SUMS.txt"
```

## 6. Attach it to a GitHub Release

The APK belongs in **Releases → Assets**, not in Git history. The repository already ignores APKs. Either supply the build URL, source commit and standalone test results for the release handoff, or publish it yourself using these steps.

After reviewing the audit status and APK results, tag the recorded build source, not an unrelated newer `main`:

```powershell
$sourceCommit = (Get-Content -Raw "$releaseDir\source-commit.txt").Trim()
git tag -a v1.0.0-beta.1 $sourceCommit -m "ApnaCircle Android beta 1"
git push origin v1.0.0-beta.1
```

Open [the new release form](https://github.com/Kailramiya/ApnaCircle/releases/new). Choose the existing `v1.0.0-beta.1` tag, title it **ApnaCircle 1.0.0 Beta 1 — Android**, and mark it **Pre-release**. Attach the APK, `SHA256SUMS.txt` and `source-commit.txt`. Fill in the notes below with actual results, then publish. Do not publish placeholders or claim that pending checks passed.

Suggested notes:

```text
ApnaCircle Android portfolio preview

Includes community posts/photos, comments, saved items, local job browsing,
demo applications, and English/Hindi interfaces. APK runs without Expo Go
or a Metro development server; network features require internet access.

Source commit: <exact build commit>
EAS build: <build URL / ID>
Android version code: <from build details>
Tested on: <device and Android version>
Checks completed: <actual source and standalone-device results>
SHA-256: <from SHA256SUMS.txt>

Limitations: job listings are administered, and applications are demo records
that are not delivered to employers. Uploaded image buckets are public.
iOS has not been validated.

Known dependency issue: the supplied audit reports 3 high findings through
expo-router -> query-string -> decode-uri-component. GHSA-vcc3-ghjq-m6fr
and GHSA-qr28-fpjm-wq7f remain unresolved in this SDK 57 dependency tree.
This preview is not a security-cleared production release.
```

Update the dependency paragraph only after a tested remediation and fresh audit evidence. After publishing, download the release asset again and verify its SHA-256 matches the tested APK. Record the release URL in the project README and verification record only once it exists.

References: [Expo APK builds](https://docs.expo.dev/build-reference/apk/), [EAS environment variables](https://docs.expo.dev/eas/environment-variables/manage/), [Android signing](https://docs.expo.dev/app-signing/app-credentials/), [APK signature verification](https://developer.android.com/tools/apksigner), [EAS version management](https://docs.expo.dev/build-reference/app-versions/), [GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
