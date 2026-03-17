/**
 * LIKEFOOD - User Cashout + Commissions + Milestones APIs
 * POST /api/user/referrals/cashout
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createCashoutRequest } from "@/lib/referral/cashout.service";
import { cashoutRequestSchema } from "@/lib/referral/types";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = cashoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const result = await createCashoutRequest(
      session.user.id,
      parsed.data.amount,
      parsed.data.method,
      parsed.data.destinationData
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, cashoutId: result.cashoutId });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
