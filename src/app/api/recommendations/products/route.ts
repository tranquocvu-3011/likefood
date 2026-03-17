/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { recommendationEngine } from "@/lib/ai/recommendation-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "trending";
    const productId = searchParams.get("productId");
    const category = searchParams.get("category");
    let limit = parseInt(searchParams.get("limit") || "10");
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    let result;

    switch (type) {
      case "frequently_bought_together":
        if (!productId) {
          return NextResponse.json(
            { error: "productId is required for frequently_bought_together" },
            { status: 400 }
          );
        }
        result = await recommendationEngine.getFrequentlyBoughtTogether(Number(productId), limit);
        break;

      case "similar":
        if (!productId) {
          return NextResponse.json(
            { error: "productId is required for similar products" },
            { status: 400 }
          );
        }
        result = await recommendationEngine.getSimilarProducts(Number(productId), limit);
        break;

      case "trending":
        result = await recommendationEngine.getTrendingProducts(limit, category || undefined);
        break;

      case "new_arrivals":
        result = await recommendationEngine.getNewArrivals(limit, category || undefined);
        break;

      case "up_sell":
        if (!productId) {
          return NextResponse.json(
            { error: "productId is required for up_sell recommendations" },
            { status: 400 }
          );
        }
        result = await recommendationEngine.getUpSellRecommendations(Number(productId), limit);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid recommendation type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error getting recommendations", error as Error, { context: "recommendations-products-api" });
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
