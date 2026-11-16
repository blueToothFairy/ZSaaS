import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AuthSessionDTO, AuthUserDTO, LoginDTO, RegisterDTO } from './dto/auth.dto.js';
import { IAuthRepository, IAuthUser, RefreshSessionInput } from './interfaces/auth.interface.js';
import { signAccessToken } from '../../shared/middleware/requireAccessToken.js';

const scrypt = promisify(scryptCallback);
const REFRESH_COOKIE = 'vt_refresh';
const OAUTH_COOKIE = 'vt_oauth_state';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
export const refreshCookieMaxAgeMs = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
const production = process.env.NODE_ENV === 'production';

type OAuthState = { state: string; purpose: 'login' | 'link'; userId?: string; exp: number };

export class AuthError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

const jwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  return secret;
};

export const cookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: production,
  sameSite: 'lax' as const,
  path: '/api/auth',
  ...(maxAge === undefined ? {} : { maxAge }),
});

export const getCookie = (header: string | undefined, name: string): string | undefined => {
  const entry = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
};

const signState = (value: OAuthState): string => {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = createHmac('sha256', jwtSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifyState = (cookie: string | undefined, state: string): OAuthState | null => {
  if (!cookie) return null;
  const [payload, signature] = cookie.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', jwtSecret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OAuthState;
    if (parsed.state !== state || parsed.exp < Date.now() || !['login', 'link'].includes(parsed.purpose)) return null;
    if (parsed.purpose === 'link' && !parsed.userId) return null;
    return parsed;
  } catch { return null; }
};

export default class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  private sessionInput(rawRefresh: string): RefreshSessionInput {
    return {
      id: randomUUID(),
      tokenHash: hashToken(rawRefresh),
      expiresAt: new Date(Date.now() + refreshCookieMaxAgeMs),
    };
  }

  private async createPasswordHash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await scrypt(password, salt, 64) as Buffer;
    return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }

  private async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [algorithm, saltText, hashText] = encoded.split('$');
    if (algorithm !== 'scrypt' || !saltText || !hashText) return false;
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    const actual = await scrypt(password, salt, expected.length) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  async register(input: RegisterDTO): Promise<AuthSessionDTO> {
    const email = normalizeEmail(input.email);
    const name = input.name?.trim() || null;
    if (!/^\S+@\S+\.\S+$/.test(email) || input.password.length < 10 || input.password.length > 128 || (name !== null && name.length > 200)) {
      throw new AuthError(400, 'Enter a valid email and a password between 10 and 128 characters.');
    }
    if (await this.authRepository.findAuthUserByEmail(email)) {
      throw new AuthError(409, 'An account already uses this email. Sign in with its existing method to continue.', 'account_exists');
    }
    const user: IAuthUser = { id: randomUUID(), email, name };
    const passwordHash = await this.createPasswordHash(input.password);
    const rawRefresh = randomBytes(48).toString('base64url');
    await this.authRepository.createPasswordAccount(user, passwordHash, this.sessionInput(rawRefresh));
    return { user, accessToken: signAccessToken(user.id, user.email), refreshToken: rawRefresh };
  }

  async login(input: LoginDTO): Promise<AuthSessionDTO> {
    const email = normalizeEmail(input.email);
    if (input.password.length > 128) throw new AuthError(401, 'Email or password is incorrect.', 'invalid_credentials');
    const user = await this.authRepository.findAuthUserByEmail(email);
    const passwordHash = user ? await this.authRepository.findPasswordHash(user.id) : undefined;
    if (!user || !passwordHash || !(await this.verifyPassword(input.password, passwordHash))) {
      throw new AuthError(401, 'Email or password is incorrect.', 'invalid_credentials');
    }
    const rawRefresh = randomBytes(48).toString('base64url');
    await this.authRepository.createRefreshSession(user.id, this.sessionInput(rawRefresh));
    return { user, accessToken: signAccessToken(user.id, user.email), refreshToken: rawRefresh };
  }

  async refresh(rawToken: string | undefined): Promise<AuthSessionDTO> {
    if (!rawToken) throw new AuthError(401, 'Session expired. Please sign in again.');
    const rawReplacement = randomBytes(48).toString('base64url');
    const rotation = await this.authRepository.rotateRefreshSession(hashToken(rawToken), this.sessionInput(rawReplacement));
    if (rotation.kind === 'expired') throw new AuthError(401, 'Session expired. Please sign in again.');
    return { user: rotation.user, accessToken: signAccessToken(rotation.user.id, rotation.user.email), refreshToken: rawReplacement };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (rawToken) await this.authRepository.revokeRefreshSession(hashToken(rawToken));
  }

  async getUser(userId: string): Promise<AuthUserDTO | undefined> {
    return this.authRepository.findAuthUserById(userId);
  }

  async addPassword(userId: string, password: string): Promise<void> {
    if (password.length < 10 || password.length > 128) throw new AuthError(400, 'Password must be between 10 and 128 characters.');
    if (!(await this.authRepository.findAuthUserById(userId))) throw new AuthError(401, 'Please sign in again.');
    const result = await this.authRepository.addPassword(userId, await this.createPasswordHash(password));
    if (result === 'exists') throw new AuthError(409, 'This account already has a password.');
  }

  createOAuthStart(purpose: 'login' | 'link', userId?: string): { url: string; cookie: string } {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) throw new Error('Google OAuth is not configured');
    const state = randomBytes(32).toString('base64url');
    const payload: OAuthState = { state, purpose, exp: Date.now() + 10 * 60 * 1000, ...(userId ? { userId } : {}) };
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    }).toString();
    return { url: url.toString(), cookie: signState(payload) };
  }

  async completeGoogle(code: string, stateValue: string, stateCookie: string | undefined) {
    const state = verifyState(stateCookie, stateValue);
    if (!state) throw new AuthError(400, 'Google sign-in could not be verified. Please try again.', 'invalid_oauth_state');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) throw new Error('Google OAuth is not configured');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    if (!tokenResponse.ok) throw new AuthError(400, 'Google sign-in failed. Please try again.', 'google_exchange_failed');
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new AuthError(400, 'Google sign-in failed. Please try again.');
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) throw new AuthError(400, 'Google identity could not be verified.');
    const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string };
    if (!profile.sub || !profile.email || !profile.email_verified) throw new AuthError(400, 'Google must provide a verified email address.');
    const email = normalizeEmail(profile.email);
    const identity = await this.authRepository.findGoogleIdentity(profile.sub);

    if (state.purpose === 'link') {
      const targetUserId = state.userId;
      if (!targetUserId) throw new AuthError(400, 'Invalid account-link request.');
      const result = await this.authRepository.linkGoogleIdentity(targetUserId, profile.sub, email);
      if (result === 'missing-user') throw new AuthError(401, 'Please sign in again before linking Google.');
      if (result === 'identity-conflict') throw new AuthError(409, 'This Google account is already linked to another VibeTune account.');
      if (result === 'email-conflict') throw new AuthError(409, 'This Google email belongs to another VibeTune account.');
      return { linked: true };
    }

    if (identity) {
      const user = await this.authRepository.findAuthUserById(identity.userId);
      if (!user) throw new AuthError(401, 'Account is unavailable.');
      const rawRefresh = randomBytes(48).toString('base64url');
      await this.authRepository.createRefreshSession(user.id, this.sessionInput(rawRefresh));
      return { user, session: { accessToken: signAccessToken(user.id, user.email), refreshToken: rawRefresh }, isNewUser: false };
    }

    if (await this.authRepository.findAuthUserByEmail(email)) {
      throw new AuthError(409, 'An account already uses this email. Sign in with its existing method, then link Google from account settings.', 'account_exists');
    }
    const user: IAuthUser = { id: randomUUID(), email, name: profile.name || null };
    const rawRefresh = randomBytes(48).toString('base64url');
    await this.authRepository.createGoogleAccount(user, profile.sub, email, this.sessionInput(rawRefresh));
    return { user, session: { accessToken: signAccessToken(user.id, user.email), refreshToken: rawRefresh }, isNewUser: true };
  }
}

export const authCookies = { refresh: REFRESH_COOKIE, oauth: OAUTH_COOKIE };
