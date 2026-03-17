/**
 * LIKEFOOD - User Referral History, Commissions, Milestones
 * GET /api/user/referrals/history
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
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [relations, total] = await Promise.all([
      prisma.referralrelation.findMany({
        where: { referrerUserId: Number(session.user.id) },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          source: true,
          createdAt: true,
          qualifiedAt: true,
          referred: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.referralrelation.count({
        where: { referrerUserId: Number(session.user.id) },
      }),
    ]);

    const items = relations.map((r) => ({
      id: r.id,
      referredName: r.referred.name
        ? r.referred.name.charAt(0) + "***"
        : null,
      referredEmail: r.referred.email
        ? r.referred.email.replace(
            /(.{2})(.*)(@.*)/,
            "$1***$3"
          )
        : null,
      status: r.status,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
      qualifiedAt: r.qualifiedAt?.toISOString() || null,
    }));

    return NextResponse.json({ items, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
