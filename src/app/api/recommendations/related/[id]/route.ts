/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { recommendationEngine } from "@/lib/ai/recommendation-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "similar";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "similar":
        result = await recommendationEngine.getSimilarProducts(Number(productId), limit);
        break;

      case "frequently_bought_together":
        result = await recommendationEngine.getFrequentlyBoughtTogether(Number(productId), limit);
        break;

      case "up_sell":
        result = await recommendationEngine.getUpSellRecommendations(Number(productId), limit);
        break;

      case "cross_sell":
        result = await recommendationEngine.getCrossSellRecommendations([Number(productId)], limit);
        break;

      default:
        result = await recommendationEngine.getSimilarProducts(Number(productId), limit);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("Error getting related products", error as Error, { context: "recommendations-related-id-api" });
    return NextResponse.json(
      { error: "Failed to get related products" },
      { status: 500 }
    );
  }
}
