# Implementation Plan

- **ID:** `iss-006`
- **Date:** Nov 17, 2026
- **Title:** Fix Favorites Loading and Profile Account Controls
- **Design:** [./iss-006-design.md](iss-006-design.md)
- **Scope:** Diagnose and fix the Favorites 500, show the account-link action supported by the signed-in methods, and clarify Music Taste controls.

## 1) Objective

Resolve the dashboard Favorites failure based on the backend error evidence, and correct the Profile and Music Taste controls without changing existing favorite or account-linking behavior.

## 2) Tasks

### Task 1 — Diagnose Favorites 500

- [x] Inspect the configured database. The `favorites` table was absent while `user_profiles` was present, confirming the cause of the query failure.
- [x] Compare the expected query columns with the checked-in `mig-001-init.sql` schema; the repository fields match its Favorites definition.
- [x] Add and apply `mig-003-favorites.sql` to create the missing table idempotently, without altering existing tables or rows.
- [x] Keep database details out of production error responses; the controller logs the server-side exception and only returns its detail in development.

**Expected result:** A valid database request returns favorites or an empty list; genuine database failures remain diagnosable from backend logs.

### Task 2 — Expose Linked Sign-in Methods

- [x] Find the authoritative backend account/session source for password and Google linkage.
- [x] Include the method state in the existing refresh/authenticated-user contract, using a small typed representation.
- [x] Update the frontend auth user type and session synchronization to retain that state.
- [x] Avoid inferring linked methods from email address or the most recent login alone.

**Expected result:** Profile receives current linked-method information from the authenticated account.

### Task 3 — Render the Appropriate Profile Action

- [x] Pass linked-method state from the dashboard to `ProfileTab`.
- [x] For Google-only accounts, show “Add password”.
- [x] For password-only accounts, show “Link Google account”.
- [x] For accounts with both methods, show neither linking action and explain that both methods are linked.
- [x] Preserve current link/add handlers, success/error feedback, and account security behavior.

**Expected result:** Profile presents only the action that can extend the current account's sign-in options.

### Task 4 — Clarify Music Taste Controls

- [x] Give “Add artist” a distinct visual treatment from the track catalog search action.
- [x] Change the track search button label to “Search track”; keep adding a track tied to selecting a search result.
- [x] Preserve responsive layout, disabled/loading states, and accessible button names.

**Expected result:** Artist entry and track search are visually and verbally distinct.

### Task 5 — Review and Verify

- [x] Review the final diff for unintended API, auth, or data-contract changes.
- [x] Verify the repository-shaped database query and authenticated Favorites endpoint return HTTP 200 with an empty list.
- [x] Verify the frontend `/api/profile/favorites` proxy returns HTTP 200 with `{ favorites: [], total: 0 }` for an authenticated request.
- [x] Review each account-method combination against the Profile rendering conditions.
- [x] Confirm artist addition and track search retain their existing handlers; only the artist button style and search label changed.

**Verification note:** The configured database did not contain `public.favorites`. The migration was applied, the repository-shaped DB query succeeded, and an authenticated request through the frontend proxy returned HTTP 200 with an empty Favorites list. Frontend TypeScript check passes. ESLint on the changed frontend files reports 0 errors and 1 `<img>` warning. TypeScript compilation of the changed backend auth files passes. Full backend `tsc` reports two errors in `recommendation.integration.test.ts` (mock repositories omit `replaceForUser`). The production frontend build could not fetch Geist fonts from Google Fonts in this network-restricted environment; it also reports the existing deprecated `experimental.serverComponentsExternalPackages` config key.

## 3) Acceptance Criteria

- Dashboard Favorites no longer returns 500 when the backend database and schema are correctly configured.
- Empty Favorites displays the existing empty state; server failures do not expose internal database details to production clients.
- Profile displays “Add password” for Google-only accounts and “Link Google account” for password-only accounts, with no linking action when both methods are already linked.
- Account method selection is based on authoritative account data, not email matching.
- “Add artist” is visually distinct, and the track catalog action reads “Search track”.
- Existing favorite, auth-linking, and music taste operations retain their behavior and payloads.

## 4) Out of Scope

- New favorites features, auth providers, or automatic account linking.
- Broad auth architecture changes or unrelated profile redesign.
- Changing favorite records or migrating data beyond a verified schema correction required by the current query.
