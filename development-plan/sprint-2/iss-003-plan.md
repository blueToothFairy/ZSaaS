# Implementation Plan

- **ID:** `iss-003`
- **Date:** Nov 12, 2026
- **Title:** Replace Clerk with First-Party Email and Google Authentication
- **Design:** [./iss-003-design.md](iss-003-design.md)
- **Scope:** Replace Clerk authentication across the frontend and backend with email/password and Google OAuth using JWT access tokens and rotating refresh tokens.

## 1) Objective

Deliver a secure first-party authentication flow that supports email/password and Google sign-in and protects existing API routes. The system currently has only test users; existing `user_profiles` remain auth-disabled, and no user migration or identity mapping is needed.

## 2) Tasks

### Task 1 — Confirm Security and Deployment Decisions

- [x] Inventory active Clerk references, protected routes, and user identity usage.
- [ ] Confirm production domains, Google OAuth callback URLs, secrets, cookie policy, token lifetimes, and the explicit account-linking/reauthentication UX.
- [x] Confirm that current users are test accounts and do not require migration; keep existing test profiles auth-disabled in the new auth system.

### Task 2 — Add Authentication Data Model

- [x] Define password credentials, OAuth identities, and refresh sessions attached to `user_profiles`, with constraints and indexes.
- [x] Prepare SQL schema changes extending `user_profiles`; existing test profiles default to `auth_enabled = false` and are not migrated.
- [x] Confirm existing test profiles are not mapped to new auth accounts; no old test-user migration is needed.

### Task 3 — Implement Backend Authentication

- [x] Add the `auth` backend module using the project pattern: DTOs, interface, Knex repository, service, class controller, route, and module wiring.
- [x] Implement password registration and login with scrypt password hashes and generic credential errors.
- [x] Implement Google Authorization Code flow, signed state validation, and provider-subject identity lookup.
- [x] If the Google identity is already linked, sign in to its existing account. If only the verified email matches a password account, do not create or link an account; require authentication through an existing method and explicit Google-link confirmation.
- [x] If password registration uses an email already owned by a Google account, return an account-exists response instead of creating a duplicate; allow password addition only after authenticating to the existing account and explicitly confirming.
- [x] Add authenticated linking flows that verify the existing session and explicit user intent before adding a Google identity or password credential; reject identity and email conflicts safely.
- [x] Issue signed short-lived access JWTs and HttpOnly refresh cookies; persist only refresh-token hashes.
- [x] Implement refresh rotation, reuse detection, logout/revocation, and `/api/auth/me`.
- [x] Add token verification middleware and typed user identity attachment.
- [x] Replace Clerk identity usage in protected routes, handlers, and authenticated rate limiting.
- [x] Apply rate limits and consistent validation/authentication errors to auth endpoints.

### Task 4 — Implement Frontend Authentication

- [x] Replace Clerk provider, hosted widgets, and hooks with first-party auth UI and session handling; delete the pass-through `src/proxy.ts` because it performed no auth work.
- [x] Add email/password sign-up and sign-in forms plus Google sign-in entry point.
- [x] Keep access tokens in memory; use the refresh cookie to renew sessions and retry eligible API requests once.
- [x] On application startup, call `/api/auth/refresh` and keep auth state unresolved until it succeeds or fails definitively.
- [x] Make protected-route guards wait for startup refresh before rendering protected content or redirecting to sign-in; prevent protected API calls until the access token is restored.
- [x] Clear state on logout or unrecoverable refresh failure.
- [x] Restrict OAuth redirects to the configured frontend origin and show accessible auth errors.

### Task 5 — Initialize the New User Store

- [x] Apply the schema to local PostgreSQL; auth-enabled accounts start empty and the schema extends `user_profiles` without importing test users.
- [x] Leave existing test profile rows auth-disabled; do not backfill identities or ownership.
- [x] Verify a newly registered email account receives an internal ID used by `/api/auth/me` (automated).
- [ ] Verify Google-created accounts and product-owned records use distinct/internal IDs; requires Google OAuth or a dedicated integration fixture.
- [x] Document the cutover and rollback sequence, including session revocation behavior.

