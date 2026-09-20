import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authenticate } from './common/middlewares/authenticate';
import { errorHandler, notFoundHandler } from './common/middlewares/errorHandler';
import { backendProxy } from './common/proxy/backendProxy';
import { moduleRoutes } from './modules';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Gateway-owned routes (auth today; rate limiting/API keys later).
// moduleRoutes already prefixes each module (e.g. authRoutes -> /auth).
app.use(moduleRoutes);

// Everything else under /api is authenticated here, then forwarded to a
// backend instance. Today that's one instance; nextBackendTarget() is
// where round-robin load balancing plugs in once there are more.
app.use('/api', authenticate, backendProxy);

app.use(notFoundHandler);
app.use(errorHandler);
