import { Router } from 'express';
import { accountRoutes } from './account/account.routes';
import { paymentRoutes } from './payment/payment.routes';
import { dashboardRoutes } from './dashboard/dashboard.routes';
import { gatewayRoutes } from './gateway/gateway.routes';
import { publicGatewayRoutes } from './gateway/publicGateway.routes';
import { paymentIntentRoutes } from './gateway/paymentIntent.routes';

// `ledger` has no routes of its own — it's infra other modules read/write
// through (account, payment, dashboard today; reconciliation later).
export const moduleRoutes = Router();

moduleRoutes.use('/accounts', accountRoutes);
moduleRoutes.use('/payments', paymentRoutes);
moduleRoutes.use('/dashboard', dashboardRoutes);
moduleRoutes.use('/merchant', gatewayRoutes);
moduleRoutes.use('/gateway', publicGatewayRoutes);
moduleRoutes.use('/payment-intents', paymentIntentRoutes);
