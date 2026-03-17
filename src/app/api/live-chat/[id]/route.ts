/**
 * LIKEFOOD - Live Chat Messages API
 * Lấy messages + polling + mark as read + manage chat
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  getLiveChatMessages,
  markMessagesAsRead,
  assignAdmin,
  closeChat,
} from "@/lib/chat/live-chat-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET — Lấy messages (polling support: ?since=ISO_DATE)
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const chatId = Number(id);
    const url = new URL(req.url);
    const since = url.searchParams.get("since");

    const messages = await getLiveChatMessages(
      chatId,
      since ? new Date(since) : undefined
    );

    // Auto mark as read
    const readerType = session.user.role === "ADMIN" ? "ADMIN" : "USER";
    await markMessagesAsRead(chatId, readerType as "USER" | "ADMIN");

    return NextResponse.json({ messages });
  } catch (error) {
    logger.error("[LIVE_CHAT_MSG_API] GET error", error as Error, { context: "live-chat-id-api" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Quản lý chat (assign admin, close)
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const chatId = Number(id);
    const body = await req.json();
    const { action } = body;

    if (action === "assign") {
      await assignAdmin(chatId, Number(session.user.id));
      return NextResponse.json({ success: true, action: "assigned" });
    }

    if (action === "close") {
      await closeChat(chatId);
      return NextResponse.json({ success: true, action: "closed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("[LIVE_CHAT_MSG_API] PATCH error", error as Error, { context: "live-chat-id-api" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
