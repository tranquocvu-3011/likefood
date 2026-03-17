/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Telegram Bot Notification Utility — FULL
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

import { getSystemSettingTrimmed } from "@/lib/system-settings";
import { logger } from "@/lib/logger";

// ─── Types ──────────────────────────────────────────────────

interface TelegramConfig {
    botToken: string;
    chatId: string;
}

interface TelegramMessage {
    text: string;
    parseMode?: "Markdown" | "HTML";
    disableWebPagePreview?: boolean;
}

export interface OrderNotificationData {
    orderId: number;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    totalAmount: number;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}

// ─── Config ─────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://likefood.vudev.io.vn";

export async function getTelegramConfig(): Promise<TelegramConfig | null> {
    const botToken = (await getSystemSettingTrimmed("telegram_bot_token")) || process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId = (await getSystemSettingTrimmed("telegram_chat_id")) || process.env.TELEGRAM_CHAT_ID || "";
    if (!botToken || !chatId) return null;
    return { botToken, chatId };
}

// ─── Core send ──────────────────────────────────────────────

export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
    const config = await getTelegramConfig();
    if (!config) {
        logger.info("[TELEGRAM] Bot not configured, skipping notification");
        return false;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: message.text,
                parse_mode: message.parseMode || "HTML",
                disable_web_page_preview: message.disableWebPagePreview ?? true,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            logger.error("[TELEGRAM] Send message error", new Error(JSON.stringify(error)), { context: "telegram" });
            return false;
        }
        return true;
    } catch (error) {
        logger.error("[TELEGRAM] Exception", error as Error, { context: "telegram" });
        return false;
    }
}

// ─── Helper: thời gian VN ──────────────────────────────────

