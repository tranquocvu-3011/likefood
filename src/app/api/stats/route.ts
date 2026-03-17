/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
    // Rate limit: public endpoint, but prevent bulk scraping
    const identifier = getRateLimitIdentifier(req);
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rl.success) {
        return rl.error as unknown as NextResponse;
    }

    try {
        // Fetch real stats from database
        const [
            totalCustomers,
            totalOrders,
            totalProducts,
            avgRatingData
        ] = await Promise.all([
            // Total customers: count all user records in database
            prisma.user.count(),

            // Total orders
            prisma.order.count(),

            // Total products
            prisma.product.count({
                where: {
                    inventory: { gt: 0 }
                }
            }),

            // Average rating
            prisma.review.aggregate({
                _avg: {
                    rating: true
                }
            })
        ]);

        const avgRating = avgRatingData._avg.rating ?? 0;

        const stats = {
            totalCustomers,
            totalOrders,
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalProducts,
        };

        return NextResponse.json(stats);
    } catch {
        // Return error instead of fake data
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
