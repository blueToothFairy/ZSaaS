## Technical Design

id: "iss-011"
- **Date:** Nov 19, 2026
- **Title:** Move Vibe Scan and keyword-based music retrieval to reliable background processing
- **Branch:** `feature/iss-011-vibe-scan-queue`

> Implementation plan: [./iss-011-plan.md](iss-011-plan.md)

### 1) Overview

**Context**

`POST /api/vibe-scan` currently processes the full request synchronously. The controller validates the uploaded image and then waits for `VibeScannerService` to:

1. Load the user's Music Taste Profile.
2. Send the image to the Python CLIP service.
3. Map the extracted visual keywords into a recommendation context.
4. Generate music-search queries.
5. Retrieve candidates from iTunes and rank the recommendations.
6. Return the result in the HTTP response.

The request therefore remains open while the AI service and external music-search API run. A timeout or temporary dependency outage can fail the whole request. The current Multer route also keeps the image in process memory, which is unsuitable for a separately deployed worker.

The backend already has PostgreSQL/Knex, `ioredis`, a Redis-backed song-search cache, and an `ai_outputs` repository. The `match_music` feature type and basic output statuses already exist. However, the current AI repository only supports creation and user-list queries; it has no job lookup or update methods. `VibeScannerService` receives the repository but does not currently persist its processing state or result. BullMQ is not yet a backend dependency.

**Proposed**

Move the complete Vibe Scan recommendation pipeline to one BullMQ job per request, backed by Redis. Use PostgreSQL as the source of truth for job state and results, and use the Transactional Outbox Pattern to publish jobs reliably.

1. Keep `POST /api/vibe-scan`, but make it an asynchronous submission endpoint. Validate the request, store the image in private Cloudflare R2 object storage, then create a `recommendation_jobs` record and an `outbox_events` record in the same PostgreSQL transaction.
2. An Outbox Dispatcher claims unpublished events and adds a BullMQ job using a stable job ID. It marks an event as published only after Redis accepts the job.
3. A separate worker process loads the job record and image, runs the existing CLIP → keyword query generation → iTunes retrieval → ranking pipeline, and persists stage changes and the final result.
4. Add an authenticated job-status endpoint. The frontend polls it until the job is completed or failed.

The existing recommendation query generation, iTunes search behavior, cache, filtering, and ranking remain the source of recommendation quality. This change moves their execution out of the request/response lifecycle; it does not redesign the recommendation algorithm.

**Goals**

- Return an accepted response quickly without waiting for CLIP or iTunes.
- Do not lose an accepted request when Redis is temporarily unavailable.
- Track each Vibe Scan job and its result in PostgreSQL.
- Retry transient failures safely and prevent duplicate result writes.
- Limit worker concurrency so CLIP and external APIs are not overwhelmed.
- Keep image bytes out of Redis and queue payloads.
- Preserve the current recommendation output and user-facing flow, with an explicit asynchronous loading state.

**Non-Goals**

- No Kafka, RabbitMQ, event sourcing, or general workflow engine.
- No queue migration for authentication, profile CRUD, weather, or unrelated song endpoints.
- No redesign of keyword generation, retrieval, or ranking quality.
- No video processing, scheduled recommendation jobs, or multi-stage distributed workflow.
- No WebSocket/SSE requirement for the first release; polling is sufficient.

### 2) Requirements & Constraints

**Functional**

- `POST /api/vibe-scan` remains authenticated and retains the existing image validation and 10 MB upload limit.
- A valid request creates one durable job and returns `202 Accepted` with its ID and initial status.
- The worker executes the complete image-analysis and keyword-based music-retrieval pipeline.
- Users can read only their own job status and result.
- Completed jobs expose the same recommendation data currently returned by the synchronous endpoint, including scores, component scores, and reasons.
- A job transitions through `queued`, `processing`, `completed`, or `failed`.
- A retry must not create duplicate recommendation records or overwrite a completed result.
- The existing standalone song-search endpoints remain synchronous and unchanged in this issue.

**Non-Functional**

- PostgreSQL is the source of truth; Redis/BullMQ is the execution queue, not the only record of a request.
- Job creation and outbox-event creation are atomic in one PostgreSQL transaction.
- Delivery is at-least-once. Worker processing must therefore be idempotent.
- Queue payloads contain identifiers and small metadata only; no image buffer or base64 image.
- Worker concurrency, retry count, backoff, polling interval, and batch size are configurable.
- The API and worker run as separate processes and can be deployed/scaled independently.
- Logs and metrics include job/event IDs but never image bytes, tokens, or private storage URLs.

**Constraints / Assumptions**

