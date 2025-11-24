import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import http from 'http';
import { config } from './jobs/config';
import trustRouter from './routes/trust';
import './tracing';

const app = express();

app.set('trust proxy', 1);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: 'trust-only',
    time: new Date().toISOString(),
  });
});

app.use('/api/trust', trustRouter);

const server = http.createServer(app);
const PORT = config.port || process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[trust-only] Server listening on ${PORT}`);
});
