# Android APK and GitHub release

The owner chose to build on their **Windows PC**. This procedure uses the installed Android Studio and local Expo native project to create a signed, standalone APK, then attaches that binary to a GitHub Release. Run the commands yourself in **Windows PowerShell**. No installation, build or release has been performed in the authoring workspace.

An Expo account, EAS project and cloud build are not required for this route. Android Studio/Gradle may download build dependencies. Do not substitute `eas build --local` in Windows PowerShell: Expo's EAS local-build service supports macOS/Linux, not native Windows. Android Studio is the supported native Windows build path.

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

## 2. Use the working local environment and prepare Android

Keep the working `C:\projects\ApnaCircle\.env`. Both of these variables must point to the same Supabase project:

| Name | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | The URL of your working Supabase project |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The matching publishable key, starting with `sb_publishable_`, or its legacy anon key |

Use exactly one `=` between each variable name and its value, with no extra leading `=` in the value. These values are embedded in the APK and are public; never enter a service-role key, secret key or database password. Expo's SDK 57 Gradle template bundles through Expo CLI's `export:embed`, which loads local environment files in production mode. Check any existing `.env.local`, `.env.production`, `.env.production.local` or shell overrides for conflicting values. Do not share these files in chat or commit them. A changed public value requires rebuilding the APK.

Keep both existing Supabase migrations applied and the auth callback URLs allowed as described in [the backend guide](../supabase/README.md). Check permissions with the existing two-account SQL/Storage procedures in [LOCAL_VERIFICATION.md](LOCAL_VERIFICATION.md); a publishable key relies on those database policies.

The development build has already generated `android/` on the owner's PC. Synchronize it with the current Expo config before packaging:

```powershell
npx expo prebuild --platform android --no-install
git diff -- package.json app.json
```

Do not add `--clean`; it deletes and regenerates native folders. If you made manual native edits, back up `android/` outside the checkout before prebuild and review those edits afterwards. `--no-install` skips package installation; if prebuild changes the manifest, align the lockfile with `npm install` and repeat the source/compatibility checks before continuing.

Keep package `com.kailramiya.apnacircle`, scheme `apnacircle` and app version `1.0.0`. Check `versionName` and `versionCode` in the generated `android/app/build.gradle`; record the actual values. For a later release, increase `expo.android.versionCode` in `app.json`, regenerate and verify the native version. EAS's remote version counter is not used by Android Studio.

## 3. Save the exact build source

After reviewing the local changes and passing the source/compatibility checks, commit the intended package/configuration changes. Include the matching lockfile. Stage any other reviewed changes explicitly; generated `expo-env.d.ts` changes need review too. Never stage `.env`, downloaded credentials or signing keys.

For reviewed package/configuration changes:

```powershell
git add package.json package-lock.json app.json
git diff --cached --stat
git diff --cached -- package.json app.json
git commit -m "chore: lock dependencies for Android release"
git push origin main
git status --short
```

The working tree must be clean before recording the source commit. Resolve any remaining intended changes in their own focused commit; do not discard them to satisfy this condition. If no changes needed committing, skip the empty commit. Generated `android/` is ignored: a clean Git status does not capture manual native edits. Any such edits must be represented in the source/configuration before claiming that a tag reproduces the build. Signing material and local environment values remain outside Git.

Keep artifacts outside the checkout. Use a new directory/tag for each published build:

```powershell
$releaseDir = 'C:\projects\ApnaCircle-releases\v1.0.0-beta.1'
New-Item -ItemType Directory -Force -Path $releaseDir
git rev-parse HEAD | Set-Content -Encoding ascii "$releaseDir\source-commit.txt"
```

## 4. Build and sign with Android Studio

Open **Android Studio → Open** and select **`C:\projects\ApnaCircle\android`**, then let Gradle sync finish. Keep the toolchain versions that built the working development app; do not accept unrelated Android Gradle Plugin upgrades. If Android Studio cannot find Node or Java after environment changes, restart it and select the same working Gradle JDK in its settings.

Use **Build → Generate Signed Bundle / APK → APK → Next**, with module **app**. Choose **APK**, since that is the file users install from GitHub.

