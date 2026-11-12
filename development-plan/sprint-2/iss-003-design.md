# Technical Design

- **ID:** `iss-003`
- **Date:** Nov 12, 2026
- **Title:** Replace Clerk with First-Party Email and Google Authentication
- **Branch:** `feat/iss-003-first-party-auth`

> Implementation plan: [./iss-003-plan.md](iss-003-plan.md)

## 1) Overview

### Context

VibeTune currently uses Clerk for frontend sign-in and backend request authentication. Protected backend handlers read `req.auth.userId`; the frontend obtains Clerk tokens and sends them as bearer tokens. This couples routing, account identity, API authorization, and user-facing auth pages to Clerk.

### Problem

The product needs its own authentication system with email and password, plus Google sign-in. API access must use short-lived JWT access tokens and renewable refresh tokens, while existing user-owned data remains associated with the correct account.

### Proposed Direction

Replace Clerk with a first-party backend auth module and frontend auth pages. The backend owns account creation, password verification, Google identity verification, token issuance, refresh, logout, and access-token verification. Resolve Google identities by stable provider subject, not email alone. If the identity is already linked, sign in to its existing account. If its verified email matches a password account, require authentication with an existing method and explicit confirmation before linking; never auto-link based only on email. Likewise, password registration with an email already used by a Google account must return an account-exists response rather than create a duplicate; the user must authenticate with Google and explicitly add a password.

Use short-lived signed JWT access tokens for API requests. Store refresh-token hashes in the database, rotate refresh tokens on use, and revoke the prior token. Deliver refresh tokens only in `HttpOnly`, `Secure` (in production), `SameSite` cookies; keep access tokens in frontend memory and send them in the `Authorization: Bearer` header. Do not persist bearer tokens in browser local storage.

Google sign-in should use OAuth 2.0 Authorization Code flow with server-side state validation and verified Google identity claims. The backend validates the callback, resolves an existing provider subject or starts account creation/linking as appropriate, and establishes the same first-party session used by password sign-in. A matching email is a conflict signal, not authorization to link.

## 2) Scope

### In Scope

- Email/password registration, login, refresh, and logout.
- Google OAuth sign-in and safe account resolution.
- Access-token verification middleware and a shared authenticated request type based on the internal user ID.
- Frontend sign-in, sign-up, sign-out, and protected-route behavior without Clerk components or APIs.
- Replace Clerk identity access in protected API handlers and authenticated rate limiting.
- Database schema for users, password credentials, OAuth identities, and refresh sessions (or an equivalent normalized design).
- Start the new auth system with a clean user store; current Clerk users are test accounts and will not be migrated.
- Remove Clerk packages, environment variables, and setup references after replacement is complete.

### Out of Scope

- Multi-factor authentication, passwordless email, account recovery, email verification workflows, and organization/team accounts.
- Social providers other than Google.
- Changing product features or the ownership model of favorites and other user data.
- Building an admin user-management interface.

## 3) Requirements & Constraints

### Functional

- A user can register and sign in with a unique email address and password.
- Google sign-in detects an already-linked identity and signs into its existing account. If only the verified email matches a password account, it requires existing-method authentication and explicit linking.
- Password registration detects an email already used by a Google account and does not create a duplicate; adding a password requires authentication to the existing account and explicit confirmation.
- Protected API routes identify the user from a validated access token, never from a client-supplied user ID.
- A valid refresh session can issue a new access token and rotate its refresh token; logout revokes the session.
- At application startup, the frontend restores authentication through `/api/auth/refresh` before protected-route guards decide whether to render or redirect.
- New accounts receive stable internal IDs used consistently by all user-owned records.

### Security

- Hash passwords with Argon2id (preferred) or a reviewed equivalent; never store raw passwords.
- Keep signing keys, Google client credentials, and token secrets in server environment configuration.
- Use cryptographically random refresh tokens; store only a one-way hash, rotate on refresh, and revoke on reuse or logout.
- Set a short access-token lifetime and a bounded refresh-session lifetime. Define values in configuration and document defaults before implementation.
- Validate JWT signature, issuer, audience, expiry, and subject. Use the internal user ID as `sub`.
- Protect OAuth state against CSRF; validate Google issuer, audience, signature, expiry, and verified email.
- Apply rate limits to registration, login, refresh, and OAuth callback endpoints. Return generic login errors to reduce account enumeration.
- Use HTTPS in production and cookie settings compatible with the deployed frontend/backend origins. Add CSRF protection for cookie-authenticated refresh/logout requests as needed by the chosen SameSite and deployment model.

### Constraints / Assumptions

- Backend uses Express 5, TypeScript ESM, Knex, and PostgreSQL; schema changes are currently applied manually with SQL.
- Frontend uses Next.js App Router. API requests currently use `NEXT_PUBLIC_API_URL` and bearer headers.
- The system has only test users today. Existing Clerk accounts and test-user ownership data do not need to be migrated; the new auth system starts with an empty user store.
- Google OAuth credentials and allowed callback URLs will be supplied through environment configuration.
- Exact token lifetimes, session retention, production origins, and development-data reset behavior must be finalized before deployment.

## 4) Architecture & Components

### Backend

- Add `backend/src/modules/auth/` with controller, service, routes, module wiring, DTOs, and repository following the existing module pattern.
- Add shared access-token middleware that verifies JWTs and attaches a typed `userId` to the request. Replace Clerk middleware and `requireAuth()` usage.
- Use the auth service for password registration/login, Google callback handling, refresh rotation, logout, and session revocation.
- Update authenticated rate limiting and protected handlers to consume the shared internal identity type.
- Keep public endpoints public and preserve route-level authorization behavior.

