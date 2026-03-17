/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/admin/reviews - List reviews (pending moderation or all)
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "PENDING"; // default: show pending
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    try {
        const where = status === "ALL" ? {} : { status };

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    product: { select: { id: true, name: true, slug: true } },
                    media: { orderBy: { order: "asc" } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        return NextResponse.json({
            reviews,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Admin reviews fetch error", error as Error, { context: "admin-reviews-get" });
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}


