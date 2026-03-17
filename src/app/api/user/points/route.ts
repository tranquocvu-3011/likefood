/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/client";

// GET - List user's point transactions
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const VALID_POINT_TYPES = new Set(["EARN"]);
        const rawType = url.searchParams.get("type");
        if (rawType && rawType !== "all" && !VALID_POINT_TYPES.has(rawType)) {
            return NextResponse.json({ error: "Loại giao dịch không hợp lệ" }, { status: 400 });
        }
        const type = rawType;
        let page = parseInt(url.searchParams.get("page") || "1");
        if (isNaN(page) || page < 1) page = 1;
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));

        const where: Prisma.pointtransactionWhereInput = { userId: Number(session.user.id) };
        if (type && type !== "all") {
            where.type = type;
        }

        const [transactions, total] = await Promise.all([
            prisma.pointtransaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.pointtransaction.count({ where }),
        ]);

        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { points: true },
        });

        return NextResponse.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            currentPoints: user?.points || 0,
        });
    } catch (error) {
        logger.error("Points history error", error as Error, { context: "user-points-api" });
        return NextResponse.json({ error: "Lỗi khi tải lịch sử điểm" }, { status: 500 });
    }
}
