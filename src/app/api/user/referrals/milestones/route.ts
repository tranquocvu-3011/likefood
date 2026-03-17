/**
 * LIKEFOOD - User Referral Milestones API
 * GET /api/user/referrals/milestones
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getMilestoneProgress } from "@/lib/referral/milestone.service";

export async function GET() {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const milestones = await getMilestoneProgress(Number(session.user.id));
    return NextResponse.json({ milestones });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
