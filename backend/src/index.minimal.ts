import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

// Minimal isolated server to diagnose startup issues
const app = express();

// Basic middleware only
app.get('/health', (_req, res) => {
  res
    .status(200)
    .json({ status: 'ok-minimal', time: new Date().toISOString() });
});

// Global handlers (mirroring full index for visibility)
process.on('uncaughtException', (err) => {
  console.error('[MINIMAL FATAL] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[MINIMAL FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[MINIMAL] Server listening on ${PORT}`);
});
