# Technical Design

- **ID:** `iss-009`
- **Date:** Nov 18, 2026
- **Title:** Refresh expired access tokens and retry authenticated requests
- **Branch:** `feat/iss-009-auth-token-refresh`

> Implementation plan: [./iss-009-plan.md](iss-009-plan.md)

## 1) Overview

### Context

The backend rejects an expired access token with `401 Authentication required`. The frontend refreshes the session at startup, but authenticated API calls do not refresh and retry after a later `401`. As a result, an active user can be interrupted when the short-lived access token expires.

### Proposed

Add one shared authenticated-request path for frontend API calls. It sends the current access token, and on the first `401` calls the existing `POST /api/auth/refresh` endpoint with same-origin credentials. On refresh success, update the shared session token and retry the original request once with the new token. If refresh fails, clear the local session and let the existing UI handle the authentication failure.

Concurrent requests that receive `401` at the same time should share one refresh operation. Do not retry non-401 failures or retry a request more than once.

### Goals

- Keep authenticated API actions working across access-token expiry when the refresh cookie is valid.
- Prevent concurrent `401` responses from rotating the same refresh cookie multiple times.
- Preserve existing login, startup session restoration, logout, and refresh-token rotation behavior.
- Keep the server API and token storage model unchanged.

### Non-Goals

- Changing backend token lifetimes, refresh-token rules, or endpoint responses.
- Refreshing public/unauthenticated requests.
- Retrying failed requests for network errors, `403`, or server errors.
- Adding a dependency or persisting access tokens in browser storage.

## 2) Requirements and Constraints

- Refresh requests use `credentials: 'same-origin'` so the HttpOnly refresh cookie is sent.
- A request is retried at most once; a second `401` is returned to its caller.
- A failed refresh clears the in-memory token and user state and transitions the provider to a signed-out state.
- Preserve the original method, URL, body, and relevant headers when retrying, including multipart uploads.
- Avoid replaying a consumed request body; the shared request layer must retain a replayable request description or use a supported Axios retry configuration.
- Keep refresh-cookie rotation serialized through a shared in-flight promise.

## 3) Architecture and Components

- `saas-platform/src/app/auth-provider.tsx` - own refresh coordination and session update/clear behavior; expose the authenticated request operation through the auth context.
- `saas-platform/src/app/home/page.tsx` - route favorites and Vibe Scan authenticated calls through the shared operation.
- `saas-platform/src/app/components/music-taste-editor.tsx` - route music-taste and song-search authenticated calls through the shared operation.
- Audit remaining frontend calls carrying `Authorization: Bearer` and route them through the same operation.

**Request flow:**

```text
Authenticated request with current access token
  - Success or non-401: return response
  - First 401: call shared POST /api/auth/refresh
      - Success: update in-memory session and retry once
      - Failure: clear session and return an authentication failure
```

## 4) Data, APIs, and Security

No database or backend API changes. Reuse the existing refresh endpoint and HttpOnly `vt_refresh` cookie. The access token remains in memory and is sent only in the Authorization header to authenticated API routes.

## 5) Risks and Rollback

| Risk | Mitigation |
| --- | --- |
| Several simultaneous `401`s could rotate one refresh token more than once and trigger replay protection. | Share one in-flight refresh promise across requests. |
| Retrying a consumed upload body could fail or send incomplete data. | Keep request bodies replayable and verify multipart requests preserve their payload. |
| Refresh failure could leave the UI showing a stale signed-in user. | Clear both cached token and user through the provider's existing session synchronization path. |

Rollback by reverting the shared authenticated-request flow and its call-site changes. No data cleanup is needed.

## 6) References

- `backend/src/shared/middleware/requireAccessToken.ts` - expired access tokens are rejected with 401.
- `backend/src/modules/auth/auth.route.ts` - existing `POST /api/auth/refresh` route.
- `backend/src/modules/auth/auth.controller.ts` - refresh returns a new access token and rotates the refresh cookie.
- `saas-platform/src/app/auth-provider.tsx` - startup refresh and in-memory session state.
- `saas-platform/src/app/home/page.tsx` and `saas-platform/src/app/components/music-taste-editor.tsx` - authenticated API call sites.
