# Technical Design

- **ID:** `iss-006`
- **Date:** Nov 17, 2026
- **Title:** Fix Favorites Loading and Profile Account Controls
- **Branch:** `fix/iss-006-favorites-profile`

> Implementation plan: [./iss-006-plan.md](iss-006-plan.md)

## 1) Overview

### Context

On dashboard entry, the frontend request for `/api/profile/favorites` receives HTTP 500 and displays a failed-to-fetch error. In Profile, both account-linking actions are shown regardless of how the user signed in. In Music Taste, “Add artist” and “Add track” share the same button style, and the track search button is labeled “Add track” even though selecting a search result performs the add.

### Root Cause and Evidence

The configured database connection succeeds, but `public.favorites` was absent while `public.user_profiles` existed. The repository query therefore failed because its table did not exist. The checked-in initial schema defines the table, but that schema had not been applied to this database. The fix is an idempotent forward migration that creates the expected table without replacing existing records.

The Profile component currently renders both actions unconditionally. The frontend auth user contains identity fields only, so the UI has no account-method state to make the choice. Track search and artist add buttons both use the same `buttonClass`.

### Proposed

1. Add and apply an idempotent migration creating the missing Favorites table. Keep the endpoint contract and user-scoped query intact; do not expose database details in production.
2. Expose the signed-in account's linked methods to the frontend from the existing first-party auth/session flow. Show one relevant action: Google accounts can add a password; password accounts can link Google. If an account has both methods, show neither linking action. Do not infer linkage from the email address.
3. Give “Add artist” a distinct button treatment and rename the track-search action “Search track”.

### Goals

- Favorites loads successfully for a valid configured database and presents a useful empty state when the user has no favorites.
- Profile shows the appropriate account-linking action based on linked sign-in methods.
- Music Taste clearly distinguishes adding an artist from searching the track catalog.

### Non-Goals

- Changing favorites ownership, API response shape, music taste data, or sign-in/linking semantics.
- Automatically linking accounts that share an email address.
- Replacing the favorites database or adding a new auth provider.

## 2) Requirements and Constraints

### Functional

- `GET /api/profile/favorites` returns the existing success envelope and an empty list for a user with no saved tracks.
- Database failures remain HTTP 500 and are diagnosable from server-side logs; internal SQL or credentials are not exposed to production clients.
- Profile chooses its account action from authoritative linked-method data.
- “Search track” invokes the existing catalog search; “Add artist” retains the current artist-preference behavior.

### Constraints / Assumptions

- Favorites repository currently queries `favorites` using `user_id` and `is_deleted` and maps stored track fields.
- The supplied browser response alone cannot establish whether the 500 is caused by a missing table/column, database connectivity, or another query error.
- Auth state must come from the backend session/account source; email-domain or matching-email guesses are not reliable evidence of linked providers.

## 3) Architecture and Integration Points

- `backend/migrations/mig-003-favorites.sql` — add the missing Favorites table safely for databases where the initial schema was not applied.
- `backend/src/modules/profile/profile.controller.ts` and `repositories/favorites.knex.ts` — retain the existing error handling and query; the repository now has its expected table.
- `backend/src/modules/profile/services/favorites.service.ts` — retain the existing user-scoped fetch and response behavior unless diagnosis requires a focused adjustment.
- `saas-platform/src/app/auth-provider.tsx` and the backend auth refresh/session implementation — add or expose linked sign-in methods in the existing authenticated user contract.
- `saas-platform/src/app/home/page.tsx` and `home/components/profile-tab.tsx` — pass method state and render only the eligible action.
- `saas-platform/src/app/components/music-taste-editor.tsx` — distinguish the artist action visually and relabel track search.

## 4) Data Model and API Changes

- Add the `public.favorites` table with the fields expected by the existing repository. The migration uses `CREATE TABLE IF NOT EXISTS`, so it is safe to rerun and leaves existing favorite rows untouched.
- No new endpoint is expected. Extend the existing auth user/session response with linked-method information only if the current auth model can provide it authoritatively.

## 5) Risks and Rollback

| Risk | Mitigation |
| --- | --- |
| Guessing at the cause of the 500 leads to an unrelated schema change | Read the backend exception and inspect the actual table before changing schema or repository code. |
| Method state is inferred from an unreliable signal | Return linked methods from the authenticated backend session/account record. |
| A schema fix alters existing user data | Prefer additive/corrective SQL and preserve existing favorite records. |

Rollback by reverting the focused auth contract/UI or repository changes. If a manual schema correction is needed, document a safe reverse operation before applying it.

## 6) Open Questions

- Which authoritative auth record currently tracks password and Google linkage? Reuse it; if absent, define the smallest compatible session/account contract.

## 7) References

- `backend/src/modules/profile/profile.controller.ts` — Favorites error handling.
- `backend/src/modules/profile/repositories/favorites.knex.ts` — expected table fields and query.
- `saas-platform/src/app/home/page.tsx` — Favorites fetch and auth state usage.
- `saas-platform/src/app/home/components/profile-tab.tsx` — account actions.
- `saas-platform/src/app/components/music-taste-editor.tsx` — artist and track controls.
