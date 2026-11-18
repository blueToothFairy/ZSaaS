import { Router } from 'express';
import { requireAccessToken } from '../../shared/middleware/requireAccessToken.js';
import { createAuthEndpointLimiter } from '../../shared/middleware/rateLimiting.js';
import authController from './auth.module.js';

const router = Router();
const credentialLimiter = createAuthEndpointLimiter('rl:auth:credentials:', 10);
const refreshLimiter = createAuthEndpointLimiter('rl:auth:refresh:', 60);
const oauthLimiter = createAuthEndpointLimiter('rl:auth:oauth:', 20);
const passwordForgotLimiter = createAuthEndpointLimiter('rl:auth:password-forgot:', 5);
const passwordResetLimiter = createAuthEndpointLimiter('rl:auth:password-reset:', 10);
router.post('/register', credentialLimiter, authController.register);
router.post('/login', credentialLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAccessToken, authController.me);
router.get('/google', oauthLimiter, authController.googleStart('login'));
router.post('/google/link/start', requireAccessToken, oauthLimiter, authController.googleLinkStart);
router.get('/google/callback', oauthLimiter, authController.googleCallback);
router.post('/password/link', requireAccessToken, authController.addPassword);
router.post('/password/forgot', passwordForgotLimiter, authController.requestPasswordReset);
router.post('/password/reset', passwordResetLimiter, authController.resetPassword);

export default router;
