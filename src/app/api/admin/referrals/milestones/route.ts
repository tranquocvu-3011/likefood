/**
 * LIKEFOOD - Admin Milestones CRUD
 * GET /api/admin/referrals/milestones — List milestones
 * POST /api/admin/referrals/milestones — Create milestone
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { milestoneSchema } from "@/lib/referral/types";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const milestones = await prisma.referralmilestone.findMany({
      orderBy: { milestone: "asc" },
      include: {
        _count: { select: { milestoneRewards: true } },
      },
    });

    return NextResponse.json({
      milestones: milestones.map((m) => ({
        ...m,
        rewardValue: Number(m.rewardValue),
        grantedCount: m._count.milestoneRewards,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = milestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    // Check milestone number unique
    const existing = await prisma.referralmilestone.findUnique({
      where: { milestone: parsed.data.milestone },
    });
    if (existing) {
      return NextResponse.json({ error: "Milestone number already exists" }, { status: 400 });
    }

    const milestone = await prisma.referralmilestone.create({
      data: {
        ...parsed.data,
        rewardValue: parsed.data.rewardValue,
      },
    });

    await prisma.referralauditlog.create({
      data: {
        actorUserId: Number(session.user.id),
        action: "MILESTONE_CREATED",
        entityType: "referralmilestone",
        entityId: milestone.id,
        afterData: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json({ ...milestone, rewardValue: Number(milestone.rewardValue) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
