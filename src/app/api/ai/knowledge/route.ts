/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { searchKnowledge, getKnowledgeByCategory, type KnowledgeCategory } from "@/lib/ai/knowledge-base";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category") as KnowledgeCategory | null;
    const language = searchParams.get("language") as "vi" | "en" | null;
    const limit = parseInt(searchParams.get("limit") || "10");

    let results;

    if (query) {
      results = await searchKnowledge(query, language || undefined, limit);
    } else if (category) {
      results = await getKnowledgeByCategory(category, language || undefined, limit);
    } else {
      return NextResponse.json(
        { error: "Missing required parameter: q (query) or category" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error("Error searching knowledge", error as Error, { context: "ai-knowledge-api" });
    return NextResponse.json(
      { error: "Failed to search knowledge base" },
      { status: 500 }
    );
  }
}
