/**
 * LIKEFOOD - Referral Validate API
 * POST /api/referrals/validate — Validate a referral code and preview reward
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveReferralCode } from "@/lib/referral/code.service";
import { getReferralConfig } from "@/lib/referral/config.service";
import { validateCodeSchema } from "@/lib/referral/types";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = validateCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
    }

    const config = await getReferralConfig();
    if (!config.programEnabled) {
      return NextResponse.json({ error: "Referral program is currently disabled" }, { status: 400 });
    }

    const resolved = await resolveReferralCode(parsed.data.code);
    if (!resolved) {
      return NextResponse.json({ valid: false, error: "Code not found" }, { status: 404 });
    }

    // Get referrer info (masked for security)
    const referrer = await prisma.user.findUnique({
      where: { id: resolved.userId },
      select: { name: true },
    });

    const maskedName = referrer?.name
      ? referrer.name.charAt(0) + "***" + referrer.name.charAt(referrer.name.length - 1)
      : "***";

    return NextResponse.json({
      valid: true,
      referrerName: maskedName,
      welcomeReward: config.welcomeRewardEnabled ? {
        type: config.welcomeRewardType,
        value: config.welcomeRewardValue,
        minOrder: config.welcomeRewardMinOrder,
      } : null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
