import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { VibeScanPayload } from '../../modules/vibe-scan/queue/vibe-scan.queue.js';
import OutboxRepository from './outbox.repository.js';

export default class OutboxDispatcher {
  constructor(private readonly outbox: OutboxRepository, private readonly queue: Queue<VibeScanPayload>) {}

  async dispatchBatch(): Promise<void> {
    const owner = `dispatcher-${process.pid}-${randomUUID()}`;
    const events = await this.outbox.claimDue(owner);

    for (const event of events) {
      try {
        await this.queue.add('vibe-scan', { jobId: event.job_id, outboxEventId: event.id }, { jobId: event.job_id });
        await this.outbox.markPublished(event.id, owner);
        console.info(JSON.stringify({ event: 'vibe_scan_outbox_published', jobId: event.job_id, outboxEventId: event.id, attempt: event.attempts }));
      } catch (error) {
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        await this.outbox.scheduleRetry(event, owner, errorName);
        console.error(JSON.stringify({ event: 'vibe_scan_outbox_publish_failed', jobId: event.job_id, outboxEventId: event.id, attempt: event.attempts, errorName }));
      }
    }
  }
}
