import { Router } from 'express';
import { accountRoutes } from './account/account.routes';

// `ledger` has no routes of its own — it's infra other modules read/write
// through (account today, payment/reconciliation later).
export const moduleRoutes = Router();

moduleRoutes.use('/accounts', accountRoutes);
