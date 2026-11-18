import db from '../../shared/db/knexClient.js';
import AuthController from './auth.controller.js';
import AuthRepository from './repositories/auth.knex.js';
import AuthService from './auth.service.js';

const authRepository = new AuthRepository(db);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export default authController;
