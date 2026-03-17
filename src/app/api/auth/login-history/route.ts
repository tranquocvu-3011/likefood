/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// GET /api/auth/login-history — Lấy lịch sử đăng nhập gần nhất
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const history = await prisma.loginhistory.findMany({
            where: { userId: Number(session.user.id) },
            orderBy: { createdAt: "desc" },
            take: 15,
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                country: true,
                city: true,
                isSuspicious: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ history });
    } catch (error) {
        logger.error("Login history error", error as Error, { context: "auth-login-history-api" });
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
