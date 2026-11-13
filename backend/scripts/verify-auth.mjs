import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import 'dotenv/config';

const baseUrl = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const email = `iss003-${randomUUID()}@example.test`;
const password = 'Verification-password-2026!';

async function request(path, { body, cookie, token, method = 'POST', origin } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(origin ? { origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'manual',
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* OAuth redirects may return text. */ }
  const refreshCookie = response.headers.getSetCookie?.().find((value) => value.startsWith('vt_refresh='));
  const cookieValue = refreshCookie?.split(';', 1)[0];
  return { response, data, cookie: cookieValue, setCookie: refreshCookie };
}

function createOneSecondAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  assert.ok(secret && secret.length >= 32, 'JWT_SECRET is configured for the backend');
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: user.id,
    email: user.email,
    iss: process.env.JWT_ISSUER || 'vibetune-api',
    aud: process.env.JWT_AUDIENCE || 'vibetune-app',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1,
  });
  const content = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(content).digest('base64url');
  return `${content}.${signature}`;
}

try {
  const registered = await request('/api/auth/register', { body: { email, password, name: 'ISS-003 verification' } });
  assert.equal(registered.response.status, 201, `registration returned ${registered.response.status}`);
  assert.ok(registered.data.accessToken, 'registration returns an access token');
  assert.ok(registered.cookie, 'registration sets an HttpOnly refresh cookie');
  assert.match(registered.setCookie, /; HttpOnly/i, 'refresh cookie is HttpOnly');
  assert.match(registered.setCookie, /; SameSite=Lax/i, 'refresh cookie uses SameSite=Lax');
  assert.match(registered.setCookie, /; Path=\/api\/auth/i, 'refresh cookie is scoped to auth endpoints');

  const duplicate = await request('/api/auth/register', { body: { email, password } });
  assert.equal(duplicate.response.status, 409, 'duplicate email is rejected');

  const invalidLogin = await request('/api/auth/login', { body: { email, password: 'wrong-password' } });
  assert.equal(invalidLogin.response.status, 401, 'invalid credentials are rejected');

  const login = await request('/api/auth/login', { body: { email, password } });
  assert.equal(login.response.status, 200, 'valid credentials sign in');
  assert.ok(login.cookie, 'login sets refresh cookie');

  const restored = await request('/api/auth/refresh', { cookie: login.cookie });
  assert.equal(restored.response.status, 200, 'refresh restores a session');
  assert.ok(restored.data.accessToken, 'refresh returns a new access token');
  assert.ok(restored.cookie && restored.cookie !== login.cookie, 'refresh rotates the cookie');

  const replay = await request('/api/auth/refresh', { cookie: login.cookie });
  assert.equal(replay.response.status, 401, 'a rotated refresh cookie cannot be replayed');
  const revokedFamily = await request('/api/auth/refresh', { cookie: restored.cookie });
  assert.equal(revokedFamily.response.status, 401, 'refresh-token reuse revokes its session family');

  const noToken = await request('/api/profile/favorites', { method: 'GET' });
  assert.equal(noToken.response.status, 401, 'protected APIs reject requests without an access token');
  const malformedToken = await request('/api/profile/favorites', { method: 'GET', token: 'not.a.valid-token' });
  assert.equal(malformedToken.response.status, 401, 'protected APIs reject malformed access tokens');
  const me = await request('/api/auth/me', { method: 'GET', token: login.data.accessToken });
  assert.equal(me.response.status, 200, 'valid access token authenticates /me');
  assert.equal(me.data.user.id, login.data.user.id, 'the token subject maps to the registered internal user ID');

  const cors = await request('/api/auth/refresh', { method: 'OPTIONS', origin: 'http://localhost:3000' });
  assert.equal(cors.response.headers.get('access-control-allow-origin'), 'http://localhost:3000', 'local frontend origin is allowed by CORS');
  assert.equal(cors.response.headers.get('access-control-allow-credentials'), 'true', 'CORS permits credentialed refresh cookies');

  const shortLivedToken = createOneSecondAccessToken(login.data.user);
  await new Promise((resolve) => setTimeout(resolve, 1_200));
  const expiredToken = await request('/api/auth/me', { method: 'GET', token: shortLivedToken });
  assert.equal(expiredToken.response.status, 401, 'a correctly signed one-second access token is rejected after expiry');

  const googleStart = await request('/api/auth/google', { method: 'GET' });
  assert.equal(googleStart.response.status, 302, 'Google OAuth start redirects to the provider');
  const googleUrl = new URL(googleStart.response.headers.get('location'));
  assert.equal(googleUrl.hostname, 'accounts.google.com', 'Google OAuth uses the Google authorization endpoint');
  assert.ok(googleUrl.searchParams.get('state'), 'Google OAuth start includes a state value');
  assert.ok(googleStart.response.headers.getSetCookie?.().some((value) => value.startsWith('vt_oauth_state=')), 'Google OAuth start sets a state cookie');

  const cancelledGoogle = await request('/api/auth/google/callback', { method: 'GET' });
  assert.equal(new URL(cancelledGoogle.response.headers.get('location')).searchParams.get('error'), 'google_cancelled', 'callback without code/state is rejected');
  const invalidGoogleState = await request('/api/auth/google/callback?code=unused&state=invalid', { method: 'GET' });
  assert.equal(new URL(invalidGoogleState.response.headers.get('location')).searchParams.get('error'), 'invalid_oauth_state', 'callback with missing/invalid state cookie is rejected');

  const loggedIn = await request('/api/auth/login', { body: { email, password } });
  const logout = await request('/api/auth/logout', { cookie: loggedIn.cookie });
  assert.equal(logout.response.status, 204, 'logout succeeds');
  const afterLogout = await request('/api/auth/refresh', { cookie: loggedIn.cookie });
  assert.equal(afterLogout.response.status, 401, 'logout revokes the refresh cookie');

  console.log('ISS-003 auth verification passed. A uniquely named verification account remains in the database.');
} catch (error) {
  console.error('ISS-003 auth verification failed:', error);
  process.exitCode = 1;
}
