import { Router } from 'express';
import { identifyUser } from '../../common/middlewares/identifyUser';
import { accountController } from './account.controller';

export const accountRoutes = Router();

accountRoutes.use(identifyUser); // every account route requires a caller identified by the gateway

accountRoutes.post('/', accountController.create);
accountRoutes.get('/', accountController.list);
accountRoutes.get('/:id', accountController.getById);
accountRoutes.get('/:id/balance', accountController.getBalance);
accountRoutes.get('/:id/ledger', accountController.getLedger);
