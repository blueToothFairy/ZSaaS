# Technical Design

- **ID:** `iss-005`
- **Date:** Nov 16, 2026
- **Title:** Refresh the VibeTune Dashboard UI
- **Branch:** `feat/iss-005-dashboard-ui-refresh`

> Implementation plan: [./iss-005-plan.md](iss-005-plan.md)

## 1) Overview

### Context

The authenticated dashboard in `saas-platform/src/app/home/page.tsx` currently uses a dark glass-panel style. `new-ui.html` presents a new creative direction: warm paper surfaces, near-black text, acid-yellow and blue accents, bold editorial typography, a compact sidebar, and a persistent music player.

### Proposed Direction

Apply the visual language and responsive page composition in `new-ui.html` to the existing authenticated dashboard. First break the current monolithic `home/page.tsx` into a dashboard container and focused section components, then style those components to match the reference. Keep the React dashboard as the source of behavior and data, retaining existing API calls, auth checks, upload/scan flow, favorites, profile editor, and player state.

Treat `new-ui.html` as a visual and interaction reference, not production code to embed. Translate its layout and styles into the existing Next.js/React page and CSS conventions.

### Goals

- Give all authenticated dashboard sections a consistent warm-paper, high-contrast visual system.
- Match the reference's sidebar navigation, editorial Home hero, track cards, scan layout, Favorites banner, Profile cards, and fixed player.
- Preserve current dashboard behavior, data contracts, and authentication.
- Make the dashboard easier to maintain by separating navigation/shell and each major tab from the route container.
- Bring the public landing and first-party sign-in/sign-up screens into the same visual system without changing their auth flows.
- Use the email local part when an account has no display name, enlarge the Home clock icon, and remove the duplicate Favorite Tracks panel from Profile.
- Keep the layout responsive, keyboard usable, and readable with reduced motion enabled.

### Non-Goals

- Changes to authentication, APIs, recommendation logic, or stored data.
- Replacing the dashboard with the static HTML or its demo JavaScript/data.
- Adding unrelated dashboard features or changing audio source and playlist behavior. The player adopts the reference volume slider, connected to the current audio element.
- Redesigning the music taste onboarding flow or changing auth behavior.

## 2) Requirements and Constraints

### Functional

- Existing navigation still switches between Home, AI Vibe Scan, Favorites, and Profile.
- Existing track playback, favorite actions, image upload/analysis, account settings, and Music Taste Editor remain functional.
- The player exposes a keyboard-operable volume slider that updates the active audio element.
- Landing, sign-in, and sign-up use the dashboard's paper, ink, acid, and blue visual language while retaining their current routes and auth actions.
- If the account name is missing, the dashboard displays the part of the email address before `@`.
- The Home local-time icon is clearly visible; Profile uses blue/acid-toned preference controls and does not repeat the Favorite Tracks collection.
- Loading, empty, error, and scan-result states receive styling consistent with the new design.

### Non-Functional

- Use the current Next.js page, Tailwind utilities, and app stylesheet; avoid adding a styling framework.
- Keep the route container focused on authentication, shared dashboard state, navigation, and composition. Keep tab-specific presentation and local interaction state with its tab component; pass shared data and actions through typed props.
- Extract shared UI such as the sidebar and player into focused components only where ownership is clear; do not introduce a general-purpose component framework.
- Retain semantic controls, visible focus, accessible names, and responsive layouts.
- Respect `prefers-reduced-motion` and avoid fixed-player overlap with page content.

### Constraints / Assumptions

- `new-ui.html` is a self-contained visual prototype; its static guest identity, sample songs, and standalone interactions must not replace live application data or handlers.
- The existing authenticated dashboard and API integrations remain authoritative.
- No backend, database, or environment changes are needed.

## 3) Architecture and Integration Points

- `saas-platform/src/app/home/page.tsx` is currently a monolithic authenticated dashboard. Refactor it into a thin route/container that owns auth, shared data/actions, active-tab navigation, and composition.
- `saas-platform/src/app/home/components/` will hold focused dashboard components: shared shell/sidebar, Home tab, AI Vibe Scan tab, Favorites tab, Profile tab, and persistent player. Final names should follow existing repository conventions.
- Tab components own their section markup and tab-only state. Shared song/player/favorite data and actions remain with the container when used by multiple tabs, passed through small typed props contracts.
- `saas-platform/src/app/globals.css` owns shared app styles. Add only the design tokens or focused CSS rules that are awkward to express with existing utilities.
- `saas-platform/src/app/components/music-taste-editor.tsx` remains the Profile editor; adjust only its presentation if needed to fit the refreshed Profile surface.
- `saas-platform/src/app/layout.tsx` is a possible font integration point if the chosen typography is not already available. Keep font loading consistent with the app's existing setup.
- `saas-platform/src/app/landing-page/page.tsx` and `landing.module.css` — align the public landing with the editorial VibeTune theme.
- `saas-platform/src/app/sign-in/[[...sign-in]]/page.tsx`, `saas-platform/src/app/sign-up/[[...sign-up]]/page.tsx`, and `saas-platform/src/app/auth-pages.module.css` — align auth screens while preserving form submission and redirect logic.

