/**
 * LIKEFOOD - Admin Cashout Management
 * GET /api/admin/referrals/cashouts — List cashout requests
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));

    const where = status ? { status } : {};

    const [cashouts, total] = await Promise.all([
      prisma.referralcashout.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.referralcashout.count({ where }),
    ]);

    return NextResponse.json({
      items: cashouts.map((c) => ({
        ...c,
        amount: Number(c.amount),
        userName: c.user.name,
        userEmail: c.user.email,
      })),
      total,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
