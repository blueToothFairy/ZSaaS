# Implementation Plan

- **ID:** `iss-007`
- **Date:** Nov 17, 2026
- **Title:** Complete Sign-up, Password Recovery, and Music Taste Onboarding
- **Design:** [./iss-007-design.md](iss-007-design.md)
- **Scope:** Add signup password confirmation, secure first-party password recovery, and align onboarding wizard styling with the current public theme.

## 1) Objective

Close the sign-up and sign-in usability gaps and make the onboarding wizard visually consistent without changing existing account or music-taste behavior.

## 2) Tasks

### Task 1 — Confirm Password at Sign-up

- [x] Add confirmation state and a required confirm-password field with `autoComplete="new-password"`.
- [x] Validate equality before calling `register`; show a clear inline error and retain entered values when they differ.
- [x] Keep the backend's existing 10–128 character password rules authoritative.
- [x] Match existing auth field styling and accessible error semantics.

**Expected result:** Registration cannot start unless both password values match.

### Task 2 — Implement Password Recovery

- [x] Configure the Resend API key. The user confirmed it has been added; its environment file/value was not inspected. Sender `VibeTune <noreply@mail.vibetune.ai>` is set in code.
- [x] Build reset links from the frontend base URL configured for the active environment.
- [x] Add an idempotent SQL migration for hashed, expiring, single-use reset tokens.
- [x] Add a generic recovery request endpoint that does not reveal whether an account exists or uses a password, including through response timing.
- [x] Generate a high-entropy token, store only its hash, and email the raw token in a time-limited reset link.
- [x] Add a reset endpoint that validates the token, enforces the existing password policy, updates the credential atomically, and consumes/invalidate tokens.
- [x] Ensure reset requests do not add password credentials to Google-only accounts; do not log tokens or reset URLs.
- [x] Add a recovery request page and reset page; handle success, invalid/expired links, loading, and retry states.
- [x] Link the sign-in page to recovery and preserve existing sign-in errors and navigation.

**Expected result:** Password users can securely recover access without account enumeration or token reuse.

### Task 3 — Align Onboarding Theme

- [x] Restyle the onboarding page shell to use the auth theme's paper background, ink, blue, and acid accents.
- [x] Add wizard-scoped styles for editor panels, fields, menus, selection chips, progress, status/error messages, and actions.
- [x] Preserve clear contrast, responsive layout, keyboard focus, disabled states, and loading feedback.
- [x] Keep Profile mode rendering and all Music Taste API/data behavior intact.

**Expected result:** The onboarding flow feels like part of the same VibeTune experience as the public auth pages.

### Task 4 — Review and Verify

- [x] Verify the generic recovery response and token lifecycle after applying `mig-004-password-reset.sql`; real email delivery was not smoke-tested to avoid sending email.
- [x] Verify mismatched confirmation is checked before registration; matching values preserve the current registration flow.
- [ ] Review wizard and Profile modes at narrow and wide layouts in a browser.
- [x] Review the final diff for unintended API, data, or account-linking changes.

**Verification note:** `mig-004-password-reset.sql` was applied to the configured PostgreSQL database; the table and its primary-key/user indexes were confirmed. A generated unknown address received HTTP 200 with the generic recovery response, and a well-formed unknown token received HTTP 400. Disposable integration records confirmed reset success, one-time use, expiry rejection, new-password login, refresh-session revocation, and no token issuance for Google-only accounts; the records were removed afterward. Frontend TypeScript and focused backend auth TypeScript checks pass. ESLint reports 0 errors and 1 existing `<img>` warning. `git diff --check` passes. Production frontend build remains blocked by unavailable Google Fonts network access; full backend TypeScript compilation still reports two existing mock errors in `recommendation.integration.test.ts`. Real Resend delivery and browser-based UI review were not performed.

## 3) Acceptance Criteria

- Sign-up requires matching password and confirmation values before registration.
- Sign-in provides a working password recovery entry point.
- Recovery requests return a generic response that does not disclose account existence or linked methods.
- Reset links expire, are single-use, and update only an existing password credential using the current password policy.
- Reset tokens are generated securely, stored as hashes, and excluded from logs.
- The onboarding wizard uses the current public theme across its full flow and remains accessible and responsive.
- Profile music-taste presentation and existing API/data behavior remain intact.

## 4) Out of Scope

- Google OAuth changes, account auto-linking, password-policy changes, or general auth redesign.
- Redesigning Profile mode or changing music preference data/API contracts.
- Production activation still depends on the Resend API key and frontend base URL being configured in each environment.
