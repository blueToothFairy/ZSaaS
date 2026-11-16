# Implementation Plan

- **ID:** `iss-005`
- **Date:** Nov 16, 2026
- **Title:** Refresh the VibeTune Dashboard UI
- **Design:** [./iss-005-design.md](iss-005-design.md)
- **Scope:** Split the monolithic dashboard into focused tab components, apply the `new-ui.html` visual direction, and align landing/sign-in/sign-up screens while preserving existing behavior and data integrations.

## 1) Objective

Refactor the monolithic dashboard into a maintainable container and focused tab components, then align dashboard, landing, sign-in, and sign-up visuals with the supplied reference. Preserve existing user flows and API behavior.

## 2) Tasks

### Task 1 — Map the Reference to Existing UI

- [x] Identify the reusable layout, palette, type, spacing, and responsive patterns in `new-ui.html`.
- [x] Map each reference section to the existing dashboard JSX, state, and handlers.
- [x] Record existing loading, empty, error, and success states that must remain visible.

**Expected result:** An implementation map that distinguishes reusable visual structure from prototype-only content and behavior.

### Task 2 — Split the Dashboard into Focused Components

- [x] Keep `home/page.tsx` as the route/container for auth, cross-tab data and actions, active-tab selection, and composition.
- [x] Extract the sidebar/navigation and persistent player into dashboard-level components.
- [x] Extract Home, AI Vibe Scan, Favorites, and Profile into separate tab components under `home/components/`.
- [x] Keep tab-specific markup in its component and pass shared state/actions through focused typed props.
- [x] Preserve state across navigation where it persists today; retain such state in the container or keep the tab mounted.
- [x] Move one section at a time and confirm its existing effects, loading/error states, and interactions are preserved.

**Expected result:** `home/page.tsx` no longer contains every tab's markup; each major dashboard section has a clear component boundary without duplicate state or behavior changes.

### Task 3 — Establish the Dashboard Design System

- [x] Add the paper, ink, accent, border, and muted color values in the existing stylesheet or utilities.
- [x] Apply the reference typography using the existing font setup or a minimal font integration.
- [x] Define shared spacing, card, button, focus, and reduced-motion treatments without adding a UI framework.

### Task 4 — Refresh the Dashboard Shell and Home

- [x] Restyle the sidebar, active navigation, user identity, page headers, and responsive menu behavior.
- [x] Rebuild the Home hero and curated track grid to reflect the editorial reference.
- [x] Retain live user/greeting data, curated song results, playback, and favorite actions.
- [x] Restyle the public landing page with the paper/ink/acid/blue visual language.
- [x] Restyle sign-in and sign-up screens without changing form validation, auth calls, or redirect destinations.

### Task 5 — Refresh Feature Sections and Player

- [x] Restyle AI Vibe Scan upload, analyzing, results, failure, and reset states without changing the scan flow.
- [x] Restyle Favorites banner, collection, loading/empty states, and existing play/remove actions.
- [x] Restyle Profile and its account/settings/music taste areas; keep sign-in settings and the Music Taste Editor usable.
- [x] Restyle the persistent player while preserving current track, progress, and playback behavior.
- [x] Add the reference volume slider and connect it to the active audio element.
- [x] Add a small set of deliberate visual accents to the hero, track cards, Favorites banner, and player while retaining the established palette and layout.
- [x] Replace the added orange accents with the existing cobalt blue and add the “MORE FEELING. LESS FILTER.” issue poster to the sidebar.
- [x] Enlarge the Home clock icon so it reads clearly at normal viewing size.
- [x] Replace gray Profile preference boxes with accessible pale-blue/acid theme colors.
- [x] Use the account email local part as the display-name fallback when the name is absent.
- [x] Remove the duplicate Favorite Tracks panel from Profile; the Favorites tab remains the collection surface.

### Task 6 — Responsive and Accessibility Review

- [x] Check desktop, tablet, and narrow mobile layouts, including sidebar and fixed-player interactions.
- [x] Check keyboard navigation, visible focus, accessible control names, text contrast, and reduced-motion behavior.
- [x] Confirm all four sections and existing actions remain reachable and their state/error feedback is legible.

### Task 7 — Review and Verify

- [x] Compare the implemented sections against `new-ui.html` for visual consistency.
- [ ] Exercise navigation, curated playback/favorites, scan upload/result/error, Favorites, Profile settings, and player controls.
- [x] Replace the shared sidebar skeleton's render-time random width with a stable value to resolve the lint error.
- [x] Run the frontend lint and production build checks.

**Verification note:** Frontend lint passes with 5 existing warnings and no errors; the production build succeeds with a pre-existing `next.config.ts` warning. The end-to-end interaction walkthrough remains unchecked because no browser automation or interactive browser is available in this workspace.

## 3) Acceptance Criteria

- The authenticated dashboard follows the reference's paper/ink palette, bold editorial hierarchy, accent colors, and card treatment.
- Home, AI Vibe Scan, Favorites, and Profile use a consistent refreshed layout; navigation and the player remain available as designed.
- `home/page.tsx` acts as a focused dashboard container; sidebar, player, and each major tab are implemented as focused components under `home/components/`.
- Shared cross-tab state has a clear owner, tab-only state remains local, and components receive focused typed props rather than duplicating API or business logic.
- Live user, song, favorite, scan, and profile data continue to come from the existing state and API integrations.
- Existing loading, empty, error, and result states remain functional and visually legible.
- Playback, favorite management, scan, sign-in settings, and Music Taste Editor behavior are unchanged.
- The volume slider updates the active audio element and remains keyboard accessible.
- Landing, sign-in, and sign-up match the theme without changing auth behavior.
- Missing account names fall back to the email local part; Profile no longer duplicates Favorite Tracks.
- Layout remains usable on desktop and mobile, with keyboard focus and reduced-motion support.
- Frontend lint and production build complete successfully.
- No backend, API, or database change is introduced.

## 4) Out of Scope

- Music Taste onboarding redesign.
- New dashboard features, data sources, endpoints, or recommendation changes.
- Replacing real user/API content with the prototype's sample data.
- Changing player, scan, favorites, authentication, or profile business logic.
