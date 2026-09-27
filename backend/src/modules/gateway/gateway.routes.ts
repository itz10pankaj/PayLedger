import { Router } from 'express';
import { identifyUser } from '../../common/middlewares/identifyUser';
import { gatewayController } from './gateway.controller';

export const gatewayRoutes = Router();

// Session-authenticated — this is the merchant managing their own
// integration from inside the app, not the merchant's server calling in.
// The API-key-authenticated public endpoints (Phase 3) live under a
// separate router with their own middleware, not this one.
gatewayRoutes.use(identifyUser);

gatewayRoutes.post('/accounts/:accountId/api-keys', gatewayController.issueApiKey);
gatewayRoutes.get('/accounts/:accountId/api-keys', gatewayController.listApiKeys);
// :id is the row's internal id (what listApiKeys returns as `id`), not
// the public `pk_live_...` keyId — a merchant revokes by the identifier
// this app's own UI showed them, same as they'd click "revoke" next to
// a row in a table.
gatewayRoutes.delete('/accounts/:accountId/api-keys/:id', gatewayController.revokeApiKey);
gatewayRoutes.put('/accounts/:accountId/webhook', gatewayController.setWebhook);
gatewayRoutes.get('/accounts/:accountId/webhook', gatewayController.getWebhook);
gatewayRoutes.post('/accounts/:accountId/payment-intents', gatewayController.createPaymentIntent);
