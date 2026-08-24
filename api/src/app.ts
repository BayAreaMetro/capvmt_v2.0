import express from 'express';
import { errorHandler } from './lib/http-errors';
import { requestLogger } from './lib/request-context';
import { healthRouter } from './routes/health';
import { vmtRouter } from './routes/vmt';

export const app = express();
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRouter);
app.use('/api/data', vmtRouter);

app.use(errorHandler);
