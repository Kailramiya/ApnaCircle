# ApnaCircle — Engineering and Coding Rules

## 1. General principles
- Prefer simple, readable, maintainable code.
- Follow the existing repository conventions.
- Do not rewrite working code without a clear reason.
- Do not introduce dependencies without explaining their value.
- Do not claim functionality is implemented unless it exists and has been tested.
- Avoid speculative abstractions and premature optimization.

## 2. React Native
- Use functional components.
- Use TypeScript for all application code.
- Use `FlatList` or an appropriate virtualized list for long lists.
- Provide stable keys.
- Handle safe areas and keyboard behavior.
- Verify Android back behavior, unsaved-composer discard choices, image-picker cancellation, and denied permissions without losing entered text.
- Manage auth lifecycle listeners once with cleanup; verify restart and background/foreground session behavior.
- Keep components focused and reasonably small.
- Avoid unnecessary state and effects.
- Use memoization only when it solves a demonstrated or likely performance issue.
- Optimize image sizes and loading behavior.
- Test on Android and iOS where practical.
- Use translated accessibility labels, support system text scaling, and check English/Hindi layouts on small and large screens.

## 3. TypeScript
- Keep strict type checking enabled.
- Avoid `any`; use `unknown` and narrow types when necessary.
- Type component props, service inputs, and service outputs.
- Keep shared domain types in a predictable location.
- Validate untrusted external data at runtime where appropriate.

## 4. State management
### Zustand
Use for client-owned state, such as:
- Selected language
- Selected location/preferences
- Temporary UI state

### TanStack Query
Use for server-owned state, such as:
- Posts
- Jobs
- Comments
- Profiles
- Notifications
- Saved records

Do not maintain a second copy of query data in Zustand.

## 5. TanStack Query
- Use queries for reads and mutations for writes.
- Use `useInfiniteQuery` for paginated feeds where appropriate.
- Define stable query keys centrally or consistently.
- Include the authenticated user ID in private/personalized query keys, including liked, saved, and applied state.
- On logout/account changes, cancel old queries, clear outgoing account data/drafts, and prevent late query/mutation callbacks from repopulating that account's cache.
- Invalidate or update affected queries after mutations.
- Use optimistic updates only when rollback behavior is implemented.
- Handle loading, error, and empty states.
- Keep loaded content visible during refresh and recoverable errors; provide retry feedback.
- Avoid duplicate requests caused by unstable query keys or unnecessary effects.

## 6. Services and data access
- Keep Supabase calls in service modules.
- Do not call Supabase directly from presentational components.
- Use typed input/output contracts.
- Centralize common error handling where it improves consistency.
- Keep pagination and filtering logic explicit.
- Use the `(created_at, id)` cursor and matching deterministic ordering defined in `API_DOCUMENTATION.md`; reset pagination on filter/account changes.
- Set desired liked/saved states safely on retries, backed by unique database constraints; avoid blind toggles.
- Do not expose secrets in client code.

## 7. Forms and validation
- Use React Hook Form for non-trivial forms.
- Use Zod schemas for validation.
- Show field-level validation messages.
- Disable submit controls while requests are pending.
- Prevent duplicate submissions.
- Preserve user input when recoverable errors occur.
- Reuse a post UUID across publish retries, reconcile uncertain insert results, and remove only confirmed-unused uploads. Follow the recovery contract in `API_DOCUMENTATION.md`.
- Keep application copy, validation/error messages, and locale formatting centralized for English and Hindi. Do not automatically translate user content.

## 8. Security
- Enable RLS on client-accessible tables.
- Enforce ownership and authorization in database policies.
- Never rely on frontend checks as the security boundary.
- Never include the Supabase service-role key in the mobile app.
- Keep `.env` out of version control.
- Commit `.env.example` with variable names and safe placeholders only.
- Validate file types and sizes for uploads.
- Do not trust user IDs supplied by the client for authorization.

## 9. Performance
- Use pagination for growing datasets.
- Avoid rendering large lists in `ScrollView`.
- Avoid unnecessary re-renders.
- Use appropriately sized images.
- Avoid repeated network calls.
- Profile before applying complex optimizations.
- Check feed scrolling in a release build on a physical Android device using several hundred seeded posts; record device/OS, build, dataset size, observations, and any measured improvements.

## 10. Error handling
- Handle network failures.
- Show useful user-facing messages.
- Log actionable technical details in development.
- Do not expose secrets or sensitive backend details in UI errors.
- Ensure failed uploads/mutations do not produce false success states.

## 11. Git conventions
Use clear commit messages, for example:
- `feat: implement authentication`
- `feat: add community feed`
- `feat: implement post creation`
- `feat: add job discovery`
- `fix: resolve feed pagination issue`
- `refactor: extract reusable post components`
- `docs: document database policies`

## 12. Definition of done
Before marking a task complete:
1. Type-check the project.
2. Run relevant lint/tests if configured.
3. Manually verify the user flow.
4. Verify loading, empty, and error states.
5. Verify database permissions for affected data.
6. Update documentation and `PROGRESS.md`.

For non-trivial logic, leave a small runnable regression check using existing tooling. The core release must cover ownership/private-data isolation, duplicate likes/applications, failed-publish text preservation, and equal-timestamp pagination. Verify sessions after restart/backgrounding and native interactions on a device; browser-only checks do not establish native correctness.

Release documentation must include install/setup/check commands, an installable Android build, a short demo, and actual device test results. Record iOS coverage separately and leave it unverified if no iOS test was performed.
