import dotenv from "dotenv";
dotenv.config();

import express from "express";

// Minimal isolated server to diagnose startup issues
const app = express();

// Basic middleware only
app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "ok-minimal", time: new Date().toISOString() });
});

// Global handlers (mirroring full index for visibility)
process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("[MINIMAL FATAL] Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("[MINIMAL FATAL] Unhandled Rejection:", reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[MINIMAL] Server listening on ${PORT}`);
});
