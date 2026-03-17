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
import { seedKnowledgeBase } from "@/lib/ai/knowledge-base";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await seedKnowledgeBase();
    return NextResponse.json({ success: true, message: "Knowledge base seeded successfully" });
  } catch (error) {
    logger.error("Error seeding knowledge base", error as Error, { context: "ai-knowledge-seed-api" });
    return NextResponse.json({ error: "Failed to seed knowledge base" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST to this endpoint to seed the knowledge base",
    example: "curl -X POST http://localhost:3000/api/ai/knowledge/seed"
  });
}
