# ApnaCircle

**Your neighbourhood. Your people.**

An Android-first community and local-jobs portfolio app for Jaipur, with English and Hindi interfaces. Built with Expo SDK 57, React Native, TypeScript and Supabase.

**Status:** MVP source is authored and pushed feature by feature. At the owner's request, no dependencies, application code, tests, SQL or builds were run in the authoring workspace. Source review and Git whitespace checks are complete; runtime verification is pending. No APK, screenshots, passing test badge or demo video is claimed.

## Feature source

- Email registration/login, confirmation, password recovery and encrypted session persistence.
- Profile onboarding, avatar editing and language/neighbourhood preferences.
- Community feed with search, filters, refresh and stable cursor pagination.
- Text/photo posts with preserved failed drafts and duplicate-safe retry reconciliation.
- Likes, comments, owner deletion, saved posts and saved jobs.
- Job discovery, demo applications and persistent application history.
- Recipient-only activity notifications from trusted like/comment events.
- Native Home · Jobs · Create · Saved · Profile tabs and stack details.

The seed contains **6 fictional authors, 360 posts and 24 jobs** across Mansarovar, Vaishali Nagar and Malviya Nagar. Demo applications stay inside this portfolio app; they are not delivered to employers. Seed authors do not have login credentials.

## Run locally

Use Node.js **22.18+**, npm and a dedicated Supabase development project:

```bash
git clone https://github.com/Kailramiya/ApnaCircle.git
cd ApnaCircle
cp .env.example .env
npm install
npx expo install --check
```

Fill `.env` with your Supabase project URL and publishable/legacy anon key. Apply the two SQL migrations in order, then the optional demo seed, using the [backend setup guide](supabase/README.md). Configure the native confirmation/recovery redirect URLs there. Never use a service-role key in the app.

```bash
npm run check
npx expo-doctor
npm run android:build
```

`android:build` requires a local Android SDK/device or emulator and creates a development build. After installation, use `npm run dev` to start Metro. On macOS with Xcode, use `npm run ios:build`. Custom-scheme auth callbacks need the app's development/release build; Expo Go is not sufficient evidence for them.

The first install generates `package-lock.json`; commit it after compatibility checks. The manifest follows Expo's [SDK 57 native-module versions](https://github.com/expo/expo/blob/sdk-57/packages/expo/bundledNativeModules.json); dependency resolution has not yet been executed.

See [LOCAL_VERIFICATION.md](documentaion/LOCAL_VERIFICATION.md) for Windows notes, two-user SQL/Storage checks, offline/permission scenarios, screenshot comparisons and device acceptance criteria.

## How it is organized

```text
src/app/           Expo Router routes and layouts
src/screens/       Screen composition and form behavior
src/components/    Shared controls, cards and paginated lists
src/hooks/         Account-scoped server queries and optimistic mutations
src/services/      Supabase access and media preparation
src/lib/           Validation, translations, cursors, sessions and recovery logic
src/store/         Device language preference
supabase/          Migrations, fictional seed and SQL regression checks
tests/             Runnable logic checks and opt-in Storage API check
documentaion/      Product decisions, implementation record and verification guide
```

TanStack Query owns server data; Zustand owns the language preference. React Hook Form and Zod handle form state and boundaries. Native styles/system fonts support Hindi and system text scaling without another styling dependency.

## Engineering choices to review

| Problem | Implementation |
|---|---|
| Two rows share a timestamp | Cursor includes the full database timestamp and UUID |
| Publish response disappears | Retry reconciles the same UUID and immutable image path |
| User changes accounts during a request | Account-keyed caches, cancellation and epoch checks |
| Rapid like/save/application requests | Desired-state writes plus database unique constraints |
| Optimistic action fails | Roll back only its fields, preserving other updates |
| Client attempts unauthorized writes | Ownership RLS and explicit column privileges |
| Session exceeds one secure-storage entry | Serialized chunks with a revision manifest |

Image buckets are intentionally public. Uncertain uploads are retained for reviewed maintenance rather than risking a published image. There is no durable offline write queue, employer dashboard or push delivery in this version.

## Checks and builds

`npm run check` runs TypeScript, ESLint and Node logic tests. Backend permissions/cursors have a separate transactional SQL check. `npm run test:storage` is an explicit opt-in integration check with two locally configured test accounts and a JPEG; it is not part of the default test command.

EAS profiles are provided for development, installable Android preview APKs and production bundles. Link your own Expo project and configure its public environment variables before building. Nothing has been deployed or submitted to an app store. Follow the [local build/evidence procedure](documentaion/LOCAL_VERIFICATION.md).

The [progress record](documentaion/PROGRESS.md) separates authored source from verified behavior. The [build log](documentaion/BUILD_LOG.md) records each delivery increment. The preserved `documentaion/` spelling avoids breaking the original project paths.
