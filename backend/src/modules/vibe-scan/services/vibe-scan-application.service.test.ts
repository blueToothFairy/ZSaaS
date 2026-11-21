import test from 'node:test';
import assert from 'node:assert/strict';
import AIRepository from '../interfaces/ai-output-repo.interface.js';
import { AIOutputDTO } from '../dto/ai-repo.js';
import MusicTasteService from '../../profile/services/music-taste.service.js';
import VibeScanSubmissionService from './vibe-scan-submission.service.js';
import VibeScanApplicationService, { VibeScanMusicTasteRequiredError } from './vibe-scan-application.service.js';

const job = (feature: AIOutputDTO['feature_type'] = 'match_music'): AIOutputDTO => ({
  id: 'd9428888-a323-4e7a-b8f1-cf609e2e2461', user_id: 'user-1', feature_type: feature,
  input_params: {}, output_data: {}, status: 'queued', created_at: new Date(), updated_at: new Date(),
});

const createService = (options: {
  existing?: AIOutputDTO;
  qualifies?: boolean;
  ownedJob?: AIOutputDTO;
} = {}) => {
  let tasteReads = 0;
  let submissions = 0;
  const repository = {
    findByIdempotencyKey: async () => options.existing,
    findByIdAndUserId: async () => options.ownedJob,
  } as unknown as AIRepository;
  const taste = {
    getProfile: async () => { tasteReads += 1; return { qualifiesForRecommendations: options.qualifies ?? true }; },
  } as unknown as MusicTasteService;
  const submission = {
    submit: async () => { submissions += 1; return { jobId: 'new-job', status: 'queued' }; },
  } as unknown as VibeScanSubmissionService;
  return {
    service: new VibeScanApplicationService(repository, taste, submission),
    getCounts: () => ({ tasteReads, submissions }),
  };
};

test('idempotent submissions return the existing job without reading taste or storing another upload', async () => {
  const existing = job();
  const { service, getCounts } = createService({ existing });
  const result = await service.submit({ userId: 'user-1', image: Buffer.from('image'), mimeType: 'image/jpeg', country: 'US', platform: 'unspecified', contentType: 'unspecified', idempotencyKey: 'key-1' });
  assert.deepEqual(result, { jobId: existing.id, status: 'queued' });
  assert.deepEqual(getCounts(), { tasteReads: 0, submissions: 0 });
});

test('submissions without qualifying music taste are rejected before the submission service runs', async () => {
  const { service, getCounts } = createService({ qualifies: false });
  await assert.rejects(
    service.submit({ userId: 'user-1', image: Buffer.from('image'), mimeType: 'image/jpeg', country: 'US', platform: 'unspecified', contentType: 'unspecified' }),
    VibeScanMusicTasteRequiredError,
  );
  assert.deepEqual(getCounts(), { tasteReads: 1, submissions: 0 });
});

test('owner lookup hides non Vibe Scan jobs', async () => {
  const { service } = createService({ ownedJob: job('article_gen') });
  assert.equal(await service.findOwnedJob('job-1', 'user-1'), undefined);
});
