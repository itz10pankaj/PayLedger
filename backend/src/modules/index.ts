import { Router } from 'express';
import { accountRoutes } from './account/account.routes';
import { paymentRoutes } from './payment/payment.routes';
import { dashboardRoutes } from './dashboard/dashboard.routes';

// `ledger` has no routes of its own — it's infra other modules read/write
// through (account, payment, dashboard today; reconciliation later).
export const moduleRoutes = Router();

moduleRoutes.use('/accounts', accountRoutes);
moduleRoutes.use('/payments', paymentRoutes);
moduleRoutes.use('/dashboard', dashboardRoutes);
