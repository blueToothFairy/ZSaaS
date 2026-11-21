import { Queue } from 'bullmq';
import { createQueueConnection } from '../../../shared/queue/redis-connection.js';
import { positiveInteger } from '../../../shared/config/positive-integer.js';

export const VIBE_SCAN_QUEUE = 'vibe-scan';
export interface VibeScanPayload { jobId: string; outboxEventId: string; }

export const createVibeScanQueue = (): Queue<VibeScanPayload> => new Queue<VibeScanPayload>(VIBE_SCAN_QUEUE, {
  connection: createQueueConnection(),
  defaultJobOptions: {
    attempts: positiveInteger('VIBE_SCAN_JOB_ATTEMPTS', 4),
    backoff: { type: 'exponential', delay: positiveInteger('VIBE_SCAN_JOB_BACKOFF_MS', 3000), jitter: 0.5 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});
