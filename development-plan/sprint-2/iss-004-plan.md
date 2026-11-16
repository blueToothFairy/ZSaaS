# Implementation Plan

- **ID:** `iss-004`
- **Date:** Nov 16, 2026
- **Title:** Add a Music Taste Wizard to New User Onboarding
- **Design:** [./iss-004-design.md](iss-004-design.md)
- **Scope:** Route newly created accounts through an optional, resumable Music Taste wizard using the existing profile APIs.

## 1) Objective

Help new VibeTune users configure explicit music preferences immediately after account creation, so personalized recommendations can reflect their taste. Preserve existing sign-in behavior and let users finish setup later if they skip.

## 2) Tasks

### Task 1 — Audit Authentication and Music Taste Flows

- [ ] Inspect the current working tree and identify registration, Google callback, session establishment, and post-auth navigation paths.
- [ ] Determine how registration and Google sign-in distinguish newly created accounts from returning accounts.
- [ ] Inspect the current Profile music taste UI and API client; record which preference types and fields are already supported.
- [ ] Confirm the existing recommendation setup-required behavior for an incomplete profile.

**Expected result:** An implementation map with the exact files and reusable components/APIs.

### Task 2 — Add Reliable New-Account Routing

- [ ] Route successful email/password registration to the Music Taste wizard after the first-party session is ready.
- [ ] Route first-time Google account creation to the wizard using the existing validated OAuth state/return mechanism.
- [ ] Keep returning email and Google users on their normal post-login destination.
- [ ] Preserve safe redirect allow-list behavior and avoid using profile completeness as the new-user signal.

### Task 3 — Build the Wizard

- [ ] Add a short, responsive, accessible wizard using the existing app and Profile UI conventions.
- [ ] Load available genres and any existing taste profile through current endpoints.
- [ ] Collect explicit preferences supported by the existing API; make preferred genres the primary setup step.
- [ ] Explain the recommendation threshold: two preferred genres or three usable favorite tracks.
- [ ] Support saving preferences, clear progress/back/continue controls, and a skip/exit path.
- [ ] On successful completion, navigate to the normal home experience; on failure, retain selections and allow retry.

### Task 4 — Support Resuming and Editing

- [ ] Make the wizard route safe to revisit and prepopulate it from the saved profile.
- [ ] Provide an obvious way to reopen or finish setup from the existing Profile area.
- [ ] Verify that incomplete profiles continue to use the existing setup-required recommendation guidance.

### Task 5 — Review and Verify

- [ ] Verify new email registration opens the wizard after session establishment.
- [ ] Verify first-time Google registration opens the wizard and returning Google sign-in does not.
- [ ] Verify returning email sign-in does not open the wizard, including when preferences are absent.
- [ ] Verify preference save, retry after failure, skip, revisit, and completed-profile qualification.
- [ ] Verify responsive layout, keyboard operation, labels, and focus behavior.
- [ ] Run the applicable frontend lint/build checks and backend checks only if backend auth contracts changed.

## 3) Acceptance Criteria

- A newly registered email user and a first-time Google user land in Music Taste setup after authentication succeeds.
- Returning users continue to their normal destination regardless of whether they have music preferences.
- The wizard persists selections using the existing authenticated profile API and displays server validation/save errors clearly.
- A profile meeting the existing threshold is recognized as qualified; the backend remains authoritative.
- Users can skip setup, reach the product, and later resume from Profile.
- Existing Favorites behavior and music taste data contracts remain unchanged.
- No database migration or new preference endpoint is introduced.

## 4) Out of Scope

- Changing music taste qualification or recommendation ranking.
- Inferring preferences from listening behavior, uploads, or saved Favorites.
- New database tables, migration scripts, or auth providers.
- Replacing the Profile editor or changing existing-user onboarding policy.
