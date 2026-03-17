/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AI Intent Classification API
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { classifyIntent, getIntentDisplayName, type Intent as _Intent } from "@/lib/ai/intent-classifier";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  // Rate limit: 60 per minute per IP
  const identifier = getRateLimitIdentifier(req);
  const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const result = classifyIntent(message);

    return NextResponse.json({
      success: true,
      intent: result.intent,
      confidence: result.confidence,
      entities: result.entities,
      nextAction: result.nextAction,
      displayName: {
        vi: getIntentDisplayName(result.intent, "vi"),
        en: getIntentDisplayName(result.intent, "en"),
      },
    });
  } catch (error) {
    logger.error("Error classifying intent", error as Error, { context: "ai-intent-api" });
    return NextResponse.json(
      { error: "Failed to classify intent" },
      { status: 500 }
    );
  }
}
