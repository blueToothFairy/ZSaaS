import { NextFunction, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import AuthenticatedRequest from '../types/AuthenticatedRequest.js';

const base64url = (value: string): string => Buffer.from(value).toString('base64url');

export const signAccessToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: userId,
    email,
    iss: process.env.JWT_ISSUER || 'vibetune-api',
    aud: process.env.JWT_AUDIENCE || 'vibetune-app',
    iat: now,
    exp: now + Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900),
  }));
  const content = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(content).digest('base64url');
  return `${content}.${signature}`;
};

export const verifyAccessToken = (token: string): { userId: string; email: string } | null => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const [headerPart, payloadPart, signature] = parts as [string, string, string];
  const expected = createHmac('sha256', secret).update(`${headerPart}.${payloadPart}`).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString()) as { alg?: string };
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString()) as {
      sub?: string; email?: string; iss?: string; aud?: string; exp?: number;
    };
    if (header.alg !== 'HS256' || !payload.sub || !payload.email || !payload.exp) return null;
    if (payload.iss !== (process.env.JWT_ISSUER || 'vibetune-api')) return null;
    if (payload.aud !== (process.env.JWT_AUDIENCE || 'vibetune-app')) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.sub, email: payload.email };
  } catch { return null; }
};

export const requireAccessToken = (req: Request, res: Response, next: NextFunction): void => {
  const value = req.headers.authorization;
  const token = value?.startsWith('Bearer ') ? value.slice(7) : '';
  const identity = token ? verifyAccessToken(token) : null;
  if (!identity) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  (req as AuthenticatedRequest).userId = identity.userId;
  next();
};
