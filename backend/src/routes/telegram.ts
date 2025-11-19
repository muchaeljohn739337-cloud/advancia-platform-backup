import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  deleteWebhook,
  getBotInfo,
  sendTelegramMessage,
  setWebhook,
} from "../services/telegramService";

const router = express.Router();
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAdmin: any =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

// GET /api/admin/telegram/me - verify bot info
router.get("/me", safeAuth, safeAdmin, async (req, res) => {
  try {
    const me = await getBotInfo();
    return res.json(me);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to fetch bot info" });
  }
});

// POST /api/admin/telegram/send - send a test message
router.post("/send", safeAuth, safeAdmin, async (req, res) => {
  try {
    const { chatId, text } = req.body || {};
    if (!chatId || !text)
      return res.status(400).json({ error: "chatId and text required" });
    const resp = await sendTelegramMessage(chatId, text);
    return res.json(resp);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to send message" });
  }
});

export default router;

// Admin webhook setup
router.post("/webhook", safeAuth, safeAdmin, async (req, res) => {
  try {
    const { publicUrl, secret } = req.body || {};
    const url = `${publicUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const resp = await setWebhook(
      url,
      secret || process.env.TELEGRAM_WEBHOOK_SECRET
    );
    return res.json({ set: true, url, resp });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to set webhook" });
  }
});

router.delete("/webhook", safeAuth, safeAdmin, async (_req, res) => {
  try {
    const resp = await deleteWebhook();
    return res.json({ deleted: true, resp });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to delete webhook" });
  }
});
