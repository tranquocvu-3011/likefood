/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { recommendationEngine } from "@/lib/ai/recommendation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      sessionId,
      currentProductId,
      cartItems,
      browseHistory,
      preferences,
      category,
      limit,
    } = body;

    const result = await recommendationEngine.getPersonalizedRecommendations({
      userId,
      sessionId,
      currentProductId,
      cartItems,
      browseHistory,
      preferences,
      category,
      limit: Math.min(Math.max(1, parseInt(String(limit)) || 10), 50),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error getting personalized recommendations", error as Error, { context: "recommendations-personalized-api" });
    return NextResponse.json(
      { error: "Failed to get personalized recommendations" },
      { status: 500 }
    );
  }
}
