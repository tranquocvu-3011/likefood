/**
 * LIKEFOOD - Behavior Insights API
 * Trả về AI behavior analysis cho admin dashboard
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  getUserSegments,
  getConversionFunnel,
  getAIBehaviorInsights,
} from "@/lib/ai/ai-behavior-analyzer";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [segments, funnel, insights] = await Promise.all([
      getUserSegments(30),
      getConversionFunnel(30),
      getAIBehaviorInsights(30),
    ]);

    return NextResponse.json({ segments, funnel, insights });
  } catch (error) {
    logger.error("[BEHAVIOR_API] error", error as Error, { context: "ai-behavior-api" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
