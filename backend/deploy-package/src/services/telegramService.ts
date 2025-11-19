import axios from "axios";

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  return token;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
    disable_web_page_preview?: boolean;
    reply_markup?: any;
  }
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
  const resp = await axios.post(url, {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode ?? "HTML",
    disable_web_page_preview: options?.disable_web_page_preview ?? true,
    ...(options?.reply_markup ? { reply_markup: options.reply_markup } : {}),
  });
  return resp.data;
}

export async function getBotInfo() {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/getMe`;
  const resp = await axios.get(url);
  return resp.data;
}

export async function deleteMessage(
  chatId: string | number,
  messageId: number
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/deleteMessage`;
  const resp = await axios.post(url, {
    chat_id: chatId,
    message_id: messageId,
  });
  return resp.data;
}

export async function restrictChatMember(
  chatId: string | number,
  userId: number,
  permissions: Record<string, unknown>,
  untilDate?: number
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/restrictChatMember`;
  const payload: any = { chat_id: chatId, user_id: userId, permissions };
  if (untilDate) payload.until_date = untilDate;
  const resp = await axios.post(url, payload);
  return resp.data;
}

export async function banChatMember(
  chatId: string | number,
  userId: number,
  untilDate?: number
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/banChatMember`;
  const payload: any = { chat_id: chatId, user_id: userId };
  if (untilDate) payload.until_date = untilDate;
  const resp = await axios.post(url, payload);
  return resp.data;
}

export async function setWebhook(webhookUrl: string, secretToken?: string) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/setWebhook`;
  const payload: any = { url: webhookUrl };
  if (secretToken) payload.secret_token = secretToken;
  const resp = await axios.post(url, payload);
  return resp.data;
}

export async function deleteWebhook() {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/deleteWebhook`;
  const resp = await axios.post(url, {});
  return resp.data;
}
