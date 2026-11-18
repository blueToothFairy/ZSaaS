# Technical Design

- **ID:** `iss-004`
- **Date:** Nov 16, 2026
- **Title:** Add a Music Taste Wizard to New User Onboarding
- **Branch:** `feat/iss-004-music-taste-onboarding`

> Implementation plan: [./iss-004-plan.md](iss-004-plan.md)

## 1) Overview

### Context

VibeTune now has first-party email and Google authentication and a Music Taste profile used by personalized recommendations. New users can currently reach the product without being guided to configure their preferences.

### Problem

Without an explicit music taste profile, personalized recommendations cannot reflect what a new user likes. The preference API and profile UI already exist, but onboarding does not lead users through setup.

### Proposed Direction

After a new account successfully registers or completes Google sign-in, route the user to a short, multi-step Music Taste wizard. Reuse the existing Music Taste profile API, genre options, validation rules, and profile editor. Save the completed profile through the existing authenticated endpoint, then send the user to the normal home experience. Existing users and ordinary sign-ins should not be sent through onboarding again.

The wizard should explain that users can refine their choices later in Profile. It should use the same working preference controls as Profile, including selectable genre and language menus, removable selection tags, and functional add/remove actions. It should support the existing qualification threshold of two preferred genres or three usable favorite tracks. Users may leave setup and return later; the existing recommendation setup-required state remains the fallback until the profile qualifies.

## 2) Goals and Non-Goals

### Goals

- New accounts are directed to Music Taste setup immediately after successful registration or first Google sign-in.
- Collect enough explicit preferences for recommendations: at least two preferred genres or three favorite tracks.
- Persist preferences using the existing profile API and authenticated user identity.
- Give Profile and the onboarding wizard usable genre/language selection controls and working add/remove actions.
- Keep selected values visible as removable tags and make profile save status clear.
- Allow users to skip or leave setup and complete it later in Profile.
- Keep returning-user sign-in and profile editing behavior unchanged.
- Make the wizard usable on mobile and with keyboard and screen readers.

### Non-Goals

- New preference tables, endpoints, or recommendation logic.
- Automatic or inferred preferences from activity, favorites, or uploaded images.
- Replacing the existing Profile music taste editor.
- Changing recommendation ranking or the backend qualification threshold.
- Blocking account creation or preventing users from entering the app when they skip setup.

## 3) Existing Architecture and Integration Points

### Frontend

- First-party authentication and new-account routing live in the `saas-platform/src/app` auth and sign-up flows.
- The home experience is in `saas-platform/src/app/home/page.tsx`.
- Profile UI and authenticated API access should be reused for reading and saving music taste.
- Use the existing auth provider's user/session state to distinguish a newly created account from an ordinary returning-user sign-in. Do not infer new-user status from a missing preference profile alone, since existing users may also have no preferences.

### Backend

- The existing `backend/src/modules/profile` music taste module owns preference validation, storage, genre options, and recommendation qualification.
- Its authenticated endpoints scope all operations to the access-token user ID; the wizard must not send a user ID.
- Existing rules qualify a profile with at least two preferred genres or three usable favorite tracks. The backend remains authoritative.

### Profile UI

The current Profile section is rendered in `saas-platform/src/app/home/page.tsx`. It uses a browser `datalist` for genres and comma-separated language text, which does not provide the requested selectable, tag-based interaction. Artist and track catalog searches currently use buttons labeled “Search”; preference additions are handled separately or through result selection. This issue must improve the existing Profile UI as well as onboarding, and the wizard must reuse the improved controls/behavior instead of keeping a second, inconsistent implementation.

## 4) User Flow and Behavior

1. A user registers with email/password or completes Google sign-in and the backend confirms that a new account was created.
2. The frontend establishes the first-party session and navigates to the Music Taste wizard.
3. The wizard loads available genres and the current music taste profile using existing APIs.
4. The user selects preferred genres and optionally adds artists, tracks, disliked genres/artists, language, or vocal preference supported by the existing profile UI/API.
5. The wizard shows whether the selections meet the recommendation threshold. It may save an incomplete profile, but clearly explains that recommendations become personalized once the threshold is met.
6. On successful save, the wizard navigates to the home experience. A user can skip or exit at any step and later continue from Profile.
7. Existing users signing in continue to the normal post-login destination. Direct visits to the wizard for an existing account load and edit their saved profile.

Authentication callback/return URLs must continue to use the existing allow-listed redirect handling. Avoid adding a second auth state or duplicating preference state outside the wizard/profile components.

## 5) Profile Music Taste Interaction Requirements

