# Implementation Plan

- **ID:** `iss-004`
- **Date:** Nov 16, 2026
- **Title:** Add a Music Taste Wizard to New User Onboarding
- **Design:** [./iss-004-design.md](iss-004-design.md)
- **Scope:** Route newly created accounts through an optional, resumable Music Taste wizard and repair Profile music taste controls, reusing existing profile APIs.

## 1) Objective

Help new VibeTune users configure explicit music preferences immediately after account creation, so personalized recommendations can reflect their taste. Make the existing Profile taste controls work as requested and share their behavior with the wizard. Preserve existing sign-in behavior and let users finish setup later if they skip.

## 2) Tasks

### Task 1 — Audit Authentication and Music Taste Flows

- [x] Inspect the current working tree and identify registration, Google callback, session establishment, and post-auth navigation paths.
- [x] Determine how registration and Google sign-in distinguish newly created accounts from returning accounts.
- [x] Inspect the current Profile music taste UI and API client; record which preference types and fields are already supported.
- [x] Confirm the existing recommendation setup-required behavior for an incomplete profile.

**Expected result:** An implementation map with the exact files and reusable components/APIs.

### Task 2 — Add Reliable New-Account Routing

- [x] Route successful email/password registration to the Music Taste wizard after the first-party session is ready.
- [x] Route first-time Google account creation to the wizard using the existing validated OAuth state/return mechanism.
- [x] Keep returning email and Google users on their normal post-login destination.
- [x] Preserve safe redirect allow-list behavior and avoid using profile completeness as the new-user signal.

### Task 3 — Build the Wizard

- [x] Add a short, responsive, accessible wizard using the same music taste controls and interaction behavior as Profile.
- [x] Load available genres and any existing taste profile through current endpoints.
- [x] Collect explicit preferences supported by the existing API; make preferred genres the primary setup step.
- [x] Explain the recommendation threshold: two preferred genres or three usable favorite tracks.
- [x] Support saving preferences, clear progress/back/continue controls, and a skip/exit path.
- [x] On successful completion, navigate to the normal home experience; on failure, retain selections and allow retry.

### Task 4 — Repair Profile Music Taste Controls

- [x] Replace the genre `datalist` with a styled, keyboard-accessible options menu that opens when the user activates the field.
- [x] Add selected genres as visible tags in/next to the field, with an accessible `×` removal control; prevent duplicate selections.
- [x] Replace comma-separated preferred-language entry with a matching selectable menu and removable tags; serialize selected languages to the existing string-array field.
- [x] Make “Add preferred” and “Add disliked” genre actions reliably add the selected genre and update displayed preferences; preserve disliked hard-exclusion controls.
- [x] Rename artist and track action buttons to “Add artist” and “Add track”; ensure choosing a catalog result adds it to the preference list. Keep search results clear and selectable.
- [x] Ensure all additions/removals update form state and the existing Save action persists the complete profile. Show loading, success, and error feedback without discarding selections.
- [x] Reuse these controls and behaviors in the onboarding wizard rather than implementing a separate version.

### Task 5 — Support Resuming and Editing

- [x] Make the wizard route safe to revisit and prepopulate it from the saved profile.
- [x] Provide an obvious way to reopen or finish setup from the existing Profile area.
- [x] Preserve the existing setup-required recommendation guidance for incomplete profiles.

### Task 6 — Review and Verify

- [x] Verify new email registration opens the wizard after session establishment.
- [x] Verify first-time Google registration opens the wizard and returning Google sign-in does not.
- [x] Verify returning email sign-in does not open the wizard, including when preferences are absent.
- [x] Verify preference save, retry after failure, skip, revisit, and completed-profile qualification.
- [x] In Profile, verify genre menu open/select/tag/remove and language menu select/tag/remove.
- [x] Verify preferred/disliked genre additions, duplicate/conflict handling, artist/track catalog selection, and the “Add artist” / “Add track” labels.
- [x] Save Profile changes, reload, and confirm tags and preference chips match persisted data.
- [x] Complete or skip the wizard, then verify saved values are visible/editable in Profile and changes persist when either surface is reopened.
- [x] Verify responsive layout, keyboard operation, labels, and focus behavior.
- [x] Run the applicable frontend lint/build checks and backend checks only if backend auth contracts changed.

## 3) Acceptance Criteria

- A newly registered email user and a first-time Google user land in Music Taste setup after authentication succeeds.
- Returning users continue to their normal destination regardless of whether they have music preferences.
- The wizard persists selections using the existing authenticated profile API and displays server validation/save errors clearly.
- Profile genre and preferred-language fields offer styled selectable lists and show selections as removable tags.
- Preferred/disliked add actions and preference removal work; artist/track actions are labeled “Add artist” / “Add track” and selected catalog results are added.
- Profile and wizard share selection behavior; values saved in either surface load correctly in the other after navigation/reload.
- A profile meeting the existing threshold is recognized as qualified; the backend remains authoritative.
- Users can skip setup, reach the product, and later resume from Profile.
- Existing Favorites behavior and music taste data contracts remain unchanged.
- No database migration or new preference endpoint is introduced.
- Registration adds only a backward-compatible new-account indicator; existing login responses remain unchanged.

## 4) Out of Scope

- Changing music taste qualification or recommendation ranking.
- Inferring preferences from listening behavior, uploads, or saved Favorites.
- New database tables, migration scripts, or auth providers.
- Replacing the Profile editor or changing existing-user onboarding policy.
