/**
 * LIKEFOOD — AI Combo API
 * GET /api/ai/combo?type=snack&limit=3
 * POST /api/ai/combo — tạo combo từ query
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { getComboSuggestions, getActiveCombo } from "@/lib/ai/combo-engine";
import type { ComboType } from "@/lib/ai/ai-types";

export async function GET(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);
  const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 20 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ComboType | null;
    const productId = searchParams.get("productId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "3", 10), 6);
    const cached = searchParams.get("cached");

    // Return cached combos from DB
    if (cached === "true") {
      const combos = await getActiveCombo(type ?? undefined);
      return NextResponse.json({ combos, source: "cached" });
    }

    // Generate fresh combos
    const combos = await getComboSuggestions({
      type: type ?? undefined,
      productIds: productId ? [Number(productId)] : undefined,
      limit,
    });

    return NextResponse.json({ combos, source: "generated" });
  } catch (error) {
    logger.error("[AI_COMBO] Error", error as Error, { context: "ai-combo-api" });
    return NextResponse.json({ error: "Không thể tạo combo" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);
  const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 10 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { query, type, userId, productIds, limit } = body ?? {};

    if (!query && !type) {
      return NextResponse.json({ error: "Query hoặc type bắt buộc" }, { status: 400 });
    }

    if (query && (typeof query !== "string" || query.length > 500)) {
      return NextResponse.json({ error: "Query không hợp lệ" }, { status: 400 });
    }

    const combos = await getComboSuggestions({
      query: query?.trim(),
      type: type as ComboType,
      userId: userId ? Number(userId) : undefined,
      productIds: Array.isArray(productIds) ? productIds.map(Number) : undefined,
      limit: Math.min(limit || 3, 6),
    });

    return NextResponse.json({ combos, source: "generated" });
  } catch (error) {
    logger.error("[AI_COMBO] POST error", error as Error, { context: "ai-combo-api" });
    return NextResponse.json({ error: "Không thể tạo combo" }, { status: 500 });
  }
}