### Task 6 — Remove Clerk Integration

- [x] Remove Clerk dependencies and imports from backend and frontend.
- [x] Remove active `CLERK_*` environment variables and replace setup documentation with first-party auth and Google OAuth configuration.
- [x] Search active source/configuration for Clerk-specific code; retain historical issue notes only where they document the completed migration.

### Task 7 — Review and Verify

- [x] Add `backend/scripts/verify-auth.mjs` for registration/login, duplicate and invalid credentials, refresh rotation/reuse, logout, token expiry, protected routes, local CORS/cookies, and Google OAuth start/state-error handling. Run with `npm run verify:auth` when the backend and local PostgreSQL are available; it creates one uniquely named test account. Completing Google sign-in/linking still requires interactive provider consent.

- [x] Verify registration, login, invalid credentials, duplicate email, refresh rotation, refresh-token reuse revocation, and logout with `backend/scripts/verify-auth.mjs` against local PostgreSQL. All scripted checks passed, including cookie attributes, local CORS, valid-token identity, malformed and expired access-token rejection, Google OAuth redirect, and invalid callback state; each run creates one uniquely named account that remains in the database.
- [x] Verify Google OAuth starts at the provider and callbacks with missing code/state or invalid state cookie are rejected.
- [ ] Verify an expired refresh session is rejected.
- [ ] Verify an already-linked Google identity signs into its existing account, while a Google email matching a password account does not auto-link or create a duplicate and requires existing-method authentication plus explicit linking.
- [ ] Verify password registration with an email already used by Google is rejected as a duplicate and requires authenticated, explicit password linking.
- [ ] Verify startup refresh resolves before protected-route decisions for valid, expired, missing, and failed refresh sessions.
- [x] Verify protected endpoints reject missing and malformed access tokens; verify a valid token resolves `/api/auth/me` to its internal subject ID.
- [x] Verify a correctly signed access token with a one-second TTL is rejected after expiry (the test signs it separately; configured auth TTL is unchanged).
- [ ] Verify an incorrectly signed access token is rejected.
- [x] Verify local refresh-cookie HttpOnly/SameSite/path attributes and credentialed CORS for `http://localhost:3000`.
- [ ] Verify production cookie Secure/SameSite and CORS/CSRF settings against deployment origins.
- [ ] Verify the clean user store, new account ownership behavior, and rollback path.
- [x] Run the backend TypeScript build. It passed. Redis was unavailable, so the backend used the in-memory rate-limit fallback during verification.

## 3) Acceptance Criteria

- Email/password registration and login work without Clerk.
- Google OAuth sign-in establishes a first-party VibeTune session.
- Google sign-in and password registration detect matching existing accounts without automatically linking or duplicating them; linking requires existing-method authentication and explicit confirmation.
- API access uses validated JWT access tokens; refresh tokens are HttpOnly cookies, stored hashed, rotated, and revocable.
- Frontend startup restores auth through the refresh endpoint before protected-route guards allow access or redirect.
- Protected backend handlers and authenticated rate limits use the internal user ID.
- The new auth system starts with no imported Clerk test accounts; each new account receives a stable internal ID used for owned records.
- Frontend auth pages and protected-route behavior no longer depend on Clerk.
- Clerk packages, runtime references, and setup variables are removed from the active system.
- Security and deployment configuration, clean initialization steps, and rollback procedure are documented.

## 4) Deliverables

- First-party backend auth module and middleware.
- Frontend email/password and Google sign-in experience.
- SQL schema and clean initialization procedure; no Clerk user migration is required.
- Updated environment and setup documentation.
- Verification summary with auth flow results and known limitations.

## 5) Out of Scope

- Multi-factor authentication, password reset, email verification, passwordless login, and non-Google providers.
- User profile redesign or changes to product authorization rules.
- Admin account-management UI.