function vnTime(): string {
    return new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

import { escapeHtml } from "@/lib/text-utils";

// ═══════════════════════════════════════════════════════════
// 1. ĐĂNG KÝ MỚI
// ═══════════════════════════════════════════════════════════

export async function notifyNewRegistration(data: {
    name: string;
    email: string;
    phone: string;
    ip?: string;
}): Promise<boolean> {
    const text = `
👤 <b>ĐĂNG KÝ TÀI KHOẢN MỚI</b>

📋 <b>Thông tin:</b>
• Họ tên: <b>${escapeHtml(data.name)}</b>
• Email: <code>${escapeHtml(data.email)}</code>
• SĐT: <code>${escapeHtml(data.phone)}</code>
${data.ip ? `• IP: <code>${data.ip}</code>` : ""}

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin/users">Quản lý người dùng</a>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 2. ĐĂNG NHẬP
// ═══════════════════════════════════════════════════════════

export async function notifyLogin(data: {
    email: string;
    name?: string;
    ip: string;
    userAgent?: string;
    isSuspicious?: boolean;
    method?: string; // "password" | "magic-link" | "google"
}): Promise<boolean> {
    const icon = data.isSuspicious ? "🚨" : "🔑";
    const label = data.isSuspicious ? "ĐĂNG NHẬP ĐÁNG NGỜ" : "ĐĂNG NHẬP";
    const device = data.userAgent
        ? data.userAgent.length > 80
            ? data.userAgent.slice(0, 80) + "…"
            : data.userAgent
        : "Không xác định";

    const text = `
${icon} <b>${label}</b>

• Email: <code>${escapeHtml(data.email)}</code>
${data.name ? `• Tên: ${escapeHtml(data.name)}` : ""}
• IP: <code>${data.ip}</code>
• Thiết bị: <i>${escapeHtml(device)}</i>
• Phương thức: ${data.method || "password"}
${data.isSuspicious ? "\n⚠️ <b>IP mới chưa từng đăng nhập!</b>" : ""}

🕐 <i>${vnTime()}</i>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 3. ĐƠN HÀNG MỚI
// ═══════════════════════════════════════════════════════════

const PAYMENT_NAMES: Record<string, string> = {
    COD: "💵 Tiền mặt (COD)",
    BANK: "🏦 Chuyển khoản",
    MOMO: "📱 MoMo",
    PAYPAL: "🅿️ PayPal",
    STRIPE: "💳 Thẻ tín dụng",
    ZALOPAY: "📲 ZaloPay",
    PICKUP: "🏪 Nhận tại cửa hàng",
};

export function formatOrderNotification(data: OrderNotificationData): string {
    const itemsList = data.items
        .slice(0, 10)
        .map((item) => `  • ${escapeHtml(item.name)} x${item.quantity} — $${item.price.toFixed(2)}`)
        .join("\n");
    const moreCount = data.items.length > 10 ? `\n  … và ${data.items.length - 10} sản phẩm khác` : "";

    return `
🛒 <b>ĐƠN HÀNG MỚI #${String(data.orderId).slice(-8).toUpperCase()}</b>

👤 <b>Khách hàng:</b>
• Tên: <b>${escapeHtml(data.customerName)}</b>
${data.customerEmail ? `• Email: <code>${escapeHtml(data.customerEmail)}</code>` : ""}
• SĐT: <code>${escapeHtml(data.customerPhone)}</code>
• Địa chỉ: ${escapeHtml(data.shippingAddress)}

💳 <b>Thanh toán:</b> ${PAYMENT_NAMES[data.paymentMethod] || data.paymentMethod}

📦 <b>Sản phẩm:</b>
${itemsList}${moreCount}

💰 <b>Tổng: $${data.totalAmount.toFixed(2)}</b>

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin/orders">Quản lý đơn hàng</a>
`.trim();
}

export async function sendOrderNotification(data: OrderNotificationData): Promise<boolean> {
    const message = formatOrderNotification(data);
    return sendTelegramMessage({ text: message, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 4. THANH TOÁN THÀNH CÔNG (Stripe/PayPal)
// ═══════════════════════════════════════════════════════════

export async function notifyPaymentSuccess(data: {
    orderId: number;
    amount: number;
    currency?: string;
    method: string;
    customerEmail?: string;
}): Promise<boolean> {
    const text = `
✅ <b>THANH TOÁN THÀNH CÔNG</b>

• Đơn hàng: <b>#${String(data.orderId).slice(-8).toUpperCase()}</b>
• Số tiền: <b>$${data.amount.toFixed(2)} ${data.currency || "USD"}</b>
• Phương thức: ${PAYMENT_NAMES[data.method] || data.method}
${data.customerEmail ? `• Email: <code>${escapeHtml(data.customerEmail)}</code>` : ""}

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin/orders">Xem đơn hàng</a>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 5. TIN NHẮN LIÊN HỆ
// ═══════════════════════════════════════════════════════════

export async function notifyContactMessage(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}): Promise<boolean> {
    const msgPreview = data.message.length > 300
        ? data.message.slice(0, 300) + "…"
        : data.message;

    const text = `
📩 <b>TIN NHẮN LIÊN HỆ MỚI</b>

👤 <b>Người gửi:</b>
• Tên: <b>${escapeHtml(data.name)}</b>
• Email: <code>${escapeHtml(data.email)}</code>
${data.phone ? `• SĐT: <code>${escapeHtml(data.phone)}</code>` : ""}

📌 <b>Chủ đề:</b> ${escapeHtml(data.subject)}

💬 <b>Nội dung:</b>
<i>${escapeHtml(msgPreview)}</i>

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin">Trả lời qua Admin</a>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 6. ĐÁNH GIÁ SẢN PHẨM MỚI
// ═══════════════════════════════════════════════════════════

export async function notifyNewReview(data: {
    productName: string;
    rating: number;
    comment?: string;
    customerName: string;
    customerEmail?: string;
}): Promise<boolean> {
    const stars = "⭐".repeat(Math.min(data.rating, 5));
    const commentPreview = data.comment
        ? data.comment.length > 200
            ? data.comment.slice(0, 200) + "…"
            : data.comment
        : "(Không có bình luận)";

    const text = `
📝 <b>ĐÁNH GIÁ SẢN PHẨM MỚI</b>

📦 Sản phẩm: <b>${escapeHtml(data.productName)}</b>
${stars} (${data.rating}/5)

👤 Người đánh giá: <b>${escapeHtml(data.customerName)}</b>
${data.customerEmail ? `📧 <code>${escapeHtml(data.customerEmail)}</code>` : ""}

💬 <i>${escapeHtml(commentPreview)}</i>

🕐 <i>${vnTime()}</i>
🔗 <a href="${SITE_URL}/admin/reviews">Quản lý đánh giá</a>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 7. CẢNH BÁO BẢO MẬT
// ═══════════════════════════════════════════════════════════

export async function notifySecurityAlert(data: {
    type: string; // "brute_force" | "rate_limit" | "suspicious_activity"
    details: string;
    ip?: string;
}): Promise<boolean> {
    const text = `
🛡️ <b>CẢNH BÁO BẢO MẬT</b>

⚠️ Loại: <b>${escapeHtml(data.type)}</b>
📋 Chi tiết: ${escapeHtml(data.details)}
${data.ip ? `🌐 IP: <code>${data.ip}</code>` : ""}

🕐 <i>${vnTime()}</i>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// 8. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// ═══════════════════════════════════════════════════════════

const STATUS_ICONS: Record<string, string> = {
    PENDING: "🟡",
    CONFIRMED: "🟢",
    PROCESSING: "🔵",
    SHIPPED: "🚚",
    DELIVERED: "✅",
    CANCELLED: "❌",
    REFUNDED: "💸",
};

export async function notifyOrderStatusChange(data: {
    orderId: number;
    oldStatus: string;
    newStatus: string;
    customerName?: string;
    customerEmail?: string;
}): Promise<boolean> {
    const icon = STATUS_ICONS[data.newStatus] || "📋";

    const text = `
${icon} <b>CẬP NHẬT ĐƠN HÀNG</b>

• Đơn #<b>${String(data.orderId).slice(-8).toUpperCase()}</b>
${data.customerName ? `• Khách: ${escapeHtml(data.customerName)}` : ""}
• Trạng thái: ${data.oldStatus} → <b>${data.newStatus}</b>

🕐 <i>${vnTime()}</i>
`.trim();

    return sendTelegramMessage({ text, parseMode: "HTML" });
}

// ═══════════════════════════════════════════════════════════
// TEST CONNECTION
// ═══════════════════════════════════════════════════════════

export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
    const config = await getTelegramConfig();
    if (!config) {
        return {
            success: false,
            message: "Telegram Bot chưa được cấu hình. Vui lòng thêm TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID vào .env",
        };
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
        if (!response.ok) {
            return { success: false, message: "Token Bot không hợp lệ" };
        }
        const botInfo = await response.json();
        return {
            success: true,
            message: `✅ Kết nối thành công! Bot: @${botInfo.result.username}`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Lỗi kết nối: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}
