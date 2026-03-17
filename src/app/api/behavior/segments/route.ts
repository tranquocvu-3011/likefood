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
import { calculateUserSegment } from "@/lib/analytics/behavior";

// Predefined segments
const _SEGMENTS = [
  "new_user",
  "browser",
  "cart_abandoner",
  "high_intent",
  "first_time_buyer",
  "repeat_customer",
  "vip_customer",
  "churned_user",
  "deal_seeker",
  "voucher_collector",
  "active_searcher",
  "wishlister",
] as const;

export type UserSegment = (typeof _SEGMENTS)[number];


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId } = body;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: userId or sessionId" },
        { status: 400 }
      );
    }

    // Require auth when writing segments for a specific userId
    if (userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (session.user.id !== userId && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Calculate segments based on behavior
    let segments: string[] = [];

    if (userId) {
      segments = await calculateUserSegment(userId);

      // Check for additional segments from order data
      const orderCount = await prisma.order.count({
        where: { userId, status: { not: "CANCELLED" } },
      });

      if (orderCount === 0) {
        segments.push("new_user");
      } else if (orderCount === 1) {
        segments.push("first_time_buyer");
      } else if (orderCount >= 2) {
        segments.push("repeat_customer");
      }

      // Check for VIP (high LTV)
      const totalSpent = await prisma.order.aggregate({
        where: { userId, status: { not: "CANCELLED" } },
        _sum: { total: true },
      });

      if ((totalSpent._sum.total || 0) >= 500 || orderCount >= 5) {
        segments.push("vip_customer");
      }

      // Save segments to database
      for (const segment of segments) {
        await prisma.userSegment.upsert({
          where: {
            userId_segment: {
              userId,
              segment,
            },
          },
          update: {
            calculatedAt: new Date(),
          },
          create: {
            id: Number(crypto.randomUUID()),
            userId,
            segment,
            score: 1.0,
          },
        });
      }
    } else if (sessionId) {
      // For anonymous users, determine segments from session events
      const events = await prisma.behaviorEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const eventCounts = events.reduce<Record<string, number>>(
        (acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        },
        {}
      );

      // Determine segments from session events
      if (events.length < 5) {
        segments.push("new_user");
      } else {
        segments.push("browser");
      }

      if ((eventCounts.add_to_cart || 0) > 0) {
        segments.push("high_intent");
      }

      if ((eventCounts.search_query || 0) >= 3) {
        segments.push("active_searcher");
      }
    }

    // Remove duplicates
    segments = [...new Set(segments)];

    return NextResponse.json({
      success: true,
      segments,
    });
  } catch (error) {
    logger.error("Error calculating segments", error as Error, { context: "behavior-segments-api" });
    return NextResponse.json(
      { error: "Failed to calculate segments" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId or sessionId" },
        { status: 400 }
      );
    }

    // Require auth when querying segments for a specific userId
    if (userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (String(session.user.id) !== String(userId) && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get segments from database for logged-in users
    if (userId) {
      const userSegments = await prisma.userSegment.findMany({
        where: { userId: Number(userId) },
        orderBy: { calculatedAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        segments: userSegments.map((s) => s.segment),
      });
    }

    // For anonymous sessions, calculate from recent events
    if (sessionId) {
      const events = await prisma.behaviorEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const segments: string[] = [];

      if (events.length < 5) {
        segments.push("new_user");
      } else {
        segments.push("browser");
      }

      const eventCounts = events.reduce<Record<string, number>>(
        (acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        },
        {}
      );

      if ((eventCounts.add_to_cart || 0) > 0 && (eventCounts.purchase || 0) === 0) {
        segments.push("cart_abandoner");
      }

      if ((eventCounts.add_to_cart || 0) > 0) {
        segments.push("high_intent");
      }

      if ((eventCounts.search_query || 0) >= 3) {
        segments.push("active_searcher");
      }

      return NextResponse.json({
        success: true,
        segments,
      });
    }
  } catch (error) {
    logger.error("Error getting segments", error as Error, { context: "behavior-segments-api" });
    return NextResponse.json(
      { error: "Failed to get segments" },
      { status: 500 }
    );
  }
}


