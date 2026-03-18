/**
 * LIKEFOOD - Live Chat Messages API
 * GET  → Lấy messages của chat (polling support)
 * POST → Gửi message mới (user/admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { notifyOwnerNewMessage } from "@/lib/chat/owner-notification";

type RouteParams = { params: Promise<{ id: string }> };

// ─── GET: Lấy messages (polling support) ─────────────────────

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const chatId = Number(id);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const userId = Number(session.user.id);

    // Verify access: user is owner or admin
    const chat = await prisma.livechat.findUnique({
      where: { id: chatId },
      select: { userId: true, status: true },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (chat.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For customer side, once chat is closed, do not return old history anymore.
    if (chat.status === "CLOSED" && !isAdmin) {
      return NextResponse.json({
        messages: [],
        chatStatus: "CLOSED",
        serverTime: new Date().toISOString(),
      });
    }

    // Polling: get messages since timestamp
    const sinceParam = req.nextUrl.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : undefined;
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 100, 200);

    const messages = await prisma.livechatmessage.findMany({
      where: {
        chatId,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    // Auto-mark messages as read
    const readerType = isAdmin ? "ADMIN" : "USER";
    const otherSenderType = readerType === "USER" ? "ADMIN" : "USER";
    if (messages.some(m => m.senderType === otherSenderType && !m.isRead)) {
      await prisma.livechatmessage.updateMany({
        where: { chatId, senderType: { in: [otherSenderType, "AI"] }, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        senderType: msg.senderType,
        senderId: msg.senderId,
        senderName: msg.senderType === "AI" ? "LIKEFOOD AI" : msg.senderType === "ADMIN" ? "Nhân viên" : "Bạn",
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
      })),
      chatStatus: chat.status,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[LIVE_CHAT] Get messages error", error as Error, { context: "live-chat-id-messages-api" });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST: Gửi message mới ──────────────────────────────────

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const chatId = Number(id);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Tin nhắn không được để trống." }, { status: 400 });
    }

    if (message.trim().length > 2000) {
      return NextResponse.json({ error: "Tin nhắn không được quá 2000 ký tự." }, { status: 400 });
    }

    const userId = Number(session.user.id);

    // Verify chat exists & determine sender type
    const chat = await prisma.livechat.findUnique({
      where: { id: chatId },
      include: { user: { select: { name: true } } },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.status === "CLOSED") {
      return NextResponse.json({ error: "Phiên chat đã được đóng." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    const isAdmin = user && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    // BUG FIX: If this user is the OWNER of the chat, they are always "USER" 
    // (even if they have admin role). Only admins responding to OTHER users' chats are "ADMIN".
    const isChatOwner = chat.userId === userId;
    const senderType = (isAdmin && !isChatOwner) ? "ADMIN" : "USER";

    if (!isAdmin && !isChatOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create message
    const msg = await prisma.livechatmessage.create({
      data: {
        chatId,
        senderType,
        senderId: userId,
        content: message.trim(),
      },
    });

    // Update chat timestamp
    await prisma.livechat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        // Auto-assign admin if they're responding to someone else's chat
        ...(isAdmin && !isChatOwner && !chat.adminId ? { adminId: userId, status: "ASSIGNED" } : {}),
      },
    });

    // Telegram notify if user sends message
    if (senderType === "USER") {
      notifyOwnerNewMessage({
        chatId,
        customerName: chat.user?.name ?? "Khách",
        message: message.trim(),
      }).catch(err => logger.error("[LIVE_CHAT] Telegram notify error", err as Error, { context: "live-chat-id-messages-api" }));
    }

    return NextResponse.json({
      message: {
        id: msg.id,
        chatId: msg.chatId,
        senderType: msg.senderType,
        senderId: msg.senderId,
        senderName: (isAdmin && !isChatOwner) ? (user?.name ?? "Nhân viên") : "Bạn",
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    logger.error("[LIVE_CHAT] Send message error", error as Error, { context: "live-chat-id-messages-api" });
    return NextResponse.json({ error: "Không thể gửi tin nhắn." }, { status: 500 });
  }
}
