import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { userController } from './user.controller';

export const userRoutes = Router();

userRoutes.post('/signup/start', userController.signupStart); // sends phone OTP, no auth needed
userRoutes.post('/signup/verify', userController.signupVerify); // creates the user on success
userRoutes.get('/:id', authenticate, userController.getById);
userRoutes.patch('/:id', authenticate, userController.update);