- Replace `ai_outputs` with `recommendation_jobs` as the canonical Vibe Scan job table (`feature_type = 'match_music'`). Inspect the deployed schema and constraints before writing the migration.
- Extend the existing AI output DTO, repository interface, and Knex repository with job lookup and update operations. Add an explicit `queued` status and the lifecycle fields required below.
- The current `Multer.memoryStorage()` upload is temporary only. Production processing uses Cloudflare R2 private object storage accessible by both API and worker. Implement this behind a storage interface; use a local adapter only for development/tests. Retain terminal-job uploads for 30 days by default, configurable with `VIBE_SCAN_UPLOAD_RETENTION_DAYS`.
- The existing Redis client is designed for optional caching and graceful degradation. BullMQ must use dedicated Redis connections and must not reuse that cache client instance.
- Continue using Upstash for Redis. Confirm the selected plan supports BullMQ's command/connection requirements and expected background command volume.
- The worker re-loads the user's Music Taste Profile when processing begins. Recommendation output therefore uses the profile available at processing time.

### 3) Architecture & Components

**Request and submission path**

- `vibe.route.ts` continues to authenticate the user and validate the multipart upload.
- `vibe.controller.ts` remains an HTTP adapter. It must stop calling the full recommendation pipeline and instead call a submission use case.
- The submission use case stores the uploaded image in private Cloudflare R2 object storage, then uses a Knex transaction to create the `recommendation_jobs` job record and its `outbox_events` record.
- The response is returned only after the database transaction commits. Redis availability is not required to accept the request.

**Outbox publication path**

- `OutboxRepository` claims a small batch of due events in a short PostgreSQL transaction using `FOR UPDATE SKIP LOCKED` and a lease (`locked_until`/`locked_by`).
- `OutboxDispatcher` publishes each event to the `vibe-scan` BullMQ queue. The BullMQ job ID is stable and derived from the outbox event or AI output ID.
- After `queue.add` succeeds, the dispatcher marks the event as published. If Redis is unavailable, it records the error and schedules another attempt with backoff.
- A crash after `queue.add` but before the published mark can cause a duplicate publish. Stable BullMQ job IDs reduce duplicate enqueues; database-level idempotency remains mandatory because queue jobs can eventually be removed.

**Worker path**

- Add a dedicated worker entry point; do not start the worker inside the Express API bootstrap.
- The worker receives only the AI output ID and event ID. It loads the owner, input parameters, and private image key from PostgreSQL.
- It downloads the image from object storage and invokes the existing Vibe Scan orchestration.
- Preserve the current pipeline: Music Taste validation → CLIP extraction → visual-context mapping → query generation → iTunes candidate retrieval → ranking.
- Persist a CLIP/keyword checkpoint before music retrieval. If a retry is caused by a temporary iTunes failure, reuse the checkpoint instead of repeating expensive image inference.
- Persist stage changes and save the final ranked recommendations before marking the job completed.
- If the job is already completed, the worker exits without repeating side effects. A conditional database update protects against concurrent or repeated deliveries.

**Suggested flow**

```text
Frontend
  └─ POST /api/vibe-scan (multipart image)
       └─ API validates + stores image in private Cloudflare R2 object storage
       └─ PostgreSQL transaction
            ├─ INSERT recommendation_jobs (status = queued)
            └─ INSERT outbox_events (vibe_scan.requested)
       └─ 202 Accepted { jobId, status }

Outbox Dispatcher
  └─ claim pending event (SKIP LOCKED + lease)
  └─ BullMQ Queue.add(jobId = stable event/job ID)
  └─ mark event published

BullMQ Worker
  └─ load recommendation_jobs + image from storage
  └─ CLIP analysis → checkpoint keywords/context
  └─ keyword query generation → iTunes retrieval → ranking
  └─ save result + status = completed

Frontend
  └─ GET /api/vibe-scan/jobs/:jobId (poll)
       └─ queued / processing / completed / failed
```

### 4) Data Model Changes

**Create `recommendation_jobs`**

Use `recommendation_jobs` as the single source of truth for job lifecycle and result history. The SQL migration renames `ai_outputs` when it exists; if neither table exists, it creates the baseline table with `feature_type` stored as text. Define the required lifecycle fields:

- `updated_at` — last state change.
- `stage` — current stage, such as `queued`, `analyzing_image`, `searching_tracks`, or `ranking`.
- `error_code` and `error_message` — safe, user-facing failure details.
- `idempotency_key` — optional client key, unique per user when supplied.

Extend the application status type to `queued | processing | completed | failed`. Keep `input_params` for request context and the private object-storage key. Keep `output_data` for the CLIP checkpoint and final recommendation result; do not store image bytes there.

