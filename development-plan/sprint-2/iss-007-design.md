# Technical Design

- **ID:** `iss-007`
- **Date:** Nov 17, 2026
- **Title:** Complete Sign-up, Password Recovery, and Music Taste Onboarding
- **Branch:** `feat/iss-007-auth-onboarding-polish`

> Implementation plan: [./iss-007-plan.md](iss-007-plan.md)

## 1) Overview

### Context

The email sign-up form accepts a password without asking the user to confirm it. The sign-in page has no password recovery path. The onboarding Music Taste wizard uses a dark slate and sky palette, while the public/auth experience uses a warm paper background, black ink, acid yellow, and blue accents.

### Root Cause

The sign-up form has only a password state and field. First-party authentication supports registration and login, but has no password-reset endpoint, token store, or email delivery flow. The onboarding page and shared `MusicTasteEditor` wizard styles are hard-coded to the older dark palette.

### Proposed

1. Add a confirm-password field and block submission unless both values match. Keep server-side password validation authoritative.
2. Add a password recovery request and reset flow to first-party auth. Use single-use, expiring reset tokens stored as hashes; return the same confirmation for known and unknown emails. Send the link through a configured email delivery provider. A Google-only account must not gain a password through recovery; it can use the existing account-linking flow after signing in.
3. Restyle the onboarding shell and wizard-only controls to use the existing auth theme tokens and visual language. Keep the Profile editor's current presentation unless the shared component needs narrowly scoped wizard styles.

### Goals

- Users must confirm a matching password before creating an account.
- Password users can request a reset and set a new password through a secure, single-use link.
- Recovery responses do not reveal whether an email has an account.
- Onboarding looks consistent with VibeTune's paper, ink, acid, and blue theme while remaining readable and responsive.

### Non-Goals

- Changing Google sign-in, account linking, password policy, or the authenticated session model beyond revoking sessions after a reset if supported safely.
- Redesigning the Profile music-taste editor or changing its API and saved data.
- Adding password visibility controls or unrelated authentication changes.

## 2) Requirements and Constraints

### Functional

- Confirm password is required, uses a new-password autocomplete value, and prevents submission on mismatch.
- Sign-in links to a recovery request page; the request page submits an email and displays a non-enumerating confirmation.
- A valid reset token can be used once before expiry. Invalid, expired, and consumed tokens cannot change credentials.
- Reset applies only to accounts with password credentials. The response to a recovery request remains generic for every email.
- The onboarding theme covers loading/error states, wizard panels, inputs, dropdowns, chips, progress, and actions, including visible keyboard focus.

### Constraints / Assumptions

- Authentication is first-party in `backend/src/modules/auth`; no external auth reset provider is in use.
- Use Resend for transactional email with sender `VibeTune <noreply@mail.vibetune.ai>`. Configure its API key per environment before enabling recovery; do not log reset URLs or tokens.
- Build reset links from the frontend base URL configured for the current environment; do not hard-code a production origin.
- Existing password policy is 10–128 characters.
- `MusicTasteEditor` is shared by onboarding and Profile, so wizard-specific theme changes must not unintentionally restyle Profile mode.

## 3) Architecture and Integration Points

- `saas-platform/src/app/sign-up/[[...sign-up]]/page.tsx` — confirmation state, field, and client-side match validation.
- `saas-platform/src/app/sign-in/[[...sign-in]]/page.tsx` — link to recovery.
- `saas-platform/src/app/forgot-password/page.tsx` and `reset-password/page.tsx` — request and token completion screens, using the existing auth page styling.
- `saas-platform/src/app/auth-pages.module.css` — add only reusable styles required by recovery screens if needed.
- `backend/src/modules/auth/auth.route.ts`, `auth.controller.ts`, `auth.service.ts`, auth interfaces/repository — request and consume recovery tokens; validate inputs and keep generic request responses.
- `backend/migrations/` — add an idempotent password-reset-token table (token hash, user ID, expiry, consumed/created timestamps), following current manual SQL migration conventions.
- `saas-platform/src/app/onboarding/music-taste/page.tsx` — replace hard-coded dark page shell with the existing auth theme.
- `saas-platform/src/app/components/music-taste-editor.tsx` — scope onboarding styles to `mode="wizard"`; preserve data operations and Profile mode.

## 4) Data Model and APIs

- Add a password reset token table with a unique token hash, user foreign key, expiry, creation timestamp, and consumed timestamp (or equivalent single-use state). Store only a cryptographic hash of the random token.
- Add `POST /api/auth/password/forgot` accepting an email and always returning the same success message and status.
- Add `POST /api/auth/password/reset` accepting a token and new password. Validate expiry and single-use status transactionally, update the password hash, and consume the token. Invalidate other outstanding reset tokens for that user.
- Keep registration and login request contracts unchanged. Email delivery is an internal service responsibility, not a new public API contract.

## 5) Security and Risks

| Risk | Mitigation |
| --- | --- |
| Account enumeration through recovery | Return identical status and message regardless of email existence or account method. |
| Leaked or replayed reset link | Generate high-entropy random tokens, store only hashes, enforce expiry and one-time consumption, and avoid logging token material. |
| Email delivery is unavailable or misconfigured | Gate production recovery on configured delivery; report delivery failures internally without changing the generic public response. |
| A reset weakens Google-only account security | Require an existing password credential; recovery never creates a new password credential. |
| Shared editor changes alter Profile styling | Apply theme changes conditionally to wizard mode and preserve profile mode behavior. |

Rollback by reverting the UI/API changes. Retain the additive token table during rollback unless outstanding tokens are first invalidated; dropping it is a separate data operation.

## 6) Configuration Decisions

- **Email delivery:** Resend, from `VibeTune <noreply@mail.vibetune.ai>`. Store the Resend API key in the environment's secret configuration.
- **Reset-link origin:** Use the frontend base URL configured for the active environment so links return to the matching deployment.

## 7) References

- `saas-platform/src/app/auth-pages.module.css` — current public auth theme.
- `saas-platform/src/app/sign-up/[[...sign-up]]/page.tsx` and `sign-in/[[...sign-in]]/page.tsx` — current auth forms.
- `backend/src/modules/auth/auth.service.ts` — password hashing, policy, and first-party auth behavior.
- `backend/src/modules/auth/auth.route.ts` — auth route registration.
- `saas-platform/src/app/onboarding/music-taste/page.tsx` — dark onboarding shell.
- `saas-platform/src/app/components/music-taste-editor.tsx` — shared wizard/profile UI.
