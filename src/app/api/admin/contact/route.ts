/**
 * LIKEFOOD - Admin Contact Messages API
 * GET: List messages, PATCH: Update status
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {};
        if (status) where.status = status;

        const messages = await prisma.contactmessage.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 500,
        });

        return NextResponse.json({ messages });
    } catch {
        return NextResponse.json({ error: "Không thể tải tin nhắn" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
        }

        const updated = await prisma.contactmessage.update({
            where: { id: parseInt(id) },
            data: { status },
        });

        return NextResponse.json({ ok: true, message: updated });
    } catch {
        return NextResponse.json({ error: "Không thể cập nhật" }, { status: 500 });
    }
}
