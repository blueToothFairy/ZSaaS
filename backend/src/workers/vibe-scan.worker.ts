import dotenv from 'dotenv';
dotenv.config();

import { Job, Worker } from 'bullmq';
import { createQueueConnection } from '../shared/queue/redis-connection.js';
import { createVibeScanQueue, VIBE_SCAN_QUEUE, VibeScanPayload } from '../modules/vibe-scan/queue/vibe-scan.queue.js';
import db from '../shared/db/knexClient.js';
import KnexAIOutputsRepository from '../modules/vibe-scan/repositories/ai-outputs.knex.js';
import { createObjectStorage } from '../shared/storage/object-storage.js';
import OutboxDispatcher from '../shared/outbox/outbox-dispatcher.js';
import OutboxRepository from '../shared/outbox/outbox.repository.js';
import VibeScannerService from '../modules/vibe-scan/services/index.js';
import CLIPService from '../modules/vibe-scan/services/CLIP.service.js';
import ITunesSearchService from '../modules/song/services/itunes.search.service.js';
import MusicTasteRepository from '../modules/profile/repositories/music-taste.knex.js';
import MusicTasteService from '../modules/profile/services/music-taste.service.js';
import { PermanentVibeScanError } from '../modules/vibe-scan/vibe-scan.errors.js';
import { positiveInteger } from '../shared/config/positive-integer.js';

const jobs = new KnexAIOutputsRepository(db);
const storage = createObjectStorage();
const scanner = new VibeScannerService(new CLIPService(), new ITunesSearchService(), jobs, new MusicTasteService(new MusicTasteRepository(db)));
const queue = createVibeScanQueue();
const outbox = new OutboxRepository(db);
const dispatcher = new OutboxDispatcher(outbox, queue);
let completedSinceMetrics = 0;
let terminalFailuresSinceMetrics = 0;
let retriesSinceMetrics = 0;
const worker = new Worker<VibeScanPayload>(VIBE_SCAN_QUEUE, async (bullJob: Job<VibeScanPayload>) => {
  const { data } = bullJob;
  const startedAt = Date.now();
  const job = await jobs.findById(data.jobId);
  if (!job || job.status === 'completed') return;
  if (bullJob.attemptsMade > 0) retriesSinceMetrics += 1;
  const hasCheckpoint = Array.isArray(job.output_data.clipVibes);
  const claimed = await jobs.updateIfStatus(job.id, ['queued', 'processing'], { status: 'processing', stage: hasCheckpoint ? 'searching_tracks' : 'analyzing_image', error_code: null, error_message: null });
  if (!claimed) return;
  try {
    const params = job.input_params;
    const key = params.imageKey;
    if (typeof key !== 'string') throw new Error('Job image key is missing');
    const image = await storage.get(key);
    const mimeType = String(params.mimeType ?? 'image/jpeg');
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    let stageStartedAt = Date.now();
    let previousStage = 'analyzing_image';
    const recommendations = await scanner.getVibeMatchingSongs(job.user_id, image, `upload.${extension}`, mimeType, String(params.country ?? 'US'),
      (params.requestContext as { platform: string; contentType: string } | undefined) ?? { platform: 'unspecified', contentType: 'unspecified' },
      async (stage) => {
        const now = Date.now();
        await jobs.updateIfStatus(job.id, ['processing'], { status: 'processing', stage });
        console.info(JSON.stringify({ event: 'vibe_scan_stage', jobId: job.id, outboxEventId: data.outboxEventId, stage: previousStage, nextStage: stage, durationMs: now - stageStartedAt, attempt: bullJob.attemptsMade + 1 }));
        stageStartedAt = now;
        previousStage = stage;
      },
      {
        ...(Array.isArray(job.output_data.clipVibes) ? { vibes: job.output_data.clipVibes as Array<{ keyword: string; score: number }> } : {}),
        saveVibes: async (vibes) => { await jobs.updateIfStatus(job.id, ['processing'], { status: 'processing', stage: 'searching_tracks', output_data: { ...job.output_data, clipVibes: vibes } }); },
      });
    await jobs.updateIfStatus(job.id, ['processing'], { status: 'completed', stage: 'completed', output_data: { recommendations } });
    completedSinceMetrics += 1;
    console.info(JSON.stringify({ event: 'vibe_scan_stage', jobId: job.id, outboxEventId: data.outboxEventId, stage: previousStage, durationMs: Date.now() - stageStartedAt, attempt: bullJob.attemptsMade + 1 }));
    console.info(JSON.stringify({ event: 'vibe_scan_completed', jobId: job.id, outboxEventId: data.outboxEventId, durationMs: Date.now() - startedAt, queueWaitMs: bullJob.processedOn ? bullJob.processedOn - bullJob.timestamp : null, attempt: bullJob.attemptsMade + 1 }));
  } catch (error) {
    const permanent = error instanceof PermanentVibeScanError;
    if (permanent) {
      await jobs.updateIfStatus(job.id, ['processing'], { status: 'failed', stage: 'failed', error_code: error.code, error_message: error.message });
      terminalFailuresSinceMetrics += 1;
      console.error(JSON.stringify({ event: 'vibe_scan_permanent_failure', jobId: job.id, outboxEventId: data.outboxEventId, errorCode: error.code, attempt: bullJob.attemptsMade + 1 }));
      return;
    }
    throw error;
  }
}, {
  connection: createQueueConnection(),
  concurrency: positiveInteger('VIBE_SCAN_WORKER_CONCURRENCY', 1),
  lockDuration: positiveInteger('VIBE_SCAN_LOCK_DURATION_MS', 30000),
  stalledInterval: positiveInteger('VIBE_SCAN_STALLED_INTERVAL_MS', 30000),
});

