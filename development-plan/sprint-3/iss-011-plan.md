## Implementation Plan

id: "iss-011"
- **Date:** Nov 19, 2026
- **Title:** Move Vibe Scan and keyword-based music retrieval to reliable background processing
- **Branch:** `feature/iss-011-vibe-scan-queue`

> Technical design: [./iss-011-design.md](iss-011-design.md)

### 1) Goal

Move the full Vibe Scan pipeline (image analysis, keyword generation, iTunes retrieval, and ranking) to BullMQ workers. Use PostgreSQL plus Transactional Outbox so an accepted request is not lost when Redis is unavailable.

### 2) Implementation Steps

#### Phase 1 — Verify Existing Contracts

- [ ] Inspect the deployed `ai_outputs` schema and plan its rename to `recommendation_jobs`, status constraints, migration, and existing records. (The repository DDL was inspected; production DDL still must be verified before migration.)
- [x] Confirm the current frontend Vibe Scan caller and its response handling.
- [x] Verify the current `ISongSearch` interface matches the concrete iTunes candidate-search implementation and existing tests; reconcile any drift before refactoring.
- [ ] Use Cloudflare R2 for private object storage and continue using Upstash for Redis; verify their configuration supports the worker workload.
- [x] Record the current synchronous flow's behavior and recommendation fixtures as a regression baseline in the ISS-002 recommendation tests and this design document.

**Acceptance:** Existing API, repository, database, and frontend contracts are documented; the implementation path does not rely on README pseudo-code.

#### Phase 2 — Persist Jobs and Outbox Events Atomically

- [x] Add a manual SQL migration that renames `ai_outputs` when present, or creates the baseline `recommendation_jobs` table when absent; add lifecycle fields and `outbox_events` with `job_id`, `updated_at`, and a `status` CHECK constraint, omitting `completed_at` and `progress`.
- [x] Apply the migration to the local PostgreSQL database and verify tables, columns, status constraint, and indexes.
- [x] Extend the job DTOs, status types, and repository methods for `recommendation_jobs`; constrain database `status` to `queued`, `processing`, `completed`, or `failed`.
- [x] Implement owner-scoped job lookup and conditional status/result updates in `KnexAIOutputsRepository`.
- [x] Add an outbox repository with transaction-aware event creation and safe batch claiming using `FOR UPDATE SKIP LOCKED` plus a lease.
- [x] Add an idempotency key constraint per user when the client supplies a key.
- [x] Ensure the job record and `vibe_scan.requested` event are inserted in the same PostgreSQL transaction.

**Acceptance:** A database test proves both records commit together and both roll back together. Repeated submissions with the same idempotency key do not create duplicate jobs.

#### Phase 3 — Durable Image Storage

- [x] Add a private object-storage interface and production implementation.
- [x] Keep the existing 10 MB limit and validate the actual image content, not only the filename or MIME header.
- [x] Store uploads under generated, non-guessable object keys; store only the key in `recommendation_jobs.input_params`.
- [x] Add best-effort cleanup when database submission fails and a cleanup path for orphaned/expired uploads.
- [x] Provide a local storage adapter for development and tests only.

**Acceptance:** The API can store an image and a separate worker process can retrieve it without sharing process memory or a local-only filesystem.

#### Phase 4 — BullMQ Infrastructure and Outbox Dispatcher

- [x] Add BullMQ to backend dependencies.
- [x] Create dedicated queue Redis connections; do not reuse the optional cache client.
- [x] Define the `vibe-scan` queue with a stable job ID, bounded attempts, exponential backoff with jitter, and bounded completed/failed job retention.
- [x] Implement an Outbox Dispatcher that claims due events, enqueues them, and marks them published only after enqueue succeeds.
- [x] Add lease expiry, retry scheduling, and structured logs for publication failures.
- [x] Ensure multiple dispatcher instances cannot claim the same unexpired event.

**Acceptance:** With Redis unavailable, outbox events remain pending and are published after Redis recovers. A simulated crash after enqueue but before the published update does not create duplicate final results.

#### Phase 5 — Build the Worker Pipeline

- [x] Add a standalone worker entry point and start script, separate from the Express API.
- [x] Load the `recommendation_jobs` record and private image from storage using IDs from the queue payload.
- [x] Refactor the existing Vibe Scan orchestration into reusable stages without changing query generation, iTunes retrieval, cache, filtering, or ranking behavior.
- [x] Persist stage and `updated_at` changes, plus the CLIP keyword/context checkpoint, before starting music retrieval.
- [x] Reuse the saved CLIP checkpoint when a retry only needs to repeat a transiently failed retrieval stage.
- [x] Persist the final recommendations and mark the job completed before acknowledging successful processing.
- [x] Make processing idempotent: skip completed jobs and use conditional database updates for state transitions.
- [x] Classify permanent versus retryable failures; persist a safe terminal error after retries are exhausted.
- [x] Start with worker concurrency `1`; make concurrency, attempts, backoff, and lock settings configurable.
- [x] Implement graceful shutdown for the worker, dispatcher, queue, and Redis connections.

