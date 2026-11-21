import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export interface StoredUpload { key: string; }

export interface ObjectStorage {
  put(image: Buffer, mimeType: string): Promise<StoredUpload>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  listOlderThan(prefix: string, cutoff: Date, limit?: number): Promise<string[]>;
}

export class LocalObjectStorage implements ObjectStorage {
  private readonly root = resolve(process.env.VIBE_SCAN_LOCAL_STORAGE_PATH ?? '.local-vibe-uploads');

  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    const rel = relative(this.root, path);
    if (!rel || rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) throw new Error('Invalid object key');
    return path;
  }

  async put(image: Buffer, mimeType: string): Promise<StoredUpload> {
    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
    const key = `vibe-scan/${randomUUID()}.${extension}`;
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, image, { flag: 'wx' });
    return { key };
  }

  async get(key: string): Promise<Buffer> { return readFile(this.pathFor(key)); }

  async delete(key: string): Promise<void> { await unlink(this.pathFor(key)).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; }); }

  async listOlderThan(prefix: string, cutoff: Date, limit = 1000): Promise<string[]> {
    if (prefix !== 'vibe-scan/') return [];
    const directory = this.pathFor('vibe-scan/.sentinel').replace(`${sep}.sentinel`, '');
    const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return []; throw error; });
    const expired: string[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const key = `${prefix}${entry.name}`;
      const details = await stat(this.pathFor(key));
      if (details.mtime < cutoff) expired.push(key);
      if (expired.length >= limit) break;
    }
    return expired;
  }
}

export class R2ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET ?? '';
    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket) throw new Error('Cloudflare R2 storage is not configured');
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async put(image: Buffer, mimeType: string): Promise<StoredUpload> {
    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
    const key = `vibe-scan/${randomUUID()}.${extension}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: image, ContentType: mimeType }));
    return { key };
  }

  async get(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!result.Body) throw new Error('Stored image is unavailable');
    return Buffer.from(await result.Body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async listOlderThan(prefix: string, cutoff: Date, limit = 1000): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }));
      for (const object of page.Contents ?? []) {
        if (object.Key && object.LastModified && object.LastModified < cutoff) keys.push(object.Key);
        if (keys.length >= limit) break;
      }
      if (keys.length >= limit) break;
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
    return keys;
  }
}

export const createObjectStorage = (): ObjectStorage => {
  const hasR2Credentials = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);
  if (hasR2Credentials || process.env.NODE_ENV === 'production') return new R2ObjectStorage();
  return new LocalObjectStorage();
};
