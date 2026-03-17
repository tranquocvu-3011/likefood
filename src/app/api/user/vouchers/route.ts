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

// GET /api/user/vouchers - Get user's voucher wallet
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status"); // available | used | expired | all

        const now = new Date();

        // Get user's vouchers
        const userVouchers = await prisma.uservoucher.findMany({
            where: { userId: Number(session.user.id) },
            take: 200,
            include: {
                coupon: true,
            },
            orderBy: { claimedAt: "desc" },
        });

        // Filter and format
        const vouchers = userVouchers
            .map((uv) => {
                const coupon = uv.coupon;
                let walletStatus: "available" | "used" | "expired" = "available";

                if (uv.status === "USED") {
                    walletStatus = "used";
                } else if (now > coupon.endDate || !coupon.isActive) {
                    walletStatus = "expired";
                } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    walletStatus = "expired";
                } else {
                    walletStatus = "available";
                }

                return {
                    id: uv.id,
                    couponId: coupon.id,
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    minOrderValue: coupon.minOrderValue,
                    maxDiscount: coupon.maxDiscount,
                    startDate: coupon.startDate,
                    endDate: coupon.endDate,
                    category: coupon.category,
                    status: walletStatus,
                    claimedAt: uv.claimedAt,
                    usedAt: uv.usedAt,
                };
            })
            .filter((v) => !status || status === "all" || v.status === status);

        return NextResponse.json({ vouchers });
    } catch (error) {
        // best-effort logging
        logger.error("[user-vouchers] failed to load", error as Error, { context: "user-vouchers-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi tải voucher" },
            { status: 500 }
        );
    }
}
