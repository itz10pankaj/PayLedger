import { Router } from 'express';
import { authRoutes } from './auth/auth.routes';
import { userRoutes } from './user/user.routes';

// New gateway-owned modules get one line here, same pattern as the backend.
export const moduleRoutes = Router();

moduleRoutes.use('/auth', authRoutes);
moduleRoutes.use('/users', userRoutes);