- Activating the genre field opens a styled, keyboard-accessible list of `availableGenres`. Selecting a genre adds a visible tag in the field. Each tag has an accessible remove (`×`) control; selected genres are not offered as duplicates.
- Preferred languages use the same menu-and-tag interaction. Provide a maintained option list in the UI and a clear way to add a language if the list is not exhaustive. Selected languages appear as removable tags and serialize to the existing `preferredLanguages: string[]` API field.
- Preferred and disliked genre actions both work. The user chooses sentiment and adds the selected genre; additions update the selected preferences immediately, and removal updates state. Disliked genres retain the existing optional hard-exclusion behavior.
- Favorite artist and favorite track catalog lookup remains available, but action buttons are labeled “Add artist” and “Add track”. Choosing a catalog result adds it to the profile; show results clearly and let the user select the intended item.
- All controls show selected values, handle duplicates/conflicts clearly, display validation/API errors, and persist through the existing Save action. Show loading and success/error feedback.
- Apply the same selection, add/remove, validation, and save behaviors to the onboarding wizard. Wizard completion saves through the existing profile endpoint; reopening Profile or the wizard loads saved values.

## 5) Requirements and Constraints

### Functional

- Trigger onboarding only for a newly created account, for both email/password registration and first Google sign-in.
- Do not trigger onboarding for returning users, including users without a completed taste profile.
- Use existing genre options and profile save/read APIs.
- Preserve all existing preference validation and qualification rules.
- Save errors remain visible and retain the user's current selections for retry.
- Skip/exit remains possible; a skipped user can reopen setup from Profile.
- Profile genre selection opens an attractive, usable list; selected genres appear as removable tags.
- Preferred language selection uses the same menu-and-removable-tag interaction and persists as the existing string array.
- Preferred/disliked add actions update selected preferences; duplicate/conflicting values are handled clearly and removal works.
- Favorite artist/track buttons use “Add artist” / “Add track” labels and add the selected catalog item to the taste profile.
- The wizard uses the same functional controls and save behavior as Profile, and reopening either surface shows persisted values.

### Non-Functional

- No backend schema or endpoint changes. Add a backward-compatible `isNewUser` flag to successful registration responses so the frontend can choose onboarding safely.
- Reuse existing auth, profile, and UI conventions; add only the wizard-specific UI/state needed.
- Provide loading, empty, validation, save, success, and error states.
- Support responsive layout, visible focus, labels, and keyboard navigation.

### Constraints / Assumptions

- The profile module and `MusicTasteProfile` contract already expose preferences, available genres, language/vocal settings, and qualification status. Preferred languages are strings; the UI submits selected strings as an array.
- Authentication currently returns or can reliably expose whether account creation occurred. If Google callback currently erases that distinction, pass a narrowly scoped, validated onboarding destination through the existing OAuth state/return flow; do not rely on an untrusted query parameter.
- The existing recommendation flow already handles users whose taste profile is not yet qualified.
- Database changes are manual SQL, but this feature requires none.

## 6) Data and API Changes

No schema or endpoint changes. The wizard reads and writes through existing authenticated Music Taste endpoints. Successful registration responses include `isNewUser: true`; Google OAuth redirects new accounts to onboarding based on the backend's account-creation result. Existing preference storage remains separate from saved Favorites.

## 7) Planned File Changes

Expected areas to inspect and modify:

- First-party registration success handling and Google OAuth return handling under `saas-platform/src/app`.
- A dedicated onboarding route/page and wizard component under `saas-platform/src/app` or the existing profile feature, following current frontend conventions.
- `saas-platform/src/app/home/page.tsx` or extracted shared music taste controls for Profile genre/language selectors, removable tags, add actions, and artist/track labels.
- Existing music taste API client/profile components, only where shared behavior needs extraction or reuse.
- Backend auth callback/registration response only if the current contract cannot distinguish newly created accounts safely; keep any change minimal and avoid schema changes.

Exact filenames should be confirmed against the current working tree before implementation. No migration, new backend module, or recommendation-engine change is expected.

## 8) Risks and Rollback

| Risk | Mitigation |
| --- | --- |
| OAuth callback loses new-account status | Carry a server-validated onboarding destination through the existing OAuth state/session flow; test new and returning Google accounts. |
| Returning users are mistakenly sent to setup | Decide from account-creation outcome, not profile completeness; cover both registration and login paths. |
| User selections are lost on API failure | Keep form state and show a retryable error. |
| Users skip setup and receive generic recommendations | Preserve the existing setup-required guidance and make Profile setup easy to reopen. |
| Wizard and Profile behave differently | Use shared preference controls and the same save/load API path; verify saved values in both directions. |
| Genre/language controls appear selectable but do not update persisted profile | Verify selection, tag removal, save, reload, and wizard-to-Profile round trips against the existing endpoint. |

Rollback by reverting the onboarding route and post-auth navigation changes. Existing music taste data and endpoints remain unaffected.

## 9) Open Questions

None. Initial scope uses an optional, resumable wizard and the existing recommendation qualification threshold.

## 10) References

- `saas-platform/src/app/auth-provider.tsx` — first-party session restoration and auth state.
- `saas-platform/src/app/sign-up/` — email registration flow (confirm exact files during implementation).
- `saas-platform/src/app/home/page.tsx` — authenticated home and current Profile music taste controls.
- `backend/src/modules/profile/dto/music-taste.dto.ts` — music taste API contract.
- `backend/src/modules/profile/services/music-taste.service.ts` — validation and qualification rules.
- `backend/src/modules/profile/profile.route.ts` — authenticated profile routes.
- `development-plan/sprint-2/iss-002-design.md` — personalized recommendations and taste profile requirements.
