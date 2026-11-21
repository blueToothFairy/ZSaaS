import { Response } from 'express';
import AuthenticatedRequest from '../../shared/types/AuthenticatedRequest.js';
import { resolveCountryCodeFromRequest } from '../../shared/utils/requestCountry.js';
import VibeScanApplicationService from './services/vibe-scan-application.service.js';
import { VibeScanMusicTasteRequiredError, VibeScanQueueLimitError } from './vibe-scan.errors.js';

const isSupportedImage = (buffer: Buffer, mime: string): boolean => {
  if (mime === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return mime === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
};

export default class VibeScannerController {
  constructor(private readonly vibeScanService: VibeScanApplicationService) {}

  async submit(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const file = req.file;
    if (!file) { res.status(400).json({ error: 'No image file provided' }); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) || !isSupportedImage(file.buffer, file.mimetype)) {
      res.status(400).json({ error: 'Invalid image file' }); return;
    }
    const platform = typeof req.body?.platform === 'string' ? req.body.platform.trim() : 'unspecified';
    const contentType = typeof req.body?.contentType === 'string' ? req.body.contentType.trim() : 'unspecified';
    const idempotencyKey = req.get('Idempotency-Key')?.trim();
    if (idempotencyKey && (idempotencyKey.length > 128 || /[\r\n]/.test(idempotencyKey))) { res.status(400).json({ error: 'Invalid Idempotency-Key' }); return; }
    if (platform.length > 80 || contentType.length > 80) { res.status(400).json({ error: 'Intent values must be 80 characters or fewer' }); return; }
    try {
      const { jobId, status } = await this.vibeScanService.submit({ userId, image: file.buffer, mimeType: file.mimetype,
        country: resolveCountryCodeFromRequest(req) ?? 'US', platform: platform || 'unspecified', contentType: contentType || 'unspecified',
        ...(idempotencyKey ? { idempotencyKey } : {}) });
      res.location(`/api/vibe-scan/jobs/${jobId}`).set('Retry-After', '2').status(202).json({ jobId, status });
    } catch (error) {
      if (error instanceof VibeScanQueueLimitError) { res.status(429).json({ error: error.message }); return; }
      if (error instanceof VibeScanMusicTasteRequiredError) { res.status(400).json({ error: error.message }); return; }
      console.error('Vibe Scan submission failed:', error instanceof Error ? error.name : 'unknown error');
      res.status(503).json({ error: 'Vibe Scan is temporarily unavailable' });
    }
  }

  async getJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const rawJobId = req.params.jobId;
    const jobId = Array.isArray(rawJobId) ? rawJobId[0] ?? '' : rawJobId ?? '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) { res.status(404).json({ error: 'Job not found' }); return; }
    try {
      const job = await this.vibeScanService.findOwnedJob(jobId, req.userId);
      if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
      res.json({ jobId: job.id, status: job.status, stage: job.stage ?? null,
        ...(job.status === 'completed' ? {
          success: true,
          result: job.output_data,
          recommendations: job.output_data.recommendations,
          songs: (job.output_data.recommendations ?? []).map((item: Record<string, unknown>) => ({ ...(item.track as object), score: item.score, componentScores: item.componentScores, reasons: item.reasons })),
        } : {}),
        ...(job.status === 'failed' ? { error: { code: job.error_code ?? 'PROCESSING_FAILED', message: job.error_message ?? 'Could not process this image' } } : {}),
      });
    } catch (error) {
      console.error('Vibe Scan status lookup failed:', error instanceof Error ? error.name : 'unknown error');
      res.status(503).json({ error: 'Job status is temporarily unavailable' });
    }
  }
}
