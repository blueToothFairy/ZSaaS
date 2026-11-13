import { Request, Response } from 'express';
import AuthenticatedRequest from '../../shared/types/AuthenticatedRequest.js';
import { LoginDTO, PasswordLinkDTO, RegisterDTO } from './dto/auth.dto.js';
import AuthService, { AuthError, authCookies, cookieOptions, getCookie, refreshCookieMaxAgeMs } from './auth.service.js';

const frontendUrl = (): string => process.env.FRONTEND_URL || 'http://localhost:3000';

export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  private handleError(error: unknown, res: Response): void {
    if (error instanceof AuthError) {
      res.status(error.status).json({ success: false, message: error.message, ...(error.code ? { code: error.code } : {}) });
      return;
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      res.status(409).json({ success: false, message: 'An account already uses this email.', code: 'account_exists' });
      return;
    }
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Authentication service unavailable.' });
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = (req.body || {}) as { email?: unknown; password?: unknown; name?: unknown };
      if (typeof email !== 'string' || typeof password !== 'string' || (name !== undefined && typeof name !== 'string')) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }
      const result = await this.authService.register({ email, password, ...(typeof name === 'string' ? { name } : {}) } satisfies RegisterDTO);
      res.cookie(authCookies.refresh, result.refreshToken, cookieOptions(refreshCookieMaxAgeMs));
      res.status(201).json({ success: true, accessToken: result.accessToken, user: result.user });
    } catch (error) { this.handleError(error, res); }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = (req.body || {}) as { email?: unknown; password?: unknown };
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }
      const result = await this.authService.login({ email, password } satisfies LoginDTO);
      res.cookie(authCookies.refresh, result.refreshToken, cookieOptions(refreshCookieMaxAgeMs));
      res.json({ success: true, accessToken: result.accessToken, user: result.user });
    } catch (error) { this.handleError(error, res); }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.refresh(getCookie(req.headers.cookie, authCookies.refresh));
      res.cookie(authCookies.refresh, result.refreshToken, cookieOptions(refreshCookieMaxAgeMs));
      res.json({ success: true, accessToken: result.accessToken, user: result.user });
    } catch (error) {
      if (error instanceof AuthError) res.clearCookie(authCookies.refresh, cookieOptions());
      this.handleError(error, res);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.authService.logout(getCookie(req.headers.cookie, authCookies.refresh));
      res.clearCookie(authCookies.refresh, cookieOptions());
      res.status(204).end();
    } catch (error) { this.handleError(error, res); }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.authService.getUser((req as AuthenticatedRequest).userId || '');
      if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
      res.json({ success: true, user });
    } catch (error) { this.handleError(error, res); }
  };

  googleStart = (purpose: 'login' | 'link') => (req: Request, res: Response): void => {
    try {
      const userId = purpose === 'link' ? (req as AuthenticatedRequest).userId : undefined;
      const start = this.authService.createOAuthStart(purpose, userId);
      res.cookie(authCookies.oauth, start.cookie, { ...cookieOptions(10 * 60 * 1000), path: '/api/auth/google' });
      res.redirect(start.url);
    } catch (error) { this.handleError(error, res); }
  };

  googleLinkStart = (req: Request, res: Response): void => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) throw new AuthError(401, 'Sign in before linking Google.');
      const start = this.authService.createOAuthStart('link', userId);
      res.cookie(authCookies.oauth, start.cookie, { ...cookieOptions(10 * 60 * 1000), path: '/api/auth/google' });
      res.json({ success: true, url: start.url });
    } catch (error) { this.handleError(error, res); }
  };

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = typeof req.query.code === 'string' ? req.query.code : '';
      const state = typeof req.query.state === 'string' ? req.query.state : '';
      if (!code || !state) throw new AuthError(400, 'Google sign-in was cancelled or incomplete.', 'google_cancelled');
      const result = await this.authService.completeGoogle(code, state, getCookie(req.headers.cookie, authCookies.oauth));
      res.clearCookie(authCookies.oauth, { ...cookieOptions(), path: '/api/auth/google' });
      if ('linked' in result) { res.redirect(`${frontendUrl()}/home?googleLinked=1`); return; }
      res.cookie(authCookies.refresh, result.session.refreshToken, cookieOptions(refreshCookieMaxAgeMs));
      res.redirect(`${frontendUrl()}/home`);
    } catch (error) {
      res.clearCookie(authCookies.oauth, { ...cookieOptions(), path: '/api/auth/google' });
      const code = error instanceof AuthError ? error.code || 'google_failed' : 'google_failed';
      res.redirect(`${frontendUrl()}/sign-in?error=${encodeURIComponent(code)}`);
    }
  };

  addPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = (req.body || {}) as PasswordLinkDTO;
      if (typeof password !== 'string') throw new AuthError(400, 'Password is required.');
      await this.authService.addPassword((req as AuthenticatedRequest).userId || '', password);
      res.status(204).end();
    } catch (error) { this.handleError(error, res); }
  };
}
