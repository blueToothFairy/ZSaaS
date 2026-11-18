import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { createServer, Server } from 'node:http';
import express from 'express';
import { after, before, describe, it } from 'node:test';
import AuthController from './auth.controller.js';
import AuthService from './auth.service.js';
import AuthTestRepository from './auth.test-repository.js';

const originalEnvironment = new Map<string, string | undefined>();
const environmentKeys = ['JWT_SECRET', 'FRONTEND_URL', 'RESEND_API_KEY', 'NODE_ENV'];
const nativeFetch = globalThis.fetch;
const repository = new AuthTestRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);
const app = express();
app.use(express.json());
app.post('/api/auth/register', controller.register);
app.post('/api/auth/login', controller.login);
app.post('/api/auth/password/forgot', controller.requestPasswordReset);
app.post('/api/auth/password/reset', controller.resetPassword);

let server: Server;
let apiBaseUrl = '';
let resendPayload: Record<string, unknown> | undefined;
let resolveEmailDelivery: (() => void) | undefined;
let emailDelivery: Promise<void>;

describe('Auth HTTP integration', () => {
  before(async () => {
    for (const key of environmentKeys) originalEnvironment.set(key, process.env[key]);
    process.env.JWT_SECRET = 'auth-integration-test-secret-at-least-32-characters';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'https://vibetune.test';
    process.env.RESEND_API_KEY = 're_integration_test_key';

    emailDelivery = new Promise<void>((resolve) => { resolveEmailDelivery = resolve; });
    globalThis.fetch = async (input, init) => {
      if (String(input) === 'https://api.resend.com/emails') {
        resendPayload = JSON.parse(String(init?.body)) as Record<string, unknown>;
        resolveEmailDelivery?.();
        return Response.json({ id: 'mock-email-id' });
      }
      return nativeFetch(input, init);
    };

    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    apiBaseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (server?.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    globalThis.fetch = nativeFetch;
    for (const key of environmentKeys) {
      const value = originalEnvironment.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    originalEnvironment.clear();
  });

  it('registers, sends a mocked reset email, resets once, and logs in with the new password', async () => {
    const email = `auth-integration-${Date.now()}@example.test`;
    const registration = await nativeFetch(`${apiBaseUrl}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'initial-password-value', name: 'Integration Listener' }),
    });
    const registrationBody = await registration.json() as { success: boolean; user: { email: string } };
    assert.equal(registration.status, 201);
    assert.equal(registrationBody.success, true);
    assert.equal(registrationBody.user.email, email);
    assert.match(registration.headers.get('set-cookie') || '', /HttpOnly/i);

    const unknownRecovery = await nativeFetch(`${apiBaseUrl}/api/auth/password/forgot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.test' }),
    });
    const unknownBody = await unknownRecovery.json() as { message: string };
    const knownRecovery = await nativeFetch(`${apiBaseUrl}/api/auth/password/forgot`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const knownBody = await knownRecovery.json() as { message: string };
    assert.equal(unknownRecovery.status, 200);
    assert.equal(knownRecovery.status, 200);
    assert.deepEqual(knownBody, unknownBody, 'recovery response does not disclose account existence');

    await emailDelivery;
    const emailPayload = resendPayload;
    assert.ok(emailPayload);
    assert.equal(emailPayload.from, 'VibeTune <noreply@mail.vibetune.ai>');
    assert.deepEqual(emailPayload.to, [email]);
    const resetUrlText = String(emailPayload.text).match(/https:\/\/[^\s]+/)?.[0];
    assert.ok(resetUrlText);
    const token = new URL(resetUrlText).searchParams.get('token');
    assert.ok(token);

    const reset = await nativeFetch(`${apiBaseUrl}/api/auth/password/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'replacement-password-value' }),
    });
    assert.equal(reset.status, 200);

    const reuse = await nativeFetch(`${apiBaseUrl}/api/auth/password/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'another-password-value' }),
    });
    assert.equal(reuse.status, 400);

    const oldLogin = await nativeFetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'initial-password-value' }),
    });
    const newLogin = await nativeFetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'replacement-password-value' }),
    });
    assert.equal(oldLogin.status, 401);
    assert.equal(newLogin.status, 200);
  });
});
