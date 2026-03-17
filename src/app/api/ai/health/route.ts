/**
 * LIKEFOOD — AI Health Check API
 * GET /api/ai/health → trạng thái hệ thống AI
 */

import { NextResponse } from "next/server";
import { checkAIHealth } from "@/lib/ai/ai-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const health = await checkAIHealth();
    return NextResponse.json(health, { status: health.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
