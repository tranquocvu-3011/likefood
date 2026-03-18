/**
 * LIKEFOOD - User Referral Dashboard API
 * GET /api/user/referrals/dashboard
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getOrCreateProfile } from "@/lib/referral/code.service";
import { getReferralConfig } from "@/lib/referral/config.service";
import { ensureDefaultReferralMilestones } from "@/lib/referral/milestone.service";
import prisma from "@/lib/prisma";
import type { ReferralDashboard } from "@/lib/referral/types";

export async function GET() {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const userId = Number(session.user.id);
    const profile = await getOrCreateProfile(userId);
    const config = await getReferralConfig();
    await ensureDefaultReferralMilestones();

    // Get next unachieved milestone
    const nextMilestone = await prisma.referralmilestone.findFirst({
      where: {
        isActive: true,
        milestone: { gt: profile.qualifiedInvites },
      },
      orderBy: { milestone: "asc" },
      select: { milestone: true, rewardType: true, rewardValue: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";
    const shareCode = profile.customCode || profile.systemCode;

    const dashboard: ReferralDashboard = {
      profile: {
        customCode: profile.customCode,
        systemCode: profile.systemCode,
        tier: profile.tier,
        isLocked: profile.isLocked,
      },
      stats: {
        totalInvites: profile.totalInvites,
        qualifiedInvites: profile.qualifiedInvites,
        pendingBalance: Number(profile.pendingBalance),
        availableBalance: Number(profile.availableBalance),
        withdrawnBalance: Number(profile.withdrawnBalance),
        convertedBalance: Number(profile.convertedBalance),
      },
      shareLink: `${baseUrl}?ref=${shareCode}`,
      nextMilestone: nextMilestone ? {
        milestone: nextMilestone.milestone,
        rewardType: nextMilestone.rewardType,
        rewardValue: Number(nextMilestone.rewardValue),
        remaining: nextMilestone.milestone - profile.qualifiedInvites,
      } : null,
      cashoutEligible:
        Number(profile.availableBalance) >= config.minimumCashoutAmount &&
        !profile.isLocked,
      config: {
        commissionRate: config.commissionRate,
        minimumCashoutAmount: config.minimumCashoutAmount,
        enabledCashoutMethods: config.enabledCashoutMethods,
      },
    };

    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
