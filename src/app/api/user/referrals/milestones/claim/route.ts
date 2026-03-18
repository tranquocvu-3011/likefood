/**
 * LIKEFOOD - User Referral Milestone Claim API
 * POST /api/user/referrals/milestones/claim
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { claimMilestoneReward } from "@/lib/referral/milestone.service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await req.json().catch(() => ({}));
    const milestoneId = Number(body?.milestoneId);

    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return NextResponse.json({ error: "milestoneId không hợp lệ." }, { status: 400 });
    }

    const result = await claimMilestoneReward(Number(session.user.id), milestoneId);

    if (result.alreadyClaimed) {
      return NextResponse.json(
        {
          success: true,
          message: "Mốc thưởng này đã được nhận trước đó.",
          ...result,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nhận thưởng thành công.",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể nhận thưởng.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
