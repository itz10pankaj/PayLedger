import { Router } from 'express';
import { identifyUser } from '../../common/middlewares/identifyUser';
import { paymentIntentController } from './paymentIntent.controller';

export const paymentIntentRoutes = Router();

paymentIntentRoutes.use(identifyUser);

paymentIntentRoutes.get('/pending', paymentIntentController.listPending);
paymentIntentRoutes.get('/history', paymentIntentController.history);
paymentIntentRoutes.get('/sent', paymentIntentController.sent);
paymentIntentRoutes.post('/:id/approve', paymentIntentController.approve);
paymentIntentRoutes.post('/:id/decline', paymentIntentController.decline);
