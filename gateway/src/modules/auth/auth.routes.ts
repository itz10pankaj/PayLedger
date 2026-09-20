import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { authController } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.post('/verify-otp', authController.verifyOtp);
authRoutes.get('/me', authenticate, authController.me);
