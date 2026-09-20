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

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Everything under /api is authenticated here, then forwarded to a backend
// instance. Deliberately NOT behind express.json() — a body-parser would
// consume the request stream before the proxy can pipe it through,
// leaving the proxied request hanging with a body that never arrives.
app.use('/api', authenticate, backendProxy);

// Gateway-owned routes (auth today; rate limiting/API keys later) — JSON
// body parsing only applies here, never on the proxied path above.
// moduleRoutes already prefixes each module (e.g. authRoutes -> /auth).
app.use(express.json());
app.use(moduleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
