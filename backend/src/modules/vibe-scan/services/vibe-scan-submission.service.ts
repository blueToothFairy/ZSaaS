import { Knex } from 'knex';
import { ObjectStorage } from '../../../shared/storage/object-storage.js';
import AIRepository from '../interfaces/ai-output-repo.interface.js';
import OutboxRepository from '../../../shared/outbox/outbox.repository.js';
import { positiveInteger } from '../../../shared/config/positive-integer.js';
import { VibeScanQueueLimitError } from '../vibe-scan.errors.js';

export interface VibeScanSubmission {
  userId: string; image: Buffer; mimeType: string;
  country: string; platform: string; contentType: string;
  idempotencyKey?: string;
}

export default class VibeScanSubmissionService {
  constructor(private readonly db: Knex, private readonly jobs: AIRepository, private readonly outbox: OutboxRepository, private readonly storage: ObjectStorage) {}

  async submit(input: VibeScanSubmission): Promise<{ jobId: string; status: string }> {
    const stored = await this.storage.put(input.image, input.mimeType);
    try {
      const result = await this.db.transaction(async (trx) => {
        await trx.raw('select pg_advisory_xact_lock(hashtext(?))', [input.userId]);
        if (input.idempotencyKey) {
          const existing = await trx('recommendation_jobs').where({ user_id: input.userId, idempotency_key: input.idempotencyKey }).first('id', 'status');
          if (existing) return { jobId: String(existing.id), status: String(existing.status), reused: true };
        }
        const outstanding = await trx('recommendation_jobs').where({ user_id: input.userId }).whereIn('status', ['queued', 'processing']).count('* as count').first();
        if (Number(outstanding?.count ?? 0) >= positiveInteger('VIBE_SCAN_MAX_OUTSTANDING_PER_USER', 3)) throw new VibeScanQueueLimitError();
        const job = await this.jobs.create({
          user_id: input.userId,
          feature_type: 'match_music',
          status: 'queued',
          ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),
          input_params: {
            imageKey: stored.key, mimeType: input.mimeType,
            country: input.country, requestContext: { platform: input.platform, contentType: input.contentType },
          },
          output_data: {},
        }, trx);
        await this.outbox.create(trx, {
          event_type: 'vibe_scan.requested', job_id: job.id, payload: { jobId: job.id },
        });
        return { jobId: job.id, status: 'queued', reused: false };
      });
      if (result.reused) await this.storage.delete(stored.key).catch(() => undefined);
      return { jobId: result.jobId, status: result.status };
    } catch (error) {
      await this.storage.delete(stored.key).catch(() => undefined);
      if (input.idempotencyKey) {
        const existing = await this.db('recommendation_jobs').where({ user_id: input.userId, idempotency_key: input.idempotencyKey }).first('id', 'status');
        if (existing) return { jobId: String(existing.id), status: String(existing.status) };
      }
      throw error;
    }
  }
}
