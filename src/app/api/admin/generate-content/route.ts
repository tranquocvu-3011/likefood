/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Ratelimit } from "@upstash/ratelimit";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { generateProductContent } from "@/lib/ai/content-generator";
import { applyRateLimit, getRateLimitIdentifier, redis } from "@/lib/ratelimit";

const aiGenerateRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "ratelimit:ai-generate",
    })
  : null;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(request, String(session.user.id));
  const rateLimitResult = await applyRateLimit(identifier, aiGenerateRateLimit, {
    windowMs: 3600000,
    maxRequests: 10,
  });
  if (!rateLimitResult.success) return rateLimitResult.error as unknown as NextResponse;

  try {
    const body = await request.json();
    const { name, category, features } = body || {};

    if (!name || !category) {
      return NextResponse.json({ error: "Product name and category are required." }, { status: 400 });
    }
    if (typeof name !== "string" || name.length > 200) {
      return NextResponse.json({ error: "Product name must be 200 characters or fewer." }, { status: 400 });
    }
    if (typeof category !== "string" || category.length > 100) {
      return NextResponse.json({ error: "Category must be 100 characters or fewer." }, { status: 400 });
    }

    const content = await generateProductContent({
      name,
      category,
      features: Array.isArray(features)
        ? features.filter((feature: unknown): feature is string => typeof feature === "string" && feature.trim() !== "")
        : [],
      tone: "vi",
    });

    return NextResponse.json(content);
  } catch (error) {
    logger.error("[ADMIN_GENERATE_CONTENT]", error as Error, { context: "admin-generate-content-api" });
    return NextResponse.json({ error: "Unable to generate AI content right now." }, { status: 500 });
  }
}
