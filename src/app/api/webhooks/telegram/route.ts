/**
 * LIKEFOOD - Telegram Bot Webhook
 * Receives messages from Telegram when admin replies to live chat notifications.
 * 
 * Flow:
 *   1. Customer sends message → Live Chat → Telegram notification (with chatId in text)
 *   2. Admin REPLIES to that Telegram message → Telegram sends update to this webhook
 *   3. This webhook extracts chatId from the replied-to message → creates ADMIN message in live chat
 *   4. Customer sees the reply in real-time (via polling)
 * 
 * Setup webhook: POST /api/webhooks/telegram?action=setup
 * Receive updates: POST /api/webhooks/telegram
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getTelegramConfig } from "@/lib/telegram";

// ─── Setup webhook command ───────────────────────────────────

async function setupWebhook(req: NextRequest): Promise<NextResponse> {
    const config = await getTelegramConfig();
    if (!config) {
        return NextResponse.json({ error: "Telegram not configured" }, { status: 400 });
    }

    // Use the host from the request or env
    const host = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const webhookUrl = `${host}/api/webhooks/telegram`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ["message"],
            }),
        });

        const data = await res.json();
        if (data.ok) {
            return NextResponse.json({
                success: true,
                message: `Webhook set to: ${webhookUrl}`,
                result: data.result,
            });
        }

        return NextResponse.json({ error: "Failed to set webhook", details: data }, { status: 500 });
    } catch (error) {
        return NextResponse.json({
            error: "Failed to setup webhook",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}

// ─── Extract chat ID from replied-to message ────────────────

function extractChatIdFromText(text: string): number | null {
    // Match patterns like "Chat #123" or "Live Chat #123" or "chat #123"
    const match = text.match(/Chat\s*#(\d+)/i);
    return match ? Number(match[1]) : null;
}

// ─── Handle incoming Telegram message (webhook) ─────────────

export async function POST(req: NextRequest) {
    // Check if this is a setup request
    const action = req.nextUrl.searchParams.get("action");
    if (action === "setup") {
        return setupWebhook(req);
    }

    try {
        const update = await req.json();

        // Only process message updates
        if (!update.message) {
            return NextResponse.json({ ok: true });
        }

        const message = update.message;
        const text = message.text?.trim();

        // Must be a reply to a previous bot message
        if (!message.reply_to_message || !text) {
            return NextResponse.json({ ok: true });
        }

        // Verify sender is the configured chat_id (owner only)
        const config = await getTelegramConfig();
        if (!config) {
            return NextResponse.json({ ok: true });
        }

        const senderId = String(message.chat?.id || message.from?.id);
        if (senderId !== config.chatId) {
            logger.warn("[TELEGRAM_WEBHOOK] Message from unauthorized chat", {
                context: "telegram-webhook",
                senderId,
                expected: config.chatId,
            });
            return NextResponse.json({ ok: true });
        }

        // Extract chatId from the replied-to message
        const repliedText = message.reply_to_message.text || "";
        const chatId = extractChatIdFromText(repliedText);

        if (!chatId) {
            // Try to send feedback via Telegram
            await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: config.chatId,
                    text: "⚠️ Không tìm thấy chat ID. Hãy reply đúng tin nhắn thông báo từ Live Chat.",
                    reply_to_message_id: message.message_id,
                }),
            });
            return NextResponse.json({ ok: true });
        }

        // Verify chat exists and is active
        const chat = await prisma.livechat.findUnique({
            where: { id: chatId },
            select: { id: true, status: true, userId: true, adminId: true },
        });

        if (!chat) {
            await sendTelegramReply(config.botToken, config.chatId, message.message_id,
                `❌ Chat #${chatId} không tồn tại.`);
            return NextResponse.json({ ok: true });
        }

        if (chat.status === "CLOSED") {
            await sendTelegramReply(config.botToken, config.chatId, message.message_id,
                `🔒 Chat #${chatId} đã đóng. Khách cần mở chat mới để liên hệ.`);
            return NextResponse.json({ ok: true });
        }

        // Find admin user (first ADMIN or SUPER_ADMIN)
        let adminId = chat.adminId;
        if (!adminId) {
            const admin = await prisma.user.findFirst({
                where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
                select: { id: true },
            });
            adminId = admin?.id ?? null;
        }

        if (!adminId) {
            await sendTelegramReply(config.botToken, config.chatId, message.message_id,
                "⚠️ Không tìm thấy admin user trong hệ thống.");
            return NextResponse.json({ ok: true });
        }

        // Create ADMIN message in live chat
        await prisma.livechatmessage.create({
            data: {
                chatId,
                senderType: "ADMIN",
                senderId: adminId,
                content: text,
            },
        });

        // Update chat status & assign admin
        await prisma.livechat.update({
            where: { id: chatId },
            data: {
                updatedAt: new Date(),
                ...(!chat.adminId ? { adminId, status: "ASSIGNED" } : {}),
            },
        });

        // Confirm via Telegram
        await sendTelegramReply(config.botToken, config.chatId, message.message_id,
            `✅ Đã gửi tin nhắn cho khách (Chat #${chatId}).`);

        logger.info(`[TELEGRAM_WEBHOOK] Reply sent to chat #${chatId}`, {
            adminId: String(adminId),
            messageLength: text.length,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error("[TELEGRAM_WEBHOOK] Error processing update", error as Error, {
            context: "telegram-webhook",
        });
        return NextResponse.json({ ok: true }); // Always 200 for Telegram
    }
}

// ─── Helper ─────────────────────────────────────────────────

async function sendTelegramReply(
    botToken: string,
    chatId: string,
    replyToMessageId: number,
    text: string
): Promise<void> {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_to_message_id: replyToMessageId,
        }),
    }).catch(() => {});
}

// ─── GET: Info / Webhook Status ─────────────────────────────

export async function GET() {
    const config = await getTelegramConfig();
    if (!config) {
        return NextResponse.json({ configured: false, message: "Telegram not configured" });
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getWebhookInfo`);
        const data = await res.json();
        return NextResponse.json({
            configured: true,
            webhook: data.result,
        });
    } catch {
        return NextResponse.json({ configured: true, webhook: null });
    }
}
