/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

type NotificationType =
  | "flash_sale"
  | "price_drop"
  | "restock"
  | "order_update"
  | "abandoned_cart"
  | "recommendation"
  | "review_reply"
  | "system";

interface NotificationBody {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body: NotificationBody = await req.json();
    const { userId, type, title, body: notificationBody, data } = body;

    if (!userId || !type || !title || !notificationBody) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, title, body" },
        { status: 400 }
      );
    }

    // Create notification record
    const notification = await prisma.pushNotification.create({
      data: {
        id: Number(crypto.randomUUID()),
        userId,
        type,
        title,
        body: notificationBody,
        data: data !== undefined ? JSON.stringify(data) : null,
      },
    });

    // TODO: Integrate with Firebase FCM for actual push notification

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      type,
      userId,
    });
  } catch (error) {
    logger.error("Error sending notification", error as Error, { context: "notify-send-api" });
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId: Number(userId) };
    if (type) where.type = type;
    if (unreadOnly) where.readAt = null;

    const notifications = await prisma.pushNotification.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.pushNotification.count({
      where: { userId: Number(userId), readAt: null },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      count: notifications.length,
    });
  } catch (error) {
    logger.error("Error fetching notifications", error as Error, { context: "notify-send-api" });
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { notificationId, markAsRead } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Missing required field: notificationId" },
        { status: 400 }
      );
    }

    if (markAsRead) {
      await prisma.pushNotification.update({
        where: { id: Number(notificationId) },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("Error updating notification", error as Error, { context: "notify-send-api" });
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