### Frontend

- Replace Clerk provider, middleware, hooks, and hosted widgets with application sign-in/sign-up flows and an auth state/context layer.
- Keep access tokens in memory. Use credentialed requests where refresh cookies are required; provide one refresh-and-retry path for expired access tokens.
- On application startup, call the refresh endpoint before protected-route guards make an allow/redirect decision. Keep auth state unresolved while refresh is pending, and prevent protected API calls until session restoration succeeds.
- Use the backend OAuth start/callback flow for Google. Return users to an allow-listed frontend destination to prevent open redirects.
- Protect the home/dashboard route based on session state and clear client auth state on logout or refresh failure.

### Data Model (logical)

- `users`: stable internal ID, normalized unique email, timestamps, status.
- `password_credentials`: user ID, password hash, timestamps (optional for Google-only users).
- `oauth_identities`: provider and provider subject, linked user ID, verified email metadata; unique on provider and provider subject.
- `refresh_sessions`: user ID, token hash, expiry, revoked/rotated metadata, creation metadata.

Prefer separate credential and identity tables so a user can use Google, password, or both without duplicate accounts. Enforce a unique normalized email on `users` and a unique `(provider, provider_subject)` on `oauth_identities`. A matching email triggers an account conflict/link flow; it must never silently link identities. Add foreign keys and indexes. Final column names and whether these tables are combined should be settled in implementation SQL.

### Initial User Store

Do not migrate Clerk test accounts or map Clerk IDs to internal IDs. Deploy the new schema with no imported users; users create accounts through the new registration or Google sign-in flow. Existing test-owned rows may be discarded or left inaccessible according to the development database reset procedure. Do not carry test ownership records into the new user store under guessed identities.

## 5) APIs & Interfaces

Proposed public endpoints (final response shapes belong in DTOs):

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an email/password account and establish a session |
| POST | `/api/auth/login` | Verify email/password and establish a session |
| POST | `/api/auth/refresh` | Rotate refresh session and return a new access token |
| POST | `/api/auth/logout` | Revoke the current refresh session and clear its cookie |
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Validate callback and establish a first-party session |
| GET | `/api/auth/me` | Return the current authenticated user's safe profile |

Access-token protected endpoints continue using `Authorization: Bearer <access-token>`. Refresh tokens are not returned in JSON. They are set and cleared as an HttpOnly cookie. Define consistent validation and error responses, including `401` for invalid/expired credentials and `409` for duplicate registration.

## 6) Configuration & Dependencies

- Backend: JWT signing key or key pair, access and refresh lifetimes, Google client ID/secret, OAuth callback URL, frontend return URL allow-list, cookie settings, and production origin configuration.
- Frontend: API base URL and public Google client configuration only if required by the chosen OAuth library.
- Remove Clerk dependencies and `CLERK_*` environment variables from both services after all references are removed.
- Select and pin maintained JWT, password-hashing, and OAuth/client libraries; avoid implementing cryptographic primitives directly.

## 7) Risks & Rollback

| Risk | Mitigation |
| --- | --- |
| Development records still contain test Clerk IDs | Start with an empty user store and clear or isolate test-owned rows; never associate them with new users by email guesswork. |
| Refresh cookie is blocked by cross-origin deployment settings | Confirm production domains, CORS credentials, SameSite, Secure, and CSRF behavior in the deployment environment. |
| Token theft or replay | Short access lifetime, hashed rotating refresh tokens, reuse detection, revocation, and secure cookie handling. |
| Google email matches an existing password account | Do not create a duplicate or attach Google automatically. Require authentication with the existing method and explicit confirmation to link. |
| A user registers with a password using an email already used by Google | Enforce unique normalized email and require authentication to the existing Google account before explicitly adding a password. |
| Startup route guard runs before session restoration | Keep auth state unresolved and wait for the refresh response before rendering or redirecting protected routes. |
| Partial cutover breaks protected features | Roll out schema and middleware first, then switch the frontend; retain a tested rollback window. |

Rollback should restore the previous Clerk configuration and API verification path if needed. Since only test accounts exist, no production identity mapping needs preservation. Revoke newly issued sessions and reset any development data that is incompatible with the restored Clerk setup.

## 8) Open Questions

- What access-token and refresh-session lifetimes meet product and operational needs?
- Which reauthentication UX should be used before explicitly linking Google or adding a password to an existing account?
- What are the production frontend/backend domains and OAuth callback URLs?
- Is email verification required before an email/password account can use protected features? It is excluded from this issue unless product requirements say otherwise.

## 9) References

- `backend/src/app.ts` — Clerk middleware and authenticated route setup.
- `backend/src/shared/middleware/rateLimiting.ts` — Clerk identity used for authenticated rate limits.
- `backend/src/shared/types/ClerkRequest.ts` — current Clerk request contract.
- `backend/src/modules/profile/profile.controller.ts` — user-owned favorites access.
- `backend/src/modules/vibe-scan/vibe.route.ts` — route-level Clerk `requireAuth()`.
- `saas-platform/src/proxy.ts` — Clerk route protection and redirects.
- `saas-platform/src/app/layout.tsx` — Clerk provider.
- `saas-platform/src/app/home/page.tsx` — Clerk token and user hooks.
- `backend/package.json`, `saas-platform/package.json` — Clerk dependencies.
