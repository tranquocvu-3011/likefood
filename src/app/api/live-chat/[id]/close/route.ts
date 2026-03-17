/**
 * LIKEFOOD - Close Live Chat API
 * POST → Đóng phiên chat
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

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

    const userId = Number(session.user.id);

    const chat = await prisma.livechat.findUnique({
      where: { id: chatId },
      select: { userId: true, status: true },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (chat.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (chat.status === "CLOSED") {
      return NextResponse.json({ message: "Chat đã đóng rồi." });
    }

    await prisma.livechat.update({
      where: { id: chatId },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    // Add system message
    await prisma.livechatmessage.create({
      data: {
        chatId,
        senderType: "AI",
        senderId: null,
        content: isAdmin
          ? "Phiên chat đã được đóng bởi nhân viên. Cảm ơn bạn đã liên hệ LIKEFOOD! 🙏"
          : "Bạn đã kết thúc phiên chat. Cảm ơn bạn đã liên hệ LIKEFOOD! Nếu cần thêm hỗ trợ, hãy mở chat mới nhé! 😊",
      },
    });

    return NextResponse.json({ message: "Phiên chat đã đóng.", status: "CLOSED" });
  } catch (error) {
    logger.error("[LIVE_CHAT] Close error", error as Error, { context: "live-chat-id-close-api" });
    return NextResponse.json({ error: "Không thể đóng chat." }, { status: 500 });
  }
}
