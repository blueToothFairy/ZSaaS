import { Knex } from 'knex';
import { positiveInteger } from '../config/positive-integer.js';

export interface NewOutboxEvent { event_type: string; job_id: string; payload: Record<string, unknown>; }
export interface ClaimedOutboxEvent { id: string; job_id: string; attempts: number; }

export default class OutboxRepository {
  constructor(private readonly db: Knex) {}

  async create(trx: Knex.Transaction, event: NewOutboxEvent): Promise<void> {
    await trx('outbox_events').insert(event);
  }

  async claimDue(owner: string): Promise<ClaimedOutboxEvent[]> {
    const batchSize = positiveInteger('OUTBOX_BATCH_SIZE', 10);
    const leaseMs = positiveInteger('OUTBOX_LEASE_MS', 30000);
    const result = await this.db.transaction((trx) => trx.raw(`
      WITH due_events AS (
        SELECT id
        FROM public.outbox_events
        WHERE published_at IS NULL
          AND available_at <= now()
          AND (locked_until IS NULL OR locked_until < now())
        ORDER BY created_at
        LIMIT ?
        FOR UPDATE SKIP LOCKED
      )
      UPDATE public.outbox_events AS events
      SET locked_by = ?,
          locked_until = now() + (? * interval '1 millisecond'),
          attempts = events.attempts + 1
      FROM due_events
      WHERE events.id = due_events.id
      RETURNING events.id, events.job_id, events.attempts
    `, [batchSize, owner, leaseMs]));
    return (result as unknown as { rows: ClaimedOutboxEvent[] }).rows;
  }

  async markPublished(eventId: string, owner: string): Promise<void> {
    await this.db('outbox_events').where({ id: eventId, locked_by: owner }).whereNull('published_at').update({
      published_at: this.db.fn.now(), locked_by: null, locked_until: null, last_error: null,
    });
  }

  async scheduleRetry(event: ClaimedOutboxEvent, owner: string, errorName: string): Promise<void> {
    const delayMs = Math.min(300000, 1000 * 2 ** Math.min(event.attempts, 8));
    await this.db('outbox_events').where({ id: event.id, locked_by: owner }).whereNull('published_at').update({
      available_at: this.db.raw("now() + (? * interval '1 millisecond')", [delayMs]),
      locked_by: null, locked_until: null,
      last_error: `Queue publish failed (${errorName})`,
    });
  }

  async getBacklogMetrics(): Promise<{ pendingCount: number; oldestPendingSeconds: number }> {
    const row = await this.db('outbox_events').whereNull('published_at').select(
      this.db.raw('count(*)::int as pending_count'),
      this.db.raw('coalesce(extract(epoch from (now() - min(created_at))), 0)::int as oldest_pending_seconds'),
    ).first();
    return { pendingCount: Number(row?.pending_count ?? 0), oldestPendingSeconds: Number(row?.oldest_pending_seconds ?? 0) };
  }
}
