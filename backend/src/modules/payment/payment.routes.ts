import { Router } from 'express';
import { identifyUser } from '../../common/middlewares/identifyUser';
import { paymentController } from './payment.controller';

export const paymentRoutes = Router();

paymentRoutes.use(identifyUser);

paymentRoutes.post('/', paymentController.create);
paymentRoutes.post('/deposit', paymentController.deposit);
paymentRoutes.get('/resolve-recipient', paymentController.resolveRecipient);
