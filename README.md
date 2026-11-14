# ApnaCircle

An Android-first neighbourhood community and local-jobs portfolio app for Jaipur, built with Expo, React Native, TypeScript and Supabase. English and Hindi are supported.

**Implementation in progress.** Source is delivered in genuine feature increments. No dependencies, builds, database migrations or tests have been executed in the authoring workspace; device validation remains required. See [the implementation record](documentaion/BUILD_LOG.md).

## Local setup

Use Node.js 22.18+ and npm. The first local install creates `package-lock.json`; commit it after checking dependency compatibility. No lockfile has been fabricated.

```bash
git clone https://github.com/Kailramiya/ApnaCircle.git
cd ApnaCircle
cp .env.example .env
npm install
npx expo install --check
npm run typecheck
npm run lint
npm start
```

The Supabase URL and publishable (or legacy anon) key belong in `.env`. Never place a service-role key in an `EXPO_PUBLIC_*` variable. Database setup and feature verification instructions will accompany the backend increment.

Expo SDK 57 uses the versions in its [official bundled native-module map](https://github.com/expo/expo/blob/sdk-57/packages/expo/bundledNativeModules.json). App routes live in `src/app`; reusable UI lives in `src/components`. Product decisions remain in [`documentaion/`](documentaion/).
