/**
 * LIKEFOOD - Live Chat API
 * POST → Tạo phiên chat mới (user), AI tự động reply
 * GET  → Danh sách chats (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { notifyOwnerLiveChatStarted } from "@/lib/chat/owner-notification";

// ─── POST: Tạo chat mới ─────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để chat." }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    const { message, subject } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Tin nhắn không được để trống." }, { status: 400 });
    }

    // Check if user already has an active chat
    const existingChat = await prisma.livechat.findFirst({
      where: { userId, status: { in: ["OPEN", "ASSIGNED"] } },
      select: { id: true, status: true },
    });

    if (existingChat) {
      return NextResponse.json({
        chatId: existingChat.id,
        message: "Bạn đã có phiên chat đang mở.",
        existing: true,
        status: existingChat.status,
      });
    }

    // Create new chat + first message
    const chat = await prisma.livechat.create({
      data: {
        userId,
        status: "OPEN",
        subject: subject || null,
        messages: {
          create: {
            senderType: "USER",
            senderId: userId,
            content: message.trim(),
          },
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        messages: { select: { id: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
    });

    // NOTE: No AI auto-reply — user requested live chat to ONLY show real staff responses.
    // AI mode is a separate feature toggled by the user.

    // Telegram notification (non-blocking)
    notifyOwnerLiveChatStarted({
      chatId: chat.id,
      customerName: chat.user?.name ?? "Khách",
      firstMessage: message.trim(),
    }).catch(err => logger.error("[LIVE_CHAT] Telegram notify error", err as Error, { context: "live-chat-api" }));

    return NextResponse.json({
      chatId: chat.id,
      messageId: chat.messages[0]?.id ?? 0,
      message: "Phiên chat đã được tạo! AI sẽ hỗ trợ ngay.",
      existing: false,
      status: chat.status,
    }, { status: 201 });
  } catch (error) {
    logger.error("[LIVE_CHAT] Create error", error as Error, { context: "live-chat-api" });
    return NextResponse.json({ error: "Không thể tạo phiên chat." }, { status: 500 });
  }
}

// ─── GET: Danh sách chats (admin) ────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") || undefined;
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 100);

    const chats = await prisma.livechat.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        admin: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderType: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    // Get unread counts
    const chatIds = chats.map(c => c.id);
    const unreadCounts = chatIds.length > 0
      ? await prisma.livechatmessage.groupBy({
          by: ["chatId"],
          where: { chatId: { in: chatIds }, isRead: false, senderType: "USER" },
          _count: { id: true },
        })
      : [];

    const unreadMap = new Map(unreadCounts.map(u => [u.chatId, u._count.id]));

    const result = chats.map(chat => ({
      id: chat.id,
      userId: chat.userId,
      userName: chat.user?.name ?? "Khách",
      userEmail: chat.user?.email ?? "",
      adminId: chat.adminId,
      adminName: chat.admin?.name ?? null,
      status: chat.status,
      subject: chat.subject,
      lastMessage: chat.messages[0]?.content ?? "",
      lastMessageAt: chat.messages[0]?.createdAt?.toISOString() ?? chat.createdAt.toISOString(),
      lastSenderType: chat.messages[0]?.senderType ?? "USER",
      unreadCount: unreadMap.get(chat.id) ?? 0,
      createdAt: chat.createdAt.toISOString(),
    }));

    return NextResponse.json({ chats: result });
  } catch (error) {
    logger.error("[LIVE_CHAT] List error", error as Error, { context: "live-chat-api" });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
