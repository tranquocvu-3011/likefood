/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// GET /api/auth/sessions — Danh sách thiết bị đang đăng nhập
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessions = await prisma.activesession.findMany({
            where: { userId: Number(session.user.id) },
            orderBy: { lastSeen: "desc" },
            take: 10,
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        logger.error("Sessions fetch error", error as Error, { context: "auth-sessions-api" });
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// DELETE /api/auth/sessions — Revoke 1 hoặc tất cả sessions
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("id");

        if (sessionId) {
            // Revoke specific session
            await prisma.activesession.deleteMany({
                where: { id: Number(sessionId), userId: Number(session.user.id) },
            });
            return NextResponse.json({ message: "Đã đăng xuất thiết bị" });
        } else {
            // Revoke all sessions
            await prisma.activesession.deleteMany({
                where: { userId: Number(session.user.id) },
            });
            return NextResponse.json({ message: "Đã đăng xuất tất cả thiết bị" });
        }
    } catch (error) {
        logger.error("Session revoke error", error as Error, { context: "auth-sessions-api" });
        return NextResponse.json({ error: "Failed to revoke" }, { status: 500 });
    }
}