**Acceptance:** A worker can process a job without an HTTP request remaining open. Retried or duplicate deliveries do not duplicate or overwrite a completed result.

#### Phase 6 — Add the Asynchronous API and Frontend Flow

- [x] Compose the repository and application services in `vibe.module.ts`; inject only the Vibe Scan application service into the controller.
- [x] Change `POST /api/vibe-scan` to validate, store, create the job/outbox transaction, and return `202 Accepted` with `jobId` and `queued` status.
- [x] Keep authentication, file-size/type checks, request-context validation, and rate limiting.
- [x] Validate Music Taste eligibility before enqueueing so known-invalid requests fail immediately.
- [x] Add `GET /api/vibe-scan/jobs/:jobId`, scoped to the authenticated owner.
- [x] Return the current stage while running; return the existing recommendation shape when completed; return safe error details when failed.
- [x] Update the existing frontend Vibe Scan API caller to handle `202` and poll the status endpoint.
- [x] Show queued/processing stage, completed recommendations, and a retry-friendly failure state.
- [x] Leave independent song-search endpoints unchanged.

**Acceptance:** The end-to-end UI no longer waits for CLIP/iTunes in the upload request and displays the same completed recommendation data as before.

#### Phase 7 — Tests, Observability, and Production Rollout

- [ ] Add unit coverage for submission validation, status transitions, and worker idempotency. (The outbox dispatch and retry classification paths have focused tests.)
- [ ] Integration-test PostgreSQL transaction rollback, concurrent outbox claims, Redis recovery, duplicate publication, and job ownership checks.
- [ ] Test CLIP timeout, iTunes timeout/429/5xx, permanent invalid input, empty results, and exhausted retries.
- [x] Add metrics/logs for outbox backlog age, queue depth, wait time, processing duration by stage, retries, and terminal failures.
- [x] Unit-test Outbox Dispatcher publish success/retry and iTunes all-fail retry classification.
- [x] Unit-test application-service idempotency, Music Taste prevalidation, and filtering of non-Vibe-Scan jobs.
- [ ] Verify Upstash TLS, connection limits, persistence/eviction behavior, and expected cost for BullMQ.
- [ ] Load-test with concurrent uploads and tune worker concurrency based on CPU/RAM and external API limits.
- [ ] Deploy API and worker processes together; verify health, graceful shutdown, and recovery after Redis/worker restart.
- [x] Document operational steps for replaying failed jobs and cleaning old outbox records/uploads in [iss-011-operations.md](iss-011-operations.md).

**Acceptance:** Automated tests pass; a staging test proves recovery from Redis and worker restarts; measured load stays within configured resource and API limits.

**Current verification:** Focused application-service, Vibe Scan/recommendation, and outbox tests pass (19/19). The full backend suite currently has 2 unrelated auth email-sender expectation failures (27/29 pass); production auth uses `VibeTune <onboarding@resend.dev>` while those tests expect `VibeTune <noreply@mail.vibetune.ai>`. Deployment-specific database, R2, Upstash, and staging checks remain open.

### 3) Configuration

Add validated backend configuration for:

- `BULLMQ_REDIS_URL` — dedicated BullMQ Redis connection string.
- Cloudflare R2 credentials, bucket, and private endpoint settings.
- `VIBE_SCAN_WORKER_CONCURRENCY` — default `1` initially.
- `VIBE_SCAN_JOB_ATTEMPTS` and `VIBE_SCAN_JOB_BACKOFF_MS` — bounded retry policy.
- `OUTBOX_POLL_INTERVAL_MS`, `OUTBOX_BATCH_SIZE`, and `OUTBOX_LEASE_MS` — dispatcher operation.
- Upload retention/cleanup settings.

Do not silently fall back to the cache-only Redis client when queue configuration is missing. The API may continue accepting requests only when PostgreSQL and object storage are healthy; the outbox can wait for Redis recovery.

### 4) Definition of Done

- [x] Vibe Scan submission returns `202` only after the job and outbox event are committed.
- [x] No image bytes are stored in Redis or BullMQ payloads.
- [x] Redis downtime does not lose accepted jobs; pending outbox events publish after recovery.
- [x] Worker retries transient failures and does not retry permanent validation errors.
- [x] Duplicate events/deliveries cannot create duplicate completed results.
- [x] Users cannot read another user's job or result.
- [x] The frontend handles all four states: queued, processing, completed, and failed.
- [x] Existing recommendation fixtures and ranking behavior remain unchanged.
- [ ] API, worker, and frontend tests pass; lint/build pass.
- [x] Production configuration, monitoring, retention, and rollback steps are documented in [iss-011-operations.md](iss-011-operations.md).

### 5) Rollback

- Stop new async submissions or disable the rollout flag.
- Keep the dispatcher/worker running until accepted jobs are drained, or pause them without deleting pending events.
- Roll back frontend/API changes together if the async contract must be reverted.
- Keep the additive database migration and persisted job/outbox records. Do not drop tables or columns during application rollback.