Add a database CHECK constraint restricting `status` to `queued`, `processing`, `completed`, or `failed`. Add repository operations for `findById`, `findByIdAndUserId`, and conditional status/result updates. Support passing a transaction so job and outbox inserts share the same Knex transaction.

**Add `outbox_events`**

Minimum fields:

- `id` (UUID primary key), `event_type`, `job_id` (reference to `recommendation_jobs.id`), and `payload` (JSONB).
- `created_at`, `published_at`, and `available_at`.
- `locked_until`, `locked_by`, and `attempts` for safe concurrent dispatch and lease recovery.
- `last_error` for operational diagnosis.

Add indexes for unpublished/due events and `job_id`. Keep published events for a bounded retention period, then clean them up with a maintenance task.

### 5) APIs & Interfaces

**Submit Vibe Scan**

`POST /api/vibe-scan` continues to accept multipart image data and existing context fields. Its response changes from an immediate recommendation list to:

- HTTP `202 Accepted` after the database transaction commits.
- `jobId` and `status: "queued"` in the response.
- A `Location` header pointing to the status endpoint and a short `Retry-After` hint for polling.

Invalid files and users without a qualifying Music Taste Profile should still receive an immediate client error; do not enqueue work that is already known to be invalid.

**Read job status/result**

Add `GET /api/vibe-scan/jobs/:jobId` with the same authentication middleware. Query by both job ID and authenticated user ID. Return status, stage, and—only when completed—the existing recommendation result shape. Return a safe error code/message for terminal failures.

No public endpoint should expose BullMQ internals, Redis keys, stack traces, or another user's job data.

### 6) Reliability, Security & Operations

- **Outbox delivery:** claim with a lease and `SKIP LOCKED`; never hold a PostgreSQL transaction open while calling Redis. Mark published only after a successful enqueue. Expired leases make abandoned events eligible again.
- **Idempotency:** use a stable BullMQ job ID, optional per-user API idempotency key, and a conditional database state transition. A completed job must never be processed into a second result.
- **Retry policy:** retry transient CLIP timeouts, network errors, and eligible iTunes 429/5xx errors with bounded exponential backoff and jitter. Do not retry invalid image data, unsupported file types, missing Music Taste setup, or other permanent validation failures. Persist the final failure after retries are exhausted.
- **Concurrency:** start with a conservative worker concurrency of `1` because CLIP inference is resource-intensive. Tune only after measuring CPU/RAM, queue wait time, and end-to-end processing latency. Keep per-query retrieval limits bounded by the existing search service.
- **Redis connections:** create dedicated BullMQ producer/worker connections from a queue-specific configuration. Configure Worker connections as required by BullMQ (including `maxRetriesPerRequest: null` for ioredis workers); do not use ioredis `keyPrefix`. Keep cache and queue connection lifecycles separate.
- **Redis durability:** continue using Upstash; confirm the selected plan's persistence, eviction behavior, TLS, connection limits, and pricing are suitable for BullMQ before production rollout.
- **Image security:** private bucket, generated object keys, MIME and file-content validation, current 10 MB limit, and access restricted to the backend/worker. Never put public image URLs or image contents in job payloads. Define a retention/cleanup policy for completed and failed uploads.
- **Rate protection:** retain the current request rate limit and add a per-user cap for outstanding queued/processing jobs to prevent queue flooding.
- **Observability:** log `jobId`, `outboxEventId`, stage, attempt, and duration. Track pending outbox age/count, queue waiting/active/failed counts, processing duration, retries, and terminal failure rate. Do not log image content or credentials.
- **Shutdown:** close the BullMQ worker, queue, dispatcher loop, and Redis connections gracefully. Let active jobs finish or be safely retried.

### 7) Planned File Changes

**Modify**

- `backend/package.json`
  - Add `bullmq` and a dedicated worker start script.
- `backend/src/modules/vibe-scan/vibe.route.ts`
  - Add the authenticated job-status route; keep upload authentication and file limits.
- `backend/src/modules/vibe-scan/vibe.controller.ts`
  - Submit jobs and return `202`; add owner-scoped status handling.
- `backend/src/modules/vibe-scan/vibe.module.ts`
  - Compose repositories and application services, then inject the Vibe Scan application service into the controller.
- `backend/src/modules/vibe-scan/services/index.ts`
  - Keep recommendation orchestration reusable by the worker; expose stage/checkpoint boundaries without changing recommendation rules.
- `backend/src/modules/vibe-scan/dto/ai-repo.ts`
  - Extend job statuses and DTO fields.
- `backend/src/modules/vibe-scan/interfaces/ai-output-repo.interface.ts`
  - Add lookup and conditional update operations; support transaction-aware writes.