Keep API wiring and behavior in place while moving code. Avoid duplicate state, broad prop bags, or premature hooks; extract a hook only if a coherent behavior is shared or makes the container materially simpler.

## 4) Visual Mapping

| Reference element | Dashboard implementation |
| --- | --- |
| Paper/ink/acid/blue palette and display typography | Shared dashboard tokens and section typography |
| Persistent left navigation and identity | Responsive dashboard sidebar with current user data |
| Large “Feel The Frequency” poster | Home hero using live greeting/content and existing navigation actions |
| Curated track grid | Existing curated songs and playback/favorite actions |
| Photo upload card and results | Existing AI scan upload and result/error/loading states |
| Favorites banner and collection | Existing favorites data, loading/empty states, and playback/removal actions |
| Account and settings cards | Existing profile identity, sign-in methods, and Music Taste Editor |
| Fixed bottom player | Existing player state and controls, restyled for the new palette |

## 5) Frontend Component Structure

```text
saas-platform/src/app/home/
├── page.tsx                         # Auth, shared state/actions, active tab, composition
└── components/
    ├── dashboard-sidebar.tsx        # Brand, navigation, user identity, responsive menu
    ├── home-tab.tsx                 # Hero and curated tracks
    ├── vibe-scan-tab.tsx            # Upload, analysis, results, and errors
    ├── favorites-tab.tsx             # Favorites banner, collection, and empty/loading states
    ├── profile-tab.tsx               # Account, sign-in methods, and MusicTasteEditor
    └── music-player.tsx              # Persistent playback controls and progress
```

Names are an implementation guide; adjust to existing conventions if necessary. `page.tsx` remains the owner of cross-tab data and actions (for example authentication, favorites shared with Profile, and playback); each tab receives only the values and callbacks it needs. Preserve existing state lifetime when extracting a tab: keep state in the container or keep the tab mounted if its current selections/results must survive navigation. The persistent player stays mounted at the dashboard level so switching tabs does not interrupt playback.

## 6) Planned File Changes

**Modify**

- `saas-platform/src/app/home/page.tsx` — reduce to dashboard orchestration and shared state/actions.
- `saas-platform/src/app/home/components/home-tab.tsx` — enlarge the local clock icon.
- `saas-platform/src/app/home/components/profile-tab.tsx` — remove the duplicate Favorite Tracks panel and refine profile presentation.
- `saas-platform/src/app/home/dashboard.module.css` — use accessible blue/acid-toned preference fields and refine the clock icon.
- `saas-platform/src/app/landing-page/landing.module.css` — editorial landing page styling.
- `saas-platform/src/app/auth-pages.module.css` — shared sign-in and sign-up styling.
- `saas-platform/src/app/sign-in/` and `saas-platform/src/app/sign-up/` — visual updates only; retain existing auth state and routing.
- `saas-platform/src/app/globals.css` — shared palette, typography, responsive/reduced-motion rules as needed.
- `saas-platform/src/app/components/music-taste-editor.tsx` — presentation adjustments only if required for visual consistency.
- `saas-platform/src/app/layout.tsx` — font loading only if required by the design and not already configured.
- `saas-platform/src/app/components/ui/sidebar.tsx` — replace the render-time random skeleton width with a stable value so frontend lint can pass.

**Add**

- `saas-platform/src/app/home/components/` — focused sidebar, tab, and player components; move existing section markup and behavior without changing behavior or state lifetime.

No new route, API, schema, or service is expected.

## 7) Risks and Rollback

| Risk | Mitigation |
| --- | --- |
| Static prototype content displaces live user or API data | Port structure and styling only; bind every section to existing state and handlers. |
| Component extraction changes state lifetime or effects | Move one tab at a time, preserve effect dependencies, and keep state in the container or keep the tab mounted when its state must survive navigation. |
| Container accumulates a large, brittle props interface | Pass focused typed props and keep tab-only state local; extract a shared hook only when justified. |
| Dense styling changes hide existing states or actions | Preserve loading, empty, error, and success branches while restyling them. |
| Fixed player or sidebar crowds small screens | Verify narrow layouts and reserve page bottom space for the player. |
| Motion or contrast harms usability | Keep text contrast strong, provide focus styles, and honor reduced-motion preferences. |

Rollback by reverting the dashboard and stylesheet changes. No data or API rollback is required.

## 8) Open Questions

None. Use `new-ui.html` as the source of visual direction and keep existing product behavior intact.

## 9) References

- `new-ui.html` — visual reference and responsive dashboard prototype.
- `saas-platform/src/app/home/page.tsx` — authenticated dashboard and existing behavior.
- `saas-platform/src/app/globals.css` — application-wide styles.
- `saas-platform/src/app/components/music-taste-editor.tsx` — Profile music taste controls.
