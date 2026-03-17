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

type FeedbackType = 
  | "chatbot"
  | "product"
  | "order"
  | "website"
  | "general";

interface FeedbackBody {
  type: FeedbackType;
  userId?: string;
  sessionId?: string;
  rating?: number;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackBody = await req.json();
    const { type, userId, sessionId, rating, comment, metadata } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required field: type" },
        { status: 400 }
      );
    }

    // Store feedback in conversationHistory with feedback field
    const feedback = await prisma.conversationHistory.create({
      data: {

        userId: userId ? Number(userId) : null,
        sessionId: sessionId || `feedback_${Date.now()}`,
        role: "feedback",
        message: JSON.stringify({
          type,
          rating,
          comment,
          metadata,
        }),
        feedback: rating ? (rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral") : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      type,
    });
  } catch (error) {
    logger.error("Error submitting feedback", error as Error, { context: "feedback-api" });
    return NextResponse.json(
      { error: "Failed to submit feedback" },
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
    const type = searchParams.get("type") as FeedbackType | null;
    const rating = searchParams.get("rating");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {
      feedback: { not: null },
    };

    if (type) {
      where.message = { contains: `"type":"${type}"` };
    }

    if (rating) {
      where.feedback = rating === "positive" ? "positive" : 
                       rating === "negative" ? "negative" : "neutral";
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const feedbacks = await prisma.conversationHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Calculate stats
    const allFeedbacks = await prisma.conversationHistory.findMany({
      where: { feedback: { not: null } },
      select: { feedback: true },
    });

    const positiveCount = allFeedbacks.filter(f => f.feedback === "positive").length;
    const neutralCount = allFeedbacks.filter(f => f.feedback === "neutral").length;
    const negativeCount = allFeedbacks.filter(f => f.feedback === "negative").length;
    const total = allFeedbacks.length;

    return NextResponse.json({
      success: true,
      feedbacks,
      stats: {
        total,
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
        positiveRate: total > 0 ? (positiveCount / total * 100).toFixed(1) + "%" : "0%",
      },
      count: feedbacks.length,
    });
  } catch (error) {
    logger.error("Error fetching feedbacks", error as Error, { context: "feedback-api" });
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}
