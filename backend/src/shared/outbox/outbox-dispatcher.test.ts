import test from 'node:test';
import assert from 'node:assert/strict';
import OutboxDispatcher from './outbox-dispatcher.js';
import OutboxRepository, { ClaimedOutboxEvent } from './outbox.repository.js';
import { VibeScanPayload } from '../../modules/vibe-scan/queue/vibe-scan.queue.js';
import { Queue } from 'bullmq';

const event: ClaimedOutboxEvent = { id: 'outbox-1', job_id: 'job-1', attempts: 1 };

test('OutboxDispatcher publishes a stable job ID and marks the event published', async () => {
  const calls: unknown[][] = [];
  let owner = '';
  const outbox = {
    claimDue: async () => [event],
    markPublished: async (...args: unknown[]) => { owner = String(args[1]); calls.push(['published', ...args]); },
    scheduleRetry: async (...args: unknown[]) => { calls.push(['retry', ...args]); },
  } as unknown as OutboxRepository;
  const queue = { add: async (...args: unknown[]) => { calls.push(['add', ...args]); } } as unknown as Queue<VibeScanPayload>;
  await new OutboxDispatcher(outbox, queue).dispatchBatch();
  assert.deepEqual(calls, [
    ['add', 'vibe-scan', { jobId: 'job-1', outboxEventId: 'outbox-1' }, { jobId: 'job-1' }],
    ['published', 'outbox-1', owner],
  ]);
  assert.match(owner, new RegExp(`^dispatcher-${process.pid}-[0-9a-f-]{36}$`));
});

test('OutboxDispatcher schedules retry when Redis enqueue fails', async () => {
  let retry: unknown[] | undefined;
  let owner = '';
  const outbox = {
    claimDue: async () => [event],
    markPublished: async () => { assert.fail('should not mark a failed publish as published'); },
    scheduleRetry: async (...args: unknown[]) => { owner = String(args[1]); retry = args; },
  } as unknown as OutboxRepository;
  const queue = { add: async () => { throw new Error('connection details are not logged'); } } as unknown as Queue<VibeScanPayload>;
  await new OutboxDispatcher(outbox, queue).dispatchBatch();
  assert.equal(retry?.[0], event);
  assert.match(owner, new RegExp(`^dispatcher-${process.pid}-[0-9a-f-]{36}$`));
  assert.equal(retry?.[2], 'Error');
});
