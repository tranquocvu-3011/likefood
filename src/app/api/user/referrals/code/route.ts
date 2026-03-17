/**
 * LIKEFOOD - User Referral Code Management
 * PATCH /api/user/referrals/code — Update custom referral code
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { updateCustomCode } from "@/lib/referral/code.service";
import { updateCodeSchema } from "@/lib/referral/types";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = updateCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid code" },
        { status: 400 }
      );
    }

    const result = await updateCustomCode(session.user.id, parsed.data.code);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, code: parsed.data.code.toUpperCase() });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