- `backend/src/modules/vibe-scan/repositories/ai-outputs.knex.ts`
  - Implement the new repository operations.
- `backend/src/server.ts`
  - Keep API startup separate from the worker process; preserve existing cache initialization behavior.
- The existing frontend Vibe Scan API caller and view under `saas-platform/src/`
  - Handle the `202` response, poll the status endpoint, display the current stage, and render the same result/error states.

**New**

- Manual SQL migration for the `recommendation_jobs` lifecycle fields and `outbox_events` table, placed in `backend/migrations/` according to the repository's existing SQL migration convention.
- `backend/src/modules/vibe-scan/services/vibe-scan-submission.service.ts` — image storage plus atomic job/outbox creation.
- `backend/src/shared/outbox/outbox.repository.ts` — event creation, claiming, lease recovery, and publication updates.
- `backend/src/shared/outbox/outbox-dispatcher.ts` — publish pending events to BullMQ with bounded retry.
- `backend/src/shared/queue/redis-connection.ts` — dedicated BullMQ Redis configuration.
- `backend/src/modules/vibe-scan/queue/vibe-scan.queue.ts` — queue definition and default job options.
- `backend/src/workers/vibe-scan.worker.ts` — worker process, processor, and graceful shutdown.
- `backend/src/shared/storage/` — private object-storage interface and configured implementation.
- Tests for submission transactions, outbox dispatch, worker processing, retry/idempotency, and job-status authorization.

**Out of scope**

- Changes to the recommendation scoring strategy or Music Taste Profile model.
- Making all `/api/song` endpoints asynchronous.
- Reusing the existing `ai_outputs` table; the Vibe Scan workflow will use `recommendation_jobs`.

### 8) Risks & Rollback

| Risk | Mitigation |
| --- | --- |
| Redis is unavailable after a request is accepted | The committed outbox event remains in PostgreSQL and is retried when Redis recovers. |
| Dispatcher crashes after enqueue but before marking the event published | Stable BullMQ job ID plus worker idempotency prevents duplicate results. |
| Worker crashes during CLIP or song retrieval | BullMQ stalled-job recovery and bounded retries; persist the CLIP checkpoint to avoid repeating expensive inference after a retrieval failure. |
| Image is stored but the database transaction fails | Best-effort object deletion plus a scheduled orphan-object cleanup. |
| Queue overload or CLIP resource saturation | Per-user outstanding-job cap and conservative configurable worker concurrency. |
| Existing frontend expects an immediate `songs` response | Deploy the frontend async-state change with the API contract change; use a feature flag during rollout if a staged release is required. |
| Existing Upstash plan is unsuitable for BullMQ | Validate compatibility and cost before production; select an Upstash plan that supports the queue workload. |

**Rollback**

1. Stop accepting new asynchronous submissions or disable the feature flag.
2. Keep the worker and dispatcher running until accepted jobs and pending outbox events are drained, or leave them available for a later resume.
3. Roll back the frontend/API behavior only after no active client depends on the async contract.
4. Keep the additive database schema and existing job records. Do not drop `outbox_events` or lifecycle columns during rollback; they may contain accepted work and are safe to retain.

### 9) Open Questions

- Cloudflare R2 is selected for private object storage. The worker reads private uploads independently of the API process; terminal uploads are retained for 30 days by default.
- The migration is based on the repository's `mig-001-init.sql`. Verify the deployed `recommendation_jobs` DDL and status constraints before applying it; the migration enforces `queued`, `processing`, `completed`, and `failed`.
- Continue using Upstash for BullMQ. Verify that the selected plan supports BullMQ's connection and command requirements before production rollout.

### 10) References

- `backend/src/modules/vibe-scan/vibe.route.ts` — authenticated upload route and Multer memory storage.
- `backend/src/modules/vibe-scan/vibe.controller.ts` — asynchronous submission and owner-scoped status handling.
- `backend/src/modules/vibe-scan/services/index.ts` — Music Taste → CLIP → query generation → song retrieval → ranking orchestration.
- `backend/src/modules/vibe-scan/dto/ai-repo.ts` — recommendation job statuses and data model.
- `backend/src/modules/vibe-scan/interfaces/ai-output-repo.interface.ts` and `repositories/ai-outputs.knex.ts` — job persistence interface and implementation.
- `backend/src/modules/song/services/itunes.search.service.ts` — keyword retrieval and existing Redis cache.
- `backend/src/shared/redis/redisClient.ts` and `backend/src/shared/cache/cacheService.ts` — existing cache Redis connection and behavior.
- `backend/src/server.ts` — current API startup.
