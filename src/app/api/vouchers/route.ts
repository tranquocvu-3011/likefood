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
import { createPromoNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../generated/client";

// GET /api/vouchers - list vouchers from DB with user-specific status
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get("category"); // all | shipping | flash | new

        const now = new Date();

        const where: Prisma.CouponWhereInput = {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        };

        if (category && category !== "all") {
            where.category = category;
        }

        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: { startDate: "asc" },
        });

        let userVouchers: Record<string, string> = {};
        if (userId) {
            const records = await prisma.uservoucher.findMany({
                where: { userId },
                select: { couponId: true, status: true },
            });
            userVouchers = records.reduce((acc, r) => {
                acc[r.couponId] = r.status;
                return acc;
            }, {} as Record<string, string>);
        }

        const data = coupons.map((c) => {
            let status: "available" | "claimed" | "used" | "expired" | "out-of-quota" = "available";
            const userStatus = userVouchers[c.id];

            if (!c.isActive || now > c.endDate) {
                status = "expired";
            } else if (c.usageLimit && c.usedCount >= c.usageLimit) {
                status = "out-of-quota";
            } else if (userStatus === "USED") {
                status = "used";
            } else if (userStatus) {
                status = "claimed";
            }

            return {
                id: c.id,
                code: c.code,
                discountType: c.discountType,
                discountValue: c.discountValue,
                minOrderValue: c.minOrderValue,
                maxDiscount: c.maxDiscount,
                startDate: c.startDate,
                endDate: c.endDate,
                isActive: c.isActive,
                usageLimit: c.usageLimit,
                usedCount: c.usedCount,
                category: c.category,
                status,
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        logger.error("Get vouchers error", error as Error, { context: "vouchers-api-get" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi tải voucher" },
            { status: 500 }
        );
    }
}

// POST /api/vouchers/claim - claim voucher to user wallet
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Vui lòng đăng nhập để lưu voucher" },
                { status: 401 }
            );
        }

        const { code } = await request.json();
        if (!code || typeof code !== "string") {
            return NextResponse.json(
                { error: "Mã voucher không hợp lệ" },
                { status: 400 }
            );
        }

        const now = new Date();
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            return NextResponse.json(
                { error: "Voucher không tồn tại" },
                { status: 404 }
            );
        }

        if (!coupon.isActive || now < coupon.startDate || now > coupon.endDate) {
            return NextResponse.json(
                { error: "Voucher đã hết hiệu lực" },
                { status: 400 }
            );
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json(
                { error: "Voucher đã hết lượt sử dụng" },
                { status: 400 }
            );
        }

        // Idempotent claim per user
        const existing = await prisma.uservoucher.findUnique({
            where: {
                userId_couponId: {
                    userId: Number(session.user.id),
                    couponId: coupon.id,
                },
            },
        });

        if (existing) {
            return NextResponse.json({
                success: true,
                status: existing.status,
                message:
                    existing.status === "USED"
                        ? "Bạn đã sử dụng voucher này."
                        : "Bạn đã lưu voucher này rồi.",
            });
        }

        await prisma.uservoucher.create({
            data: {
                userId: Number(session.user.id),
                couponId: coupon.id,
                status: "CLAIMED",
            },
        });

        // Create notification for voucher claimed
        try {
            const discountText = coupon.discountType === "PERCENTAGE"
                ? `${coupon.discountValue}%`
                : `$${coupon.discountValue.toFixed(2)}`;
            await createPromoNotification(
                session.user.id,
                coupon.code,
                discountText,
                coupon.endDate.toLocaleDateString("vi-VN")
            );
        } catch (notifError) {
            logger.error("Failed to create voucher notification", notifError as Error, { context: "vouchers-api-post", voucherId: coupon.id });
        }

        return NextResponse.json({
            success: true,
            status: "CLAIMED",
            message: "Đã lưu voucher vào ví của bạn.",
        });
    } catch (error) {
        logger.error("Claim voucher error", error as Error, { context: "vouchers-api-post" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi lưu voucher" },
            { status: 500 }
        );
    }
}

