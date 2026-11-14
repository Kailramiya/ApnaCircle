# ApnaCircle — Design System

## 1. Design direction
ApnaCircle should feel like a modern, approachable Indian consumer application: clean, readable, friendly, and mobile-first.

Center the first release on community updates and nearby jobs in one demonstration city. Use realistic, clearly labeled sample content across localities. English and Hindi must both support complete core journeys.

Do not copy another company's branding or screens. Use the design references only as broad inspiration.

## 2. Color tokens
| Token | Hex |
|---|---|
| Primary | `#2563EB` |
| Primary dark | `#1D4ED8` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Main text | `#0F172A` |
| Secondary text | `#475569` |
| Border | `#E2E8F0` |
| Success | `#166534` |
| Error | `#B91C1C` |

Define tokens centrally rather than repeating raw values across components.

## 3. Typography
- Native system fonts for both English and Hindi; avoid a font-download startup dependency.
- Screen heading: approximately 24 px.
- Section heading: approximately 18 px.
- Card title: approximately 18 px.
- Body: approximately 16 px.
- Caption: approximately 14 px.

The authored tokens live in `src/theme.ts`. Darker secondary/success/error text improves contrast on the light surfaces. A future custom font must include licensed Hindi coverage and native text-scaling checks.

Treat these sizes as defaults, not fixed limits: respect system text scaling, allow Hindi headings/buttons to wrap where needed, and avoid fixed-height text containers that clip translated content.

## 4. Spacing and shape
- Use a consistent spacing scale.
- Prefer card corner radii around 12–16 px.
- Use subtle borders and restrained shadows.
- Maintain clear separation between content groups.
- Avoid cramped layouts and excessive decoration.

## 5. Core components
Build reusable components when they have repeated behavior or styling:
- Button
- TextInput
- SearchBar
- PostCard
- JobCard
- UserAvatar
- CategoryChip
- LocationSelector
- LoadingIndicator
- Skeleton
- EmptyState
- ErrorState
- BottomTabBar

Each component should have typed props and a clear responsibility.

Use the navigator's tab bar unless a demonstrated need requires a custom one. Bottom tabs are **Home · Jobs · Create · Saved · Profile**. Notifications open from an accessible header icon into a stack screen after that feature is implemented.

## 6. Screen design guidance

### Home
- Header with brand and selected location.
- Post search with debounced input and useful empty results.
- Category/filter row.
- Feed of readable post cards.
- Clear create-post entry point.
- Bottom navigation.

### Saved
- Separate Posts and Jobs sections within the Saved tab.
- Show current saved state consistently with Home, Jobs, and detail screens.
- Provide clear empty states that lead back to browsing.

### Create
- Clear text composer.
- Category selection.
- Optional image picker and preview.
- Visible publishing progress and error feedback.
- Preserve text and selection after recoverable failures; display a retry action.
- Picker cancellation or denied permissions must leave a usable text-only composer.
- Show an explicit discard choice before leaving unsaved content.

### Jobs
- Search and filters.
- Scannable job cards.
- Salary and location information.
- Clear view-details and apply actions.
- A visible applied state and access to application history; pending controls prevent repeated taps.
- Clearly label seeded listings and explain that demo applications are recorded inside ApnaCircle.

### Profile
- Avatar and user details.
- Edit profile action.
- Sections for the user's posts and application history, plus a shortcut to Saved.
- Settings and logout.

## 7. Interaction states
Every data-driven screen should consider:
- Initial loading
- Refreshing
- Empty results
- Error
- Success
- Disabled controls
- Pending mutation

During refresh, keep existing content visible with a small progress indicator. A recoverable network error shows retry feedback without erasing the current list or active form. Only confirmed writes show success. Durable offline drafts and automatic queued publishing are outside the MVP.

## 8. Accessibility and mobile behavior
- Respect safe areas.
- Use keyboard-aware layouts for forms.
- Ensure touch targets are comfortably sized.
- Respect system text scaling and test larger sizes with long English/Hindi strings.
- Use accessible labels for icon-only buttons.
- Check contrast for text and controls.
- Test on multiple screen sizes.
- Verify Android back behavior, keyboard-visible forms, picker cancellation, and permission denial on a native device.
- Translate validation, error/empty/loading states, and accessibility labels; format dates/numbers for the selected locale. Leave user-generated content in its original language.

## 9. Visual quality checklist
- Consistent typography and spacing.
- No arbitrary color usage.
- No overflowing text.
- Images have appropriate aspect ratios and placeholders.
- Lists scroll smoothly.
- Navigation states are clear.
- Loading and empty states look intentional.
- Compare screenshots at small and large screen sizes in English/Hindi, including larger system text. Confirm controls remain reachable with the keyboard open.
- Verify screen-reader names/states and release-build scrolling on a physical Android device; record the tested device and any unresolved issues.
