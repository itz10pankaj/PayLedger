import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { userController } from './user.controller';

export const userRoutes = Router();

userRoutes.post('/signup/start', userController.signupStart); // sends phone OTP, no auth needed
userRoutes.post('/signup/verify', userController.signupVerify); // creates the user on success
// Internal, called by backend (not a real user session) — no shared service
// secret enforced yet. Same trust-boundary gap noted for identifyUser: fine
// while gateway is the only thing that can reach backend and vice versa in
// dev, needs locking down before production.
userRoutes.get('/by-phone/:phone', userController.getByPhone);
userRoutes.get('/me', authenticate, userController.getMe);
userRoutes.patch('/me', authenticate, userController.updateMe);
