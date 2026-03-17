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
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
    try {
        const rl = await applyRateLimit(getRateLimitIdentifier(req), apiRateLimit, { windowMs: 60000, maxRequests: 30 });
        if (!rl.success) return rl.error!;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = Number(session.user.id);

        // Get all stats in parallel
        const now = new Date();
        const [ordersCount, wishlistCount, vouchersCount] = await Promise.all([
            // Count user's orders
            prisma.order.count({
                where: { userId }
            }),
            // Count wishlist items
            prisma.wishlist.count({
                where: { userId }
            }),
            // Count available vouchers in the user's wallet (CLAIMED + coupon still active)
            prisma.uservoucher.count({
                where: {
                    userId,
                    status: "CLAIMED",
                    coupon: {
                        isActive: true,
                        startDate: { lte: now },
                        endDate: { gte: now },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            orders: ordersCount,
            wishlist: wishlistCount,
            vouchers: vouchersCount
        });
    } catch (error) {
        logger.error("Error fetching user stats", error as Error, { context: "user-stats-api" });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
