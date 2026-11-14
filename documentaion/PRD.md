# ApnaCircle — Product Requirements Document

## 1. Overview
ApnaCircle is a cross-platform hyperlocal community and opportunities application. It helps users discover local posts, discussions, events, and job opportunities based on their selected location.

The core release focuses on community updates and nearby jobs in one demonstration city. Seed realistic content across its localities and label sample posts/jobs as demo data. Android release delivery is the first verification target; record iOS testing separately.

## 2. User roles
### Community user
- Registers and manages a profile.
- Browses local posts.
- Publishes posts.
- Likes, comments on, and saves posts.
- Searches content.
- Discovers and applies for jobs.

### Job publisher
For the MVP, job publishers are not given a separate dashboard. Job records may be inserted through seed data or an authorized administrative workflow.

## 3. Functional requirements

### 3.1 Authentication and onboarding
**Screens:** Splash, welcome, language selection, location selection, login, registration.

**Requirements:**
- Register and log in using Supabase Auth email/password.
- Persist authentication sessions securely using the supported Supabase React Native setup.
- Scope private and personalized cached data to the authenticated user. On logout/account change, cancel old requests, clear that account's cache and drafts, and prevent late responses from populating the next account's UI.
- Collect preferred language, city, and locality.
- Protect authenticated routes.
- Handle invalid credentials, network errors, and loading states.

**Acceptance criteria:**
- A new user can register and reach the authenticated area.
- An existing user can log in.
- A valid session survives app restarts and background/foreground transitions; an expired session produces a recoverable sign-in state.
- A logged-out user cannot access protected screens.
- Switching from user A to user B never displays A's saved content, applications, notifications, or personalized like state.
- Errors are presented clearly.

### 3.2 Home feed
**Requirements:**
- Fetch posts from Supabase.
- Show author, location, time, category, text, optional image, like count, and comment count.
- Filter by selected location and category.
- Support pagination and pull-to-refresh.
- Support like/unlike and save/unsave.
- Navigate to post details.
- Use `FlatList` for the feed.
- Show loading, empty, and error states.
- Keep already loaded posts visible during refresh and recoverable network errors, with a clear retry action.

**Acceptance criteria:**
- Feed content comes from the database, not hard-coded UI arrays.
- Pagination orders by `created_at DESC, id DESC` and uses both fields in the cursor; equal timestamps do not cause missing or duplicate items. Changing filters resets pagination.
- Pull-to-refresh fetches the latest data.
- Like and save state reflects the backend after mutation.

### 3.3 Search and filters
**Requirements:**
- Search posts in Home and jobs in Jobs; no separate Explore tab is required.
- Filter by category and location.
- Show useful empty and error states.
- Debounce text input to avoid excessive requests.

### 3.4 Jobs
**Requirements:**
- Browse job listings.
- Display title, company, location, salary range, employment type, and date.
- Search and filter jobs.
- View job details.
- Apply for a job.
- Save and unsave jobs.
- View application history.
- Prevent duplicate applications at the database level.

**MVP note:** Use seed data for job listings. Do not build an employer portal in the first version.

**Acceptance criteria:**
- A user can discover a job, view its details, save it, apply, and find it in application history.
- Repeated taps and retries result in one application per user/job.
- Saved state and application history survive an app restart.
- Seeded listings are clearly labeled. An application records intent inside the demo; no employer delivery or review is implied. The MVP status is `submitted`.

### 3.5 Create post
**Requirements:**
- Enter post text.
- Select a category.
- Optionally select an image with Expo Image Picker.
- Preview the image.
- Upload the image to Supabase Storage.
- Save the post record in PostgreSQL.
- Validate required fields and display upload/publish progress.
- Handle upload or database failure without leaving misleading UI state.
- Preserve entered text, category, and the selected image in the active composer after a recoverable failure; offer an explicit retry.
- Reuse one post UUID across retries of the same submission. Reconcile uncertain database outcomes before retrying or deleting an uploaded image; see `API_DOCUMENTATION.md` for the recovery contract.

**Acceptance criteria:**
- Canceling the image picker or denying permissions leaves text intact and allows a text-only post.
- Repeated publish taps/retries cannot create duplicate posts.
- A rejected insert does not leave an untracked upload; cleanup failures remain visible to development diagnostics for retry/maintenance.
- A timeout is not treated as proof that insertion failed. Confirm the outcome before reporting success or removing an image.
- Leaving a composer with unsaved content requires an explicit discard choice. Draft survival after process termination and automatic offline publishing are outside the MVP.

