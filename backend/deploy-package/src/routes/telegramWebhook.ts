import express from "express";
import { getRedis } from "../services/redisClient";
import {
  banChatMember,
  deleteMessage,
  restrictChatMember,
  sendTelegramMessage,
} from "../services/telegramService";

const router = express.Router();

function verifySecret(req: express.Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true; // if not set, skip
  const header = req.header("X-Telegram-Bot-Api-Secret-Token");
  return !!header && header === expected;
}

// Minimal moderation rules
const LINK_REGEX = /(https?:\/\/|t\.me\/.+|telegram\.me\/.+|joinchat)/i;
const AD_KEYWORDS = ["earn", "crypto", "profit", "investment", "casino", "bet"]; // keep short and conservative

router.post("/", async (req, res) => {
  try {
    if (!verifySecret(req))
      return res.status(401).json({ error: "Invalid secret" });

    const update = req.body || {};
    const msg = update.message;
    const callback = update.callback_query;

    if (msg && msg.chat && msg.message_id && (msg.text || msg.caption)) {
      const text = (msg.text || msg.caption || "").toString();
      const chatId = msg.chat.id as number;
      const fromUserId: number | undefined = msg.from?.id as number | undefined;
      const redis = getRedis();

      const hasLink = LINK_REGEX.test(text);
      const hasAdKeyword = AD_KEYWORDS.some((k) =>
        text.toLowerCase().includes(k)
      );

      // Delete obvious ad/link messages (basic anti-ads)
      if (hasLink || hasAdKeyword) {
        try {
          await deleteMessage(chatId, msg.message_id);
        } catch {}
      }

      // Flood control for normal messages
      if (fromUserId) {
        try {
          const rKey = `tg:rate:${chatId}:${fromUserId}`;
          let count = 1;
          if (redis) {
            count = await redis.incr(rKey);
            if (count === 1) await redis.expire(rKey, 10); // 10-second window
          } else {
            const mem: any =
              (global as any).__tgRate ||
              ((global as any).__tgRate = new Map());
            const now = Date.now();
            const entry = mem.get(rKey) || { count: 0, exp: now + 10_000 };
            if (now > entry.exp) {
              entry.count = 0;
              entry.exp = now + 10_000;
            }
            entry.count += 1;
            count = entry.count;
            mem.set(rKey, entry);
          }

          if (count >= 8) {
            // Delete the offending message
            try {
              await deleteMessage(chatId, msg.message_id);
            } catch {}

            // Increment strike
            const sKey = `tg:strikes:${chatId}:${fromUserId}`;
            let strikes = 1;
            if (redis) {
              strikes = await redis.incr(sKey);
              await redis.expire(sKey, 7 * 24 * 3600); // expire in 7 days
            } else {
              const mem: any =
                (global as any).__tgStr ||
                ((global as any).__tgStr = new Map());
              const e = mem.get(sKey) || {
                strikes: 0,
                exp: Date.now() + 7 * 24 * 3600 * 1000,
              };
              e.strikes += 1;
              strikes = e.strikes;
              mem.set(sKey, e);
            }

            // Apply penalty by tier
            const nowTs = Math.floor(Date.now() / 1000);
            if (strikes === 1) {
              await restrictChatMember(
                chatId,
                fromUserId,
                {
                  can_send_messages: false,
                  can_send_media_messages: false,
                  can_send_polls: false,
                  can_send_other_messages: false,
                  can_add_web_page_previews: false,
                },
                nowTs + 10 * 60
              ).catch(() => {});
            } else if (strikes === 2) {
              await restrictChatMember(
                chatId,
                fromUserId,
                {
                  can_send_messages: false,
                  can_send_media_messages: false,
                  can_send_polls: false,
                  can_send_other_messages: false,
                  can_add_web_page_previews: false,
                },
                nowTs + 24 * 3600
              ).catch(() => {});
            } else if (strikes >= 3) {
              await banChatMember(chatId, fromUserId).catch(() => {});
            }
          }
        } catch {}
      }
    }

    // Handle new members: apply simple CAPTCHA verification flow
    if (msg && msg.new_chat_members && Array.isArray(msg.new_chat_members)) {
      const chatId = msg.chat?.id;
      const redis = getRedis();
      for (const member of msg.new_chat_members) {
        // Skip bots
        if (!chatId || member.is_bot) continue;

        const userId = member.id as number;
        const token =
          Math.random().toString(36).slice(2) + Date.now().toString(36);
        const key = `tg:captcha:${chatId}:${userId}`;
        const keyMsg = `tg:captcha-msg:${chatId}:${userId}`;
        const ttlSec = 90;

        // Restrict user until verification
        try {
          await restrictChatMember(chatId, userId, {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
          });
        } catch {}

        // Send verification prompt with inline button
        const tokenBtn = {
          inline_keyboard: [
            [
              {
                text: "I am human",
                callback_data:
                  "verify:" +
                  String(chatId) +
                  ":" +
                  String(userId) +
                  ":" +
                  token,
              },
            ],
          ],
        };
        const prompt = await sendTelegramMessage(
          chatId,
          `👋 Welcome, <a href="tg://user?id=${userId}">user</a>!\nPlease verify you're human within 60 seconds.`,
          { reply_markup: tokenBtn }
        ).catch(() => null);

        // Persist pending token and prompt id
        try {
          if (redis) {
            await redis.setex(key, ttlSec, token);
            if (prompt?.result?.message_id) {
              await redis.setex(
                keyMsg,
                ttlSec,
                String(prompt.result.message_id)
              );
            }
          } else {
            const mem: any =
              (global as any).__tgMem || ((global as any).__tgMem = new Map());
            mem.set(key, { token, exp: Date.now() + ttlSec * 1000 });
            if (prompt?.result?.message_id) {
              mem.set(keyMsg, {
                id: prompt.result.message_id,
                exp: Date.now() + ttlSec * 1000,
              });
            }
          }
        } catch {}

        // Best-effort timeout: if still pending, kick
        setTimeout(async () => {
          try {
            let stillPending = false;
            if (redis) {
              stillPending = !!(await redis.get(key));
            } else {
              const mem: any = (global as any).__tgMem;
              const entry = mem?.get(key);
              if (entry && Date.now() < entry.exp) stillPending = true;
            }
            if (stillPending) {
              await banChatMember(chatId, userId);
            }
          } catch {}
        }, 70_000);
      }
    }

    // Handle verification button
    if (callback && callback.data && typeof callback.data === "string") {
      try {
        const parts = callback.data.split(":");
        if (parts[0] === "verify") {
          const chatId = Number(parts[1]);
          const userId = Number(parts[2]);
          const token = parts[3];
          const key = `tg:captcha:${chatId}:${userId}`;
          const keyMsg = `tg:captcha-msg:${chatId}:${userId}`;
          const redis = getRedis();

          let ok = false;
          if (redis) {
            const stored = await redis.get(key);
            ok = stored === token;
          } else {
            const mem: any = (global as any).__tgMem;
            const entry = mem?.get(key);
            ok = !!entry && entry.token === token && Date.now() < entry.exp;
          }

          if (ok) {
            // Unrestrict basic permissions
            await restrictChatMember(chatId, userId, {
              can_send_messages: true,
              can_send_media_messages: true,
              can_send_polls: true,
              can_send_other_messages: true,
              can_add_web_page_previews: true,
              can_invite_users: true,
            }).catch(() => {});

            // Cleanup
            if (redis) {
              await redis.del(key);
              const mid = await redis.get(keyMsg);
              if (mid) await deleteMessage(chatId, Number(mid)).catch(() => {});
              await redis.del(keyMsg);
            } else {
              const mem: any = (global as any).__tgMem;
              const mid = mem?.get(keyMsg)?.id;
              if (mid) await deleteMessage(chatId, Number(mid)).catch(() => {});
              mem?.delete(key);
              mem?.delete(keyMsg);
            }

            // Acknowledge
            await sendTelegramMessage(
              chatId,
              `✅ Verification complete for <a href="tg://user?id=${userId}">user</a>.`
            ).catch(() => {});
          } else {
            // Ignore invalid/expired
          }
        }
      } catch {}
    }

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(200).json({ ok: true }); // Always 200 to Telegram
  }
});

export default router;