If you have a release keystore, select it and reuse its alias/passwords. For the first release, create its parent folder outside the project:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\ApnaCircle-signing"
```

Click **Create new** and use:

| Field | Value |
| --- | --- |
| Key store path | `C:\Users\hp\ApnaCircle-signing\apnacircle-release.jks` |
| Keystore password | A strong password you save privately |
| Key alias | `apnacircle` |
| Key password | The same password as the keystore |
| Validity | At least 25 years |
| Certificate | Your chosen certificate identity; these fields are public in the APK |

Do not overwrite an existing release key. Keep a secure backup of the keystore, alias and password outside Git; future APK updates must use the same signing identity. Never upload them as release assets or paste passwords into build commands/chat.

Continue to **Next**, select build type **release**, choose a destination under `C:\projects\ApnaCircle-releases\v1.0.0-beta.1`, then **Create/Finish**. If signature-version checkboxes appear, keep the recommended selections and include V2. Wait for a successful build, then click **Locate** in the completion notification. Copy the generated signed APK to this exact name before hashing or testing:

```text
C:\projects\ApnaCircle-releases\v1.0.0-beta.1\ApnaCircle-v1.0.0-beta.1.apk
```

The release variant bundles JavaScript and assets, so the app does not require Metro. Use the APK from this signed-build wizard: a plain `assembleRelease` or `expo run:android --variant release` is not by itself proof of release signing, since Expo's generated template initially assigns the debug key to release builds. Verify the actual certificate below. Do not reuse an old tag or replace a published APK with different bytes.

## 5. Verify and test the exact signed APK

Stop Metro, then install the signed file on your connected phone:

```powershell
$apk = "$releaseDir\ApnaCircle-v1.0.0-beta.1.apk"
adb devices
adb install -r "$apk"
```

If Android reports a signing mismatch with the development app, use a second device or remove the development installation only after saving any drafts/data you need. Uninstalling clears that installation's local data and sessions; do not automatically uninstall on every install error.

Open the app from its icon without Metro and test sign-in, session restoration, account switching, posts/photos, comments, saved items, jobs and demo applications. Request and open fresh confirmation/recovery emails on this installation; an old development-installation PKCE verifier does not transfer. Confirm English/Hindi, offline error recovery and Android back behavior. Record the device/OS, source commit, native version code, tested cases and failures; the previous development-app report is not standalone APK evidence.

Verify the APK signature with `apksigner.bat` from an installed Android SDK Build Tools version. Find its path, then substitute that path in the second command:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" -Filter apksigner.bat -Recurse
& 'C:\Users\hp\AppData\Local\Android\Sdk\build-tools\<installed-version>\apksigner.bat' verify --verbose --print-certs "$apk"
```

Verification must succeed. Record the certificate SHA-256 fingerprint and compare it with the **SHA256** fingerprint from your selected keystore (enter its password only at the interactive prompt):

```powershell
keytool -list -v -keystore "$env:USERPROFILE\ApnaCircle-signing\apnacircle-release.jks" -alias apnacircle
```

The two certificate fingerprints must match. Do not publish if the APK is signed with the generic Android debug key. Once the final APK passes testing, write its file checksum; this checksum is different from the certificate fingerprint:

```powershell
$apkHash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
"$apkHash  ApnaCircle-v1.0.0-beta.1.apk" | Set-Content -Encoding ascii "$releaseDir\SHA256SUMS.txt"
```

## 6. Attach it to a GitHub Release

The APK belongs in **Releases → Assets**, not in Git history. The repository already ignores APKs. Either supply the signed APK/download link, source commit, checksum and standalone test results for the release handoff, or publish it yourself using these steps.

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
Build method: Android Studio signed release APK, Windows
Android version code: <from the built APK / native project>
Signing certificate SHA-256: <verified fingerprint>
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

References: [Expo local release builds](https://docs.expo.dev/guides/local-app-production/), [EAS local-build platform limits](https://docs.expo.dev/build-reference/local-builds/), [Expo environment variables](https://docs.expo.dev/guides/environment-variables/), [Android Studio signing](https://developer.android.com/studio/publish/app-signing), [APK signature verification](https://developer.android.com/tools/apksigner), [GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