worker.on('failed', async (bullJob: Job<VibeScanPayload> | undefined, error: Error) => {
  if (!bullJob || bullJob.attemptsMade < Number(bullJob.opts.attempts ?? 1)) return;
  await jobs.updateIfStatus(bullJob.data.jobId, ['processing'], {
    status: 'failed', stage: 'failed', error_code: 'PROCESSING_FAILED', error_message: 'Could not process this image',
  }).catch((updateError: unknown) => console.error('Failed to persist terminal job failure', updateError instanceof Error ? updateError.message : 'unknown'));
  terminalFailuresSinceMetrics += 1;
  console.error('Vibe Scan job exhausted retries', bullJob.data.jobId, error.name);
});

const pollMs = positiveInteger('OUTBOX_POLL_INTERVAL_MS', 1000);
let dispatchInFlight: Promise<void> = Promise.resolve();
const dispatchSafely = (): void => {
  dispatchInFlight = dispatchInFlight.then(() => dispatcher.dispatchBatch()).catch((error: unknown) => {
    console.error('Outbox dispatch failed', error instanceof Error ? error.name : 'unknown');
  });
};
const timer = setInterval(dispatchSafely, pollMs);
dispatchSafely();
const metricsTimer = setInterval(() => {
  void Promise.all([outbox.getBacklogMetrics(), queue.getJobCounts('waiting', 'active', 'failed', 'delayed')]).then(([backlog, queueCounts]) => {
    console.info(JSON.stringify({ event: 'vibe_scan_metrics', ...backlog, queueCounts, completedSinceMetrics, terminalFailuresSinceMetrics, retriesSinceMetrics }));
    completedSinceMetrics = 0;
    terminalFailuresSinceMetrics = 0;
    retriesSinceMetrics = 0;
  }).catch((error: unknown) => console.error('Vibe Scan metrics collection failed', error instanceof Error ? error.name : 'unknown'));
}, 60_000);

const cleanupRetentionDays = positiveInteger('VIBE_SCAN_UPLOAD_RETENTION_DAYS', 30);
const cleanupExpiredData = async (): Promise<void> => {
  const expiredJobs = await db('recommendation_jobs').select('id', 'input_params')
    .whereIn('status', ['completed', 'failed'])
    .where('updated_at', '<', db.raw("now() - (? * interval '1 day')", [cleanupRetentionDays]));
  for (const expired of expiredJobs) {
    const params = expired.input_params as Record<string, unknown>;
    const imageKey = params.imageKey;
    if (typeof imageKey !== 'string') continue;
    try {
      await storage.delete(imageKey);
      const { imageKey: _removed, ...remainingParams } = params;
      await db('recommendation_jobs').where({ id: expired.id }).update({ input_params: remainingParams });
    } catch (error) {
      console.error('Expired Vibe Scan image cleanup failed', String(expired.id), error instanceof Error ? error.name : 'unknown');
    }
  }
  await db('outbox_events').whereNotNull('published_at')
    .where('published_at', '<', db.raw("now() - (? * interval '1 day')", [cleanupRetentionDays])).delete();

  const oldUnreferencedCandidates = await storage.listOlderThan('vibe-scan/', new Date(Date.now() - 24 * 60 * 60 * 1000));
  for (const key of oldUnreferencedCandidates) {
    const reference = await db('recommendation_jobs').whereRaw("input_params ->> 'imageKey' = ?", [key]).first('id');
    if (!reference) await storage.delete(key);
  }
};
const cleanupTimer = setInterval(() => { void cleanupExpiredData().catch((error: unknown) => console.error('Vibe Scan retention cleanup failed', error instanceof Error ? error.name : 'unknown')); }, 24 * 60 * 60 * 1000);
void cleanupExpiredData().catch((error: unknown) => console.error('Initial Vibe Scan retention cleanup failed', error instanceof Error ? error.name : 'unknown'));

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(timer);
  clearInterval(cleanupTimer);
  clearInterval(metricsTimer);
  await dispatchInFlight;
  await Promise.all([worker.close(), queue.close()]);
  await db.destroy();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
