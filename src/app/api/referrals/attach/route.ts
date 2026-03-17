/**
 * LIKEFOOD - Referral Attach API
 * POST /api/referrals/attach — Attach a referrer to the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { attachReferral } from "@/lib/referral/attach.service";
import { attachReferralSchema } from "@/lib/referral/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = attachReferralSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await attachReferral({
      userId: Number(session.user.id),
      code: parsed.data.code,
      source: parsed.data.source,
      ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, relationId: result.relationId });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
