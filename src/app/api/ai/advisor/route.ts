/**
 * LIKEFOOD — AI Product Advisor API
 * POST /api/ai/advisor — tư vấn sản phẩm
 * POST /api/ai/advisor/compare — so sánh sản phẩm
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { getAdvisorResponse, compareProducts, getProductStrengthsWeaknesses } from "@/lib/ai/product-advisor";

export async function POST(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);
  const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 15 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, query, productId, productIds, userId, language } = body ?? {};

    switch (action) {
      case "compare": {
        if (!Array.isArray(productIds) || productIds.length < 2) {
          return NextResponse.json({ error: "Cần ít nhất 2 sản phẩm để so sánh" }, { status: 400 });
        }
        const comparison = await compareProducts(productIds.map(Number).slice(0, 5));
        if (!comparison) {
          return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
        }
        return NextResponse.json({ comparison });
      }

      case "strengths": {
        if (!productId) {
          return NextResponse.json({ error: "productId bắt buộc" }, { status: 400 });
        }
        const analysis = await getProductStrengthsWeaknesses(Number(productId));
        if (!analysis) {
          return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
        }
        return NextResponse.json({ analysis });
      }

      case "advise":
      default: {
        if (!query || typeof query !== "string") {
          return NextResponse.json({ error: "query bắt buộc" }, { status: 400 });
        }
        if (query.length > 500) {
          return NextResponse.json({ error: "Query quá dài" }, { status: 400 });
        }
        const response = await getAdvisorResponse(
          query.trim(),
          userId ? Number(userId) : undefined,
          language === "en" ? "en" : "vi"
        );
        return NextResponse.json({ response });
      }
    }
  } catch (error) {
    logger.error("[AI_ADVISOR] Error", error as Error, { context: "ai-advisor-api" });
    return NextResponse.json({ error: "Không thể tư vấn" }, { status: 500 });
  }
}
