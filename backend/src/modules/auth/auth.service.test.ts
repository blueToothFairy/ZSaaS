import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, it } from 'node:test';
import AuthService, { AuthError } from './auth.service.js';
import AuthTestRepository from './auth.test-repository.js';

const TEST_JWT_SECRET = 'auth-unit-test-secret-that-is-at-least-32-characters';
const TEST_RESEND_KEY = 're_unit_test_key';
const originalEnvironment = new Map<string, string | undefined>();
const environmentKeys = ['JWT_SECRET', 'FRONTEND_URL', 'RESEND_API_KEY', 'NODE_ENV'];
const originalFetch = globalThis.fetch;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
const captureEnvironment = (): void => { for (const key of environmentKeys) originalEnvironment.set(key, process.env[key]); };
const restoreEnvironment = (): void => {
  for (const key of environmentKeys) {
    const value = originalEnvironment.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  originalEnvironment.clear();
  globalThis.fetch = originalFetch;
};

describe('AuthService', () => {
  beforeEach(() => {
    captureEnvironment();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'https://vibetune.test';
    process.env.RESEND_API_KEY = TEST_RESEND_KEY;
  });
  afterEach(restoreEnvironment);

  it('registers normalized email, hashes the password, and creates a refresh session', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);

    const result = await service.register({ email: '  Listener@Example.com ', password: 'long-enough-password', name: ' Listener ' });

    assert.equal(result.user.email, 'listener@example.com');
    assert.equal(result.user.name, 'Listener');
    assert.match(result.accessToken, /^[^.]+\.[^.]+\.[^.]+$/);
    assert.ok(result.refreshToken.length >= 60);
    assert.match((await repository.findPasswordHash(result.user.id)) || '', /^scrypt\$/);
    assert.equal(repository.activeSessionCount(result.user.id), 1);
  });

  it('rejects invalid registration input and duplicate email addresses', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);

    await assert.rejects(service.register({ email: 'invalid', password: 'long-enough-password' }), (error: unknown) => error instanceof AuthError && error.status === 400);
    await service.register({ email: 'listener@example.com', password: 'long-enough-password' });
    await assert.rejects(service.register({ email: 'LISTENER@example.com', password: 'another-long-password' }), (error: unknown) => error instanceof AuthError && error.status === 409 && error.code === 'account_exists');
  });

  it('authenticates correct credentials and gives the same error for a wrong password', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    await service.register({ email: 'listener@example.com', password: 'long-enough-password' });

    const result = await service.login({ email: 'LISTENER@example.com', password: 'long-enough-password' });
    assert.equal(result.user.email, 'listener@example.com');
    await assert.rejects(service.login({ email: 'listener@example.com', password: 'incorrect-password' }), (error: unknown) => error instanceof AuthError && error.status === 401 && error.code === 'invalid_credentials');
    await assert.rejects(service.login({ email: 'missing@example.com', password: 'incorrect-password' }), (error: unknown) => error instanceof AuthError && error.status === 401 && error.code === 'invalid_credentials');
  });

  it('rotates refresh tokens, rejects replay, and revokes sessions on logout', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    const registered = await service.register({ email: 'listener@example.com', password: 'long-enough-password' });

    const refreshed = await service.refresh(registered.refreshToken);
    assert.notEqual(refreshed.refreshToken, registered.refreshToken);
    assert.equal(repository.activeSessionCount(registered.user.id), 1);
    await assert.rejects(service.refresh(registered.refreshToken), (error: unknown) => error instanceof AuthError && error.status === 401);
    assert.equal(repository.activeSessionCount(registered.user.id), 0, 'refresh-token replay revokes the active family');

    const secondLogin = await service.login({ email: registered.user.email, password: 'long-enough-password' });
    await service.logout(secondLogin.refreshToken);
    await assert.rejects(service.refresh(secondLogin.refreshToken), (error: unknown) => error instanceof AuthError && error.status === 401);
  });

  it('sends a time-limited reset link through Resend and persists only the token hash', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    const user = await service.register({ email: 'listener@example.com', password: 'long-enough-password' });
    let emailPayload: Record<string, unknown> | undefined;
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), 'https://api.resend.com/emails');
      assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${TEST_RESEND_KEY}`);
      emailPayload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({ id: 'email-test-id' });
    };

    await service.requestPasswordReset(' LISTENER@example.com ');

    assert.equal(emailPayload?.from, 'VibeTune <noreply@mail.vibetune.ai>');
    assert.deepEqual(emailPayload?.to, ['listener@example.com']);
    assert.equal(emailPayload?.subject, 'Reset your VibeTune password');
    const resetUrlText = String(emailPayload?.text).match(/https:\/\/[^\s]+/)?.[0];
    assert.ok(resetUrlText);
    const resetUrl = new URL(resetUrlText);
    const token = resetUrl.searchParams.get('token');
    assert.equal(resetUrl.origin, 'https://vibetune.test');
    assert.equal(resetUrl.pathname, '/reset-password');
    assert.ok(token);
    assert.equal(repository.hasResetTokenHash(token), false, 'raw token is not stored');
    assert.ok(repository.hasResetTokenHash(hashToken(token)), 'only its SHA-256 hash is stored');
    const expiresAt = repository.getResetTokenExpiry(hashToken(token));
    assert.ok(expiresAt);
    assert.ok(expiresAt.getTime() - Date.now() <= 30 * 60 * 1000);
    assert.equal(repository.activeSessionCount(user.user.id), 1);
  });

  it('does not issue reset tokens or send email for unknown and Google-only accounts', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    const googleUser = await repository.addGoogleOnlyUser('google@example.com');
    let sendCount = 0;
    globalThis.fetch = async () => { sendCount += 1; return Response.json({ id: 'unexpected' }); };

    await service.requestPasswordReset('unknown@example.com');
    await service.requestPasswordReset(googleUser.email);

    assert.equal(sendCount, 0);
    assert.equal(repository.resetTokenCount(googleUser.id), 0);
  });

  it('resets a password once, rejects expired and reused tokens, and revokes refresh sessions', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    const registered = await service.register({ email: 'listener@example.com', password: 'old-password-value' });
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    await repository.createPasswordResetToken(registered.user.id, tokenHash, new Date(Date.now() + 60_000));

    await service.resetPassword(rawToken, 'new-password-value');

    assert.equal(repository.activeSessionCount(registered.user.id), 0);
    await assert.rejects(service.login({ email: registered.user.email, password: 'old-password-value' }), (error: unknown) => error instanceof AuthError && error.status === 401);
    await service.login({ email: registered.user.email, password: 'new-password-value' });
    await assert.rejects(service.resetPassword(rawToken, 'another-password-value'), (error: unknown) => error instanceof AuthError && error.status === 400);

    const expiredToken = randomBytes(32).toString('base64url');
    await repository.createPasswordResetToken(registered.user.id, hashToken(expiredToken), new Date(Date.now() - 1_000));
    await assert.rejects(service.resetPassword(expiredToken, 'expired-password-value'), (error: unknown) => error instanceof AuthError && error.status === 400);
  });

  it('enforces password length when resetting or linking a password', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    const googleUser = await repository.addGoogleOnlyUser('google@example.com');

    await assert.rejects(service.addPassword(googleUser.id, 'short'), (error: unknown) => error instanceof AuthError && error.status === 400);
    await assert.rejects(service.resetPassword('A'.repeat(43), 'short'), (error: unknown) => error instanceof AuthError && error.status === 400);
  });

  it('allows adding a password to a Google account once and reports its linked methods', async () => {
    const repository = new AuthTestRepository();
    const service = new AuthService(repository);
    const user = await repository.addGoogleOnlyUser('google@example.com');

    await service.addPassword(user.id, 'long-enough-password');
    assert.deepEqual(await service.getAuthMethods(user.id), { password: true, google: true });
    await assert.rejects(service.addPassword(user.id, 'another-long-password'), (error: unknown) => error instanceof AuthError && error.status === 409);
  });
});