### 3.6 Likes
**Requirements:**
- Authenticated users can like and unlike posts.
- A user can have at most one like per post.
- Display the like count.
- Use a unique database constraint on `(post_id, user_id)`.
- Set the desired liked/unliked state so repeating the same request is safe; disable repeated controls while a mutation is pending and roll back any optimistic state on failure.

### 3.7 Comments
**Requirements:**
- View comments for a post.
- Add a comment.
- Delete only the current user's own comment.
- Display author and timestamp.
- Validate empty or excessively long comments.

### 3.8 Saved content
**Requirements:**
- Save and unsave posts.
- Save and unsave jobs.
- Display saved posts and saved jobs in the Saved tab, with optional shortcuts from Profile.
- Enforce uniqueness per user and item.
- Verify saved state after restarting the app and isolate saved content between accounts.

### 3.9 Notifications
**Requirements:**
- After the core flows are stable, store in-app notifications for likes and comments on a user's posts, excluding self-actions.
- Create notifications from trusted backend logic tied to successful interactions; the client cannot choose recipients or fabricate events.
- Display unread state.
- Allow marking a notification as read.
- Open notifications from a header icon into a stack screen; they are not a bottom tab.
- Replies, application-update notifications, and push notifications are later work requiring their own supported workflows.

### 3.10 Profile and settings
**Requirements:**
- Display name, username, avatar, bio, and location.
- Edit profile details.
- Upload profile image.
- View the user's posts and application history, with a shortcut to the Saved tab.
- Change preferred language and location.
- Log out.

### 3.11 English and Hindi
**Requirements:**
- Translate navigation, screen copy, validation, errors, loading/empty states, and accessibility labels.
- Format dates and numbers for the selected locale and retain the language preference after restart.
- Keep user-generated text in its original language; automatic translation is outside the MVP.

**Acceptance criteria:**
- Core flows work in both languages without missing translation keys or clipped Hindi text.
- Long strings and larger system text remain readable and actionable on small screens.

## 4. Navigation model
Bottom tabs:
1. Home
2. Jobs
3. Create
4. Saved
5. Profile

Home and Jobs contain their own search/filter controls. Post details, job details, application history, and notifications are stack routes. Notifications are reached through a labeled header icon when implemented.

## 5. Non-functional requirements
- TypeScript strict mode.
- Maintainable feature-based structure.
- Secure RLS policies for user-owned data.
- No service-role key in the client.
- Appropriate database indexes.
- Graceful handling of offline/network failures: preserve active form input, retain loaded content, offer retries, and prevent duplicate writes. No durable offline write queue is required.
- Accessible touch targets and readable text.
- Efficient list rendering with `FlatList`.
- Avoid unnecessary re-renders and network requests.
- Support different screen sizes and safe areas.
- Verify keyboard visibility, Android back navigation, permission denial, image-picker cancellation, and session behavior when backgrounded.
- Verify screen-reader labels, system text scaling, and long Hindi strings on small and large screens.
- Evaluate feed scrolling with several hundred seeded posts in a release build on a physical Android device; record the device, dataset size, observations, and any measured improvements.

## 6. MVP priorities
### Must-have
- Polished app shell and navigation
- Authentication
- Home feed backed by Supabase, pagination, pull-to-refresh, search, and location/category filtering
- Create post
- Image upload
- Likes
- Basic comments
- Saved posts and jobs in the Saved tab
- Job listing, details, search/filters, duplicate-safe applications, and application history
- Profile
- English and Hindi throughout the core flows
- Error/loading/empty states and recoverable network failures
- Native navigation, keyboard, permissions, accessibility, and session checks
- Installable Android release, short demo, setup instructions, and critical automated checks

### Should-have
- In-app like/comment notifications reached through a header icon, after core flows are stable

### Later
- Push notifications
- Advanced recommendation/ranking
- Employer dashboard
- Chat or direct messaging
- Location services and map-based discovery
- Comment replies and application status-update workflows, including their notifications
- Durable offline drafts, queued writes, and background synchronization

## 7. Definition of done
A feature is complete only when:
- Its UI is implemented.
- Its data flow is connected to the backend where required.
- Validation and error states are handled.
- Authorization is enforced by the database.
- It has been manually tested on a simulator/device.
- Core journeys are checked in English and Hindi, with relevant native and accessibility behavior verified.
- Critical automated checks cover ownership/privacy, duplicate likes/applications, failed-publish text preservation, and pagination with equal timestamps.
- Relevant documentation is updated.

Release acceptance additionally requires an installable Android build, a short walkthrough, reproducible setup/check commands, and a device test record. Verify login after restart/backgrounding, persisted posts/saved items/applications, denied permissions, slow or interrupted requests, and account switching. Record the iOS device/simulator and results if tested; otherwise state that iOS remains unverified.
