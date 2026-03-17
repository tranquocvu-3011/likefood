"use server";

/**
 * LIKEFOOD - Live Chat Service
 * Real-time chat giữa KH và Admin, lưu DB
 * Copyright (c) 2026 LIKEFOOD Team
 */

import prisma from "@/lib/prisma";
import { notifyOwnerLiveChatStarted, notifyOwnerNewMessage } from "./owner-notification";

// ─── Types ───────────────────────────────────────────────────

export type ChatStatus = "OPEN" | "ASSIGNED" | "CLOSED";
export type SenderType = "USER" | "ADMIN" | "AI";

export interface LiveChatSummary {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  adminId: number | null;
  adminName: string | null;
  status: ChatStatus;
  subject: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface LiveChatMessageData {
  id: number;
  chatId: number;
  senderType: SenderType;
  senderId: number | null;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Create Chat ─────────────────────────────────────────────

export async function createLiveChat(
  userId: number,
  firstMessage: string,
  subject?: string
): Promise<{ chatId: number; messageId: number }> {
  const chat = await prisma.livechat.create({
    data: {
      userId,
      status: "OPEN",
      subject: subject ?? null,
      messages: {
        create: {
          senderType: "USER",
          senderId: userId,
          content: firstMessage,
        },
      },
    },
    include: {
      user: { select: { name: true } },
      messages: { select: { id: true }, take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  // Thông báo chủ shop qua Telegram
  notifyOwnerLiveChatStarted({
    chatId: chat.id,
    customerName: chat.user?.name ?? "Khách",
    firstMessage,
  }).catch(err => console.error("[LIVE_CHAT] Telegram notification error:", err));

  return {
    chatId: chat.id,
    messageId: chat.messages[0]?.id ?? 0,
  };
}

// ─── Send Message ────────────────────────────────────────────

export async function sendLiveChatMessage(
  chatId: number,
  senderType: SenderType,
  senderId: number | null,
  content: string
): Promise<LiveChatMessageData> {
  const message = await prisma.livechatmessage.create({
    data: {
      chatId,
      senderType,
      senderId,
      content,
    },
  });

  // Update chat timestamp
  await prisma.livechat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  // Notify admin khi KH gửi tin nhắn mới
  if (senderType === "USER") {
    const chat = await prisma.livechat.findUnique({
      where: { id: chatId },
      include: { user: { select: { name: true } } },
    });
    if (chat) {
      notifyOwnerNewMessage({
        chatId,
        customerName: chat.user?.name ?? "Khách",
        message: content,
      }).catch(err => console.error("[LIVE_CHAT] Telegram notification error:", err));
    }
  }

  return {
    id: message.id,
    chatId: message.chatId,
    senderType: message.senderType as SenderType,
    senderId: message.senderId,
    senderName: senderType === "AI" ? "LIKEFOOD AI" : "",
    content: message.content,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  };
}

// ─── Get Chats (Admin) ──────────────────────────────────────

export async function getLiveChats(
  status?: ChatStatus,
  limit = 50
): Promise<LiveChatSummary[]> {
  const chats = await prisma.livechat.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { name: true, email: true } },
      admin: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  // Get unread counts
  const chatIds = chats.map(c => c.id);
  const unreadCounts = await prisma.livechatmessage.groupBy({
    by: ["chatId"],
    where: {
      chatId: { in: chatIds },
      isRead: false,
      senderType: "USER",
    },
    _count: { id: true },
  });

  const unreadMap = new Map(unreadCounts.map(u => [u.chatId, u._count.id]));

  return chats.map(chat => ({
    id: chat.id,
    userId: chat.userId,
    userName: chat.user?.name ?? "Khách",
    userEmail: chat.user?.email ?? "",
    adminId: chat.adminId,
    adminName: chat.admin?.name ?? null,
    status: chat.status as ChatStatus,
    subject: chat.subject,
    lastMessage: chat.messages[0]?.content ?? "",
    lastMessageAt: chat.messages[0]?.createdAt?.toISOString() ?? chat.createdAt.toISOString(),
    unreadCount: unreadMap.get(chat.id) ?? 0,
    createdAt: chat.createdAt.toISOString(),
  }));
}

// ─── Get Messages ────────────────────────────────────────────

export async function getLiveChatMessages(
  chatId: number,
  since?: Date,
  limit = 100
): Promise<LiveChatMessageData[]> {
  const messages = await prisma.livechatmessage.findMany({
    where: {
      chatId,
      ...(since ? { createdAt: { gt: since } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return messages.map(msg => ({
    id: msg.id,
    chatId: msg.chatId,
    senderType: msg.senderType as SenderType,
    senderId: msg.senderId,
    senderName: msg.senderType === "AI" ? "LIKEFOOD AI" : "",
    content: msg.content,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
  }));
}

// ─── Mark as Read ────────────────────────────────────────────

export async function markMessagesAsRead(chatId: number, readerType: "USER" | "ADMIN"): Promise<void> {
  // Mark messages from the OTHER side as read
  const senderType = readerType === "USER" ? "ADMIN" : "USER";
  await prisma.livechatmessage.updateMany({
    where: { chatId, senderType, isRead: false },
    data: { isRead: true },
  });
}

// ─── Assign Admin ────────────────────────────────────────────

export async function assignAdmin(chatId: number, adminId: number): Promise<void> {
  await prisma.livechat.update({
    where: { id: chatId },
    data: { adminId, status: "ASSIGNED" },
  });
}

// ─── Close Chat ──────────────────────────────────────────────

export async function closeChat(chatId: number): Promise<void> {
  await prisma.livechat.update({
    where: { id: chatId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}

// ─── Get User's Active Chat ──────────────────────────────────

export async function getUserActiveChat(userId: number): Promise<{ chatId: number } | null> {
  const chat = await prisma.livechat.findFirst({
    where: { userId, status: { in: ["OPEN", "ASSIGNED"] } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  return chat ? { chatId: chat.id } : null;
}

// ─── Get Unread Count for Admin ──────────────────────────────

export async function getAdminUnreadCount(): Promise<number> {
  const count = await prisma.livechatmessage.count({
    where: {
      isRead: false,
      senderType: "USER",
      chat: { status: { in: ["OPEN", "ASSIGNED"] } },
    },
  });
  return count;
}
