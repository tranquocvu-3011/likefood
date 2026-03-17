/**
 * LIKEFOOD - Admin Referral Config API
 * GET /api/admin/referrals/config — Get config
 * PUT /api/admin/referrals/config — Update config
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getReferralConfig, updateReferralConfig } from "@/lib/referral/config.service";
import { updateConfigSchema } from "@/lib/referral/types";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const config = await getReferralConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = updateConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const before = await getReferralConfig();
    const updated = await updateReferralConfig(parsed.data);

    // Audit log
    await prisma.referralauditlog.create({
      data: {
        actorUserId: Number(session.user.id),
        action: "CONFIG_UPDATED",
        entityType: "config",
        beforeData: JSON.stringify(before),
        afterData: JSON.stringify(updated),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
