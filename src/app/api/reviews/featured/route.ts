/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
    const identifier = getRateLimitIdentifier(req);
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    try {
        const reviews = await prisma.review.findMany({
            where: {
                rating: {
                    gte: 4
                }
            },
            take: 8,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                    }
                }
            }
        });

        // Map to format suitable for CustomerReviews component
        const formattedReviews = reviews.map(r => ({
            id: r.id,
            name: r.user.name || "Khách hàng",
            location: "USA", // Default location
            rating: r.rating,
            quote: r.comment || "Sản phẩm tuyệt vời!",
            avatar: r.user.image || (r.user.name ? r.user.name[0].toUpperCase() : "👤")
        }));

        const res = NextResponse.json(formattedReviews);
        // Featured reviews rất ít đổi → cache 10 phút
        res.headers.set(
            "Cache-Control",
            "public, s-maxage=600, stale-while-revalidate=1200"
        );
        return res;
    } catch (error) {
        logger.error("Error fetching featured reviews", error as Error, { context: "reviews-featured-api" });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
