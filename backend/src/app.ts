import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './common/middlewares/errorHandler';
import { moduleRoutes } from './modules';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/v1', moduleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
