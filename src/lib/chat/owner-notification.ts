"use server";

/**
 * LIKEFOOD - Owner Notification Service
 * Thông báo chủ shop qua Telegram khi KH cần hỗ trợ
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { sendTelegramMessage } from "@/lib/telegram";

interface CustomerInfo {
  sessionId: string;
  userId?: string;
  language?: "vi" | "en";
  customerName?: string;
  customerEmail?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://likefood.vudev.io.vn";

function vnTime(): string {
  return new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

import { escapeHtml } from "@/lib/text-utils";

/**
 * Gửi thông báo cho chủ shop khi KH cần hỗ trợ trực tiếp
 * (AI chatbot escalated hoặc KH yêu cầu nói chuyện với người thật)
 */
export async function notifyOwnerNewChat(
  customerMessage: string,
  info: CustomerInfo
): Promise<boolean> {
  const msgPreview = customerMessage.length > 300
    ? customerMessage.slice(0, 300) + "…"
    : customerMessage;

  const text = `
💬 <b>KHÁCH HÀNG CẦN HỖ TRỢ</b>

📝 <b>Tin nhắn:</b>
<i>${escapeHtml(msgPreview)}</i>

👤 <b>Thông tin:</b>
• Session: <code>${info.sessionId?.slice(0, 20) ?? "N/A"}</code>
${info.userId ? `• User ID: <code>${info.userId}</code>` : "• Khách vãng lai"}
${info.customerName ? `• Tên: ${escapeHtml(info.customerName)}` : ""}
${info.customerEmail ? `• Email: <code>${escapeHtml(info.customerEmail)}</code>` : ""}
• Ngôn ngữ: ${info.language === "en" ? "🇺🇸 English" : "🇻🇳 Tiếng Việt"}

🤖 <b>AI đã tự động trả lời nhưng cần sự hỗ trợ từ bạn.</b>

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin/live-chat">Mở Live Chat</a>
`.trim();

  return sendTelegramMessage({ text, parseMode: "HTML" });
}

/**
 * Thông báo khi KH bắt đầu phiên live chat mới
 */
export async function notifyOwnerLiveChatStarted(data: {
  chatId: number;
  customerName: string;
  firstMessage: string;
}): Promise<boolean> {
  const msgPreview = data.firstMessage.length > 200
    ? data.firstMessage.slice(0, 200) + "…"
    : data.firstMessage;

  const text = `
🔔 <b>LIVE CHAT MỚI #${data.chatId}</b>

👤 Khách: <b>${escapeHtml(data.customerName)}</b>
💬 Tin nhắn đầu: <i>${escapeHtml(msgPreview)}</i>

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin/live-chat?id=${data.chatId}">Trả lời ngay</a>
`.trim();

  return sendTelegramMessage({ text, parseMode: "HTML" });
}

/**
 * Thông báo khi KH gửi tin nhắn mới trong live chat đang mở
 */
export async function notifyOwnerNewMessage(data: {
  chatId: number;
  customerName: string;
  message: string;
}): Promise<boolean> {
  const msgPreview = data.message.length > 150
    ? data.message.slice(0, 150) + "…"
    : data.message;

  const text = `
💬 <b>TIN NHẮN MỚI - Chat #${data.chatId}</b>

👤 ${escapeHtml(data.customerName)}: <i>${escapeHtml(msgPreview)}</i>

🔗 <a href="${SITE_URL}/admin/live-chat?id=${data.chatId}">Trả lời</a>
`.trim();

  return sendTelegramMessage({ text, parseMode: "HTML" });
}
