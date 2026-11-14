# ApnaCircle — Project Context

## Product identity
- **Name:** ApnaCircle
- **Tagline:** Your Community. Your Opportunities. Your Circle.
- **Category:** Hyperlocal community and opportunities mobile application
- **Platforms:** Android and iOS; prioritize an installable Android release and record iOS verification separately.
- **Product inspiration:** The broader problem space of making local content, services, and opportunities more accessible to people across India. ApnaCircle is an independent product and must have its own branding and implementation.

## Vision
Help people discover useful information and opportunities in their local communities through a simple, accessible mobile experience.

The first release focuses on local community updates and nearby jobs. Use realistic, clearly labeled development content for one city and its localities; choose and record that city during setup. Demonstrate useful location filtering before expanding coverage.

## Target users
People in Tier 2 and Tier 3 Indian cities who want to discover:
- Local employment opportunities
- Community updates and discussions
- Educational opportunities
- Local events and announcements
- Useful information from nearby people

## Core user capabilities
1. Create an account and manage a profile.
2. Choose a preferred language and location.
3. Browse a location-aware community feed.
4. Create posts with optional images.
5. Like, comment on, and save posts.
6. Search and filter local content.
7. Discover jobs and apply for them.
8. Save jobs and view application history.
9. Receive in-app notifications for likes and comments after the core release flows are stable.

## MVP principles
- Prioritize a working, polished mobile experience over an excessive feature count.
- Implement real authentication and database integration.
- Build the feed and post-creation flow end to end.
- Complete saved content, job applications, and application history; verify successful actions persist after an app restart.
- Treat English/Hindi support, mobile behavior, and recoverable network failures as core release requirements.
- Use secure database policies rather than relying on frontend checks.
- Keep the architecture understandable and explainable by the project owner.
- Do not claim features are complete unless they exist and have been tested.

## Product boundaries for the first version
- Email/password authentication is sufficient initially.
- Job listings use clearly labeled development seed data. Applying records an application in ApnaCircle; it does not claim delivery to a real employer.
- In-app like/comment notifications are secondary to the core flows. Replies, application-update notifications, and push notifications are later work.
- Do not build an employer dashboard or advanced recommendation engine for the MVP.
- English and Hindi are required for the core release, including validation, errors, empty states, and locale-aware dates. They remain planned until implemented and tested; user-generated content is not automatically translated.
- Keep entered post text after a recoverable failure and keep loaded content visible during refresh. Durable offline drafts, queued writes, and background synchronization are outside the MVP.

## Navigation
Bottom tabs: **Home · Jobs · Create · Saved · Profile**. Search lives in Home and Jobs. A header icon opens the notifications stack screen when notifications are implemented; post details, job details, and application history are stack screens.

## Technology direction
- React Native + Expo + TypeScript
- Expo Router
- NativeWind (if compatible with the chosen Expo setup)
- Zustand for client-side state
- TanStack Query for server state
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- React Hook Form and Zod
- Expo Image Picker
- AsyncStorage where appropriate

## Product success criteria
A reviewer should be able to:
- Install and launch the Android release build using documented instructions.
- Register, log in, and retain a session.
- Browse a feed populated from the backend.
- Create a post and optionally upload an image.
- Like and comment on posts.
- Save posts/jobs, apply once to a seeded job, and view application history after restarting the app.
- Use English and Hindi, larger system text, and accessible controls.
- Recover from denied image permissions or a failed publish without losing entered text.
- Understand the app's navigation and visual hierarchy.
- Inspect the repository and understand its architecture.
- View a short demo and documented device checks, performance observations, and automated-check commands.

## Non-goals
- Do not copy Lokal branding, assets, UI, or proprietary product behavior.
- Do not add complex features merely to increase the technology list.
- Do not put secrets or service-role credentials in the mobile bundle.
