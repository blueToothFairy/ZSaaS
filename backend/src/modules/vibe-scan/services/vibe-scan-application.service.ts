import AIRepository from '../interfaces/ai-output-repo.interface.js';
import { AIOutputDTO } from '../dto/ai-repo.js';
import MusicTasteService from '../../profile/services/music-taste.service.js';
import VibeScanSubmissionService, { VibeScanSubmission } from './vibe-scan-submission.service.js';
import { VibeScanMusicTasteRequiredError } from '../vibe-scan.errors.js';

export default class VibeScanApplicationService {
  constructor(
    private readonly jobs: AIRepository,
    private readonly musicTaste: MusicTasteService,
    private readonly submission: VibeScanSubmissionService,
  ) {}

  async submit(input: VibeScanSubmission): Promise<{ jobId: string; status: string }> {
    if (input.idempotencyKey) {
      const existing = await this.jobs.findByIdempotencyKey(input.userId, input.idempotencyKey);
      if (existing) return { jobId: existing.id, status: existing.status };
    }

    const taste = await this.musicTaste.getProfile(input.userId);
    if (!taste.qualifiesForRecommendations) throw new VibeScanMusicTasteRequiredError();
    return this.submission.submit(input);
  }

  async findOwnedJob(jobId: string, userId: string): Promise<AIOutputDTO | undefined> {
    const job = await this.jobs.findByIdAndUserId(jobId, userId);
    return job?.feature_type === 'match_music' ? job : undefined;
  }
}

export { VibeScanMusicTasteRequiredError, VibeScanQueueLimitError } from '../vibe-scan.errors.js';
