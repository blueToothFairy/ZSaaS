# Implementation Plan

- **ID:** `iss-003`
- **Date:** Nov 12, 2026
- **Title:** Replace Clerk with First-Party Email and Google Authentication
- **Design:** [./iss-003-design.md](iss-003-design.md)
- **Scope:** Replace Clerk authentication across the frontend and backend with email/password and Google OAuth using JWT access tokens and rotating refresh tokens.

## 1) Objective

Deliver a secure first-party authentication flow that supports email/password and Google sign-in and protects existing API routes. The system currently has only test users, so the new auth store starts empty and no Clerk accounts or user records need migration.

## 2) Tasks

### Task 1 — Confirm Security and Deployment Decisions

- [ ] Inventory all Clerk references, protected routes, and persisted user IDs.
- [ ] Confirm production domains, Google OAuth callback URLs, secrets, cookie policy, token lifetimes, and the explicit account-linking/reauthentication UX.
- [x] Confirm that current users are test accounts and do not require migration; use a clean user store for the new auth system.

### Task 2 — Add Authentication Data Model

- [ ] Define users, password credentials, OAuth identities, and refresh sessions with constraints and indexes.
- [ ] Prepare manual SQL schema changes and a clean initialization procedure consistent with the repository's database workflow.
- [ ] Identify development-only rows owned by test Clerk IDs and decide whether to clear or isolate them; do not map them to new users.

### Task 3 — Implement Backend Authentication

- [ ] Add the `auth` backend module with DTO validation, service, repository, controller, routes, and app registration.
- [ ] Implement password registration and login with a maintained password hash function and generic credential errors.
- [ ] Implement Google Authorization Code flow, state validation, and provider-subject identity lookup.
- [ ] If the Google identity is already linked, sign in to its existing account. If only the verified email matches a password account, do not create or link an account; require authentication through an existing method and explicit Google-link confirmation.
- [ ] If password registration uses an email already owned by a Google account, return an account-exists response instead of creating a duplicate; allow password addition only after authenticating to the existing account and explicitly confirming.
- [ ] Add authenticated linking flows that verify the existing session and explicit user intent before adding a Google identity or password credential; reject identity and email conflicts safely.
- [ ] Issue signed short-lived access JWTs and HttpOnly refresh cookies; persist only refresh-token hashes.
- [ ] Implement refresh rotation, reuse detection, logout/revocation, and `/api/auth/me`.
- [ ] Add token verification middleware and typed user identity attachment.
- [ ] Replace Clerk identity usage in protected routes, handlers, and authenticated rate limiting.
- [ ] Apply rate limits and consistent validation/authentication errors to auth endpoints.

### Task 4 — Implement Frontend Authentication

- [ ] Replace Clerk provider, proxy middleware, hosted sign-in/sign-up widgets, and Clerk hooks with first-party auth UI and session handling.
- [ ] Add email/password sign-up and sign-in forms plus Google sign-in entry point.
- [ ] Keep access tokens in memory; use the refresh cookie to renew sessions and retry eligible API requests once.
- [ ] On application startup, call `/api/auth/refresh` and keep auth state unresolved until it succeeds or fails definitively.
- [ ] Make protected-route guards wait for startup refresh before rendering protected content or redirecting to sign-in; prevent protected API calls until the access token is restored.
- [ ] Clear state on logout or unrecoverable refresh failure.
- [ ] Ensure redirect destinations are allow-listed and auth errors are accessible and understandable.

### Task 5 — Initialize the New User Store

- [ ] Apply the schema with an empty users, credentials, OAuth identities, and refresh sessions store.
- [ ] Clear or isolate any development records tied to test Clerk IDs; do not backfill identities or ownership.
- [ ] Verify that newly registered email and Google users receive distinct internal IDs and that new user-owned records use those IDs.
- [ ] Document the cutover and rollback sequence, including session revocation behavior.

### Task 6 — Remove Clerk Integration

- [ ] Remove Clerk dependencies and imports from backend and frontend.
- [ ] Remove `CLERK_*` environment variables and replace setup documentation with first-party auth and Google OAuth configuration.
- [ ] Search the repository for remaining Clerk-specific code, copy, configuration, and types; remove only obsolete references.

### Task 7 — Review and Verify

- [ ] Verify registration, login, invalid credentials, duplicate email, Google callback/state failures, refresh rotation, reuse detection, logout, and expired sessions.
- [ ] Verify an already-linked Google identity signs into its existing account, while a Google email matching a password account does not auto-link or create a duplicate and requires existing-method authentication plus explicit linking.
- [ ] Verify password registration with an email already used by Google is rejected as a duplicate and requires authenticated, explicit password linking.
- [ ] Verify startup refresh resolves before protected-route decisions for valid, expired, missing, and failed refresh sessions.
- [ ] Verify protected endpoints reject missing, malformed, expired, or incorrectly signed tokens and use the token subject as the user identity.
- [ ] Verify refresh cookies and CORS/CSRF behavior against the deployment origins.
- [ ] Verify the clean user store, new account ownership behavior, and rollback path.
- [ ] Run the available type checks, lint, and build commands; record any existing or environment-dependent failures.

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
