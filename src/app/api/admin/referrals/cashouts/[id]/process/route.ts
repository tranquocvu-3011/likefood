/**
 * LIKEFOOD - Admin Process Cashout
 * POST /api/admin/referrals/cashouts/[id]/process — Approve/Reject/Process
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { processCashoutByAdmin } from "@/lib/referral/cashout.service";
import { processCashoutSchema } from "@/lib/referral/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const body = await req.json();
    const parsed = processCashoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const result = await processCashoutByAdmin(
      Number(id),
      parsed.data.action,
      String(session.user.id),
      parsed.data.adminNote
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
