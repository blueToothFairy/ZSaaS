import { Redis } from 'ioredis';

export const createQueueConnection = (): Redis => {
  const url = process.env.BULLMQ_REDIS_URL ?? process.env.REDIS_URL;
  if (!url) throw new Error('BULLMQ_REDIS_URL is required for the Vibe Scan queue');
  const parsed = new URL(url);
  parsed.pathname = '/0';
  return new Redis(parsed.toString(), { maxRetriesPerRequest: null, enableReadyCheck: false });
};
