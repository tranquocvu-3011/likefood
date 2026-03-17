/**
 * LIKEFOOD - User Referral Commissions API
 * GET /api/user/referrals/commissions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));

    const [commissions, total] = await Promise.all([
      prisma.referralcommission.findMany({
        where: { referrerUserId: Number(session.user.id) },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderId: true,
          rate: true,
          baseAmount: true,
          commissionAmount: true,
          status: true,
          holdUntil: true,
          createdAt: true,
          referred: { select: { name: true } },
        },
      }),
      prisma.referralcommission.count({
        where: { referrerUserId: Number(session.user.id) },
      }),
    ]);

    const items = commissions.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      referredName: c.referred.name ? c.referred.name.charAt(0) + "***" : null,
      rate: Number(c.rate),
      baseAmount: Number(c.baseAmount),
      commissionAmount: Number(c.commissionAmount),
      status: c.status,
      holdUntil: c.holdUntil?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ items, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
