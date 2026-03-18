/**
 * LIKEFOOD - Admin Newsletter API
 * GET: List subscribers, DELETE: Remove subscriber
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const subscribers = await prisma.newslettersubscriber.findMany({
            orderBy: { subscribedAt: "desc" },
        });

        return NextResponse.json({ subscribers });
    } catch {
        return NextResponse.json({ error: "Không thể tải danh sách" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        await prisma.newslettersubscriber.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Không thể xóa" }, { status: 500 });
    }
}
