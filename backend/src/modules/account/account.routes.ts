import { Router } from 'express';
import { identifyUser } from '../../common/middlewares/identifyUser';
import { accountController } from './account.controller';

export const accountRoutes = Router();

accountRoutes.use(identifyUser); // every account route requires a caller identified by the gateway

accountRoutes.post('/start', accountController.startCreate); // sends OTP, no account created yet
accountRoutes.post('/verify', accountController.verifyCreate); // creates the account on success
accountRoutes.get('/', accountController.list);
accountRoutes.get('/:id', accountController.getById);
accountRoutes.get('/:id/balance', accountController.getBalance);
accountRoutes.get('/:id/ledger', accountController.getLedger);
accountRoutes.patch('/:id/primary', accountController.setPrimary);
accountRoutes.patch('/:id/pin', accountController.setPin);
