# Implementation Plan

- **ID:** `iss-009`
- **Date:** Nov 18, 2026
- **Title:** Refresh expired access tokens and retry authenticated requests
- **Design:** [./iss-009-design.md](iss-009-design.md)
- **Scope:** Refresh once after an authenticated request receives 401, then retry that request once.

## 1) Objective

Keep a user's authenticated actions working when the access token expires, provided the refresh session is still valid.

## 2) Tasks

### Task 1 - Add Shared Refresh and Retry Handling

- [x] Add an authenticated request operation to the auth provider or a small shared frontend helper.
- [x] On the first `401`, call the existing refresh endpoint with same-origin credentials.
- [x] Share one in-flight refresh promise among concurrent failed requests.
- [x] Update the in-memory access token and user state from a successful refresh response.
- [x] Retry the original request once with the new access token; preserve method, body, and headers.
- [x] On refresh failure, clear the in-memory session and return an authentication failure without looping.

**Expected result:** One expired access token causes at most one coordinated refresh and one retry per request.

### Task 2 - Route Authenticated Calls Through the Shared Operation

- [x] Migrate favorites and Vibe Scan calls in `saas-platform/src/app/home/page.tsx`.
- [x] Migrate music-taste and song-search calls in `saas-platform/src/app/components/music-taste-editor.tsx`.
- [x] Search for and migrate any other frontend API calls that manually set a Bearer token.
- [x] Leave public calls and auth endpoints such as login, logout, and refresh outside the retry path.

**Expected result:** All authenticated frontend API calls use the same expiry handling.

### Task 3 - Verify Session and Request Behavior

- [x] Test that an accepted access token sends one request without refreshing.
- [x] Test that a 401 refreshes and retries once with the new token.
- [x] Test that concurrent 401 responses share one refresh call.
- [x] Test that refresh failure clears the session and does not retry.
- [x] Test that a missing access token does not send a request or trigger refresh.
- [x] Test that non-401 errors do not refresh and a second 401 does not loop.
- [x] Test that a multipart request can reuse its `FormData` body on retry.

**Expected result:** Token expiry is handled consistently without duplicate refresh rotation or request-body loss.

## 3) Acceptance Criteria

- Authenticated requests retry once after a `401` if refresh succeeds.
- Simultaneous `401` responses cause only one refresh operation.
- Refresh failure clears the in-memory user and access token.
- Requests are never retried more than once, and non-401 responses do not trigger refresh.
- Authenticated API call sites use the shared operation; public and auth flows retain current behavior.
- Multipart uploads remain valid after a retry.
- No backend, schema, dependency, or browser-storage changes are introduced.

## 4) Out of Scope

- Backend refresh-token policy or access-token lifetime changes.
- Automatic retry for network failures, rate limits, or server errors.
- Persisting access tokens across page reloads.
