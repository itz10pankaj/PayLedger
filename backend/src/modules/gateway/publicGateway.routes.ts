import { Router } from 'express';
import { authenticateApiKey } from './middlewares/authenticateApiKey';
import { publicGatewayController } from './publicGateway.controller';

export const publicGatewayRoutes = Router();

// API-key-authenticated — this is a merchant's own server calling in, not
// the merchant managing their integration from inside the app (that's
// gateway.routes.ts, session-authenticated, under /merchant).
publicGatewayRoutes.use(authenticateApiKey);

publicGatewayRoutes.post('/payment-intents', publicGatewayController.createPaymentIntent);
