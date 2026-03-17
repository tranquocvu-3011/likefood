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
import { formatPrice } from "@/lib/currency";

const roundUsd = (amount: number) => Math.round(amount * 100) / 100;

// GET /api/vouchers/checkout - Get available vouchers for checkout with validation
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const orderTotal = roundUsd(parseFloat(searchParams.get("orderTotal") || "0"));
        const now = new Date();

        const coupons = await prisma.coupon.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: { discountValue: "desc" },
        });

        const userVouchers = await prisma.uservoucher.findMany({
            where: { userId: Number(session.user.id) },
            select: { couponId: true, status: true },
        });
        const userVoucherMap = new Map(userVouchers.map((uv) => [uv.couponId, uv.status]));

        const availableVouchers = coupons
            .map((coupon) => {
                const userStatus = userVoucherMap.get(coupon.id);
                let canUse = false;
                let reason = "";

                if (!userStatus) {
                    reason = "Bạn chưa lưu voucher này. Vui lòng lưu trước khi sử dụng.";
                } else if (userStatus === "USED") {
                    reason = "Bạn đã sử dụng voucher này rồi.";
                } else if (now > coupon.endDate) {
                    reason = "Voucher đã hết hạn.";
                } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    reason = "Voucher đã hết lượt sử dụng.";
                } else if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
                    const remaining = roundUsd(coupon.minOrderValue - orderTotal);
                    reason = `Đơn hàng tối thiểu ${formatPrice(coupon.minOrderValue)}. Còn thiếu ${formatPrice(remaining)}.`;
                } else {
                    canUse = true;
                }

                let discountAmount = 0;
                if (canUse) {
                    if (coupon.discountType === "PERCENTAGE") {
                        discountAmount = roundUsd((orderTotal * coupon.discountValue) / 100);
                        if (coupon.maxDiscount) {
                            discountAmount = Math.min(discountAmount, roundUsd(coupon.maxDiscount));
                        }
                    } else {
                        discountAmount = roundUsd(coupon.discountValue);
                    }
                }

                return {
                    id: coupon.id,
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    discountAmount,
                    minOrderValue: coupon.minOrderValue,
                    maxDiscount: coupon.maxDiscount,
                    category: coupon.category,
                    canUse,
                    reason,
                };
            })
            .filter((voucher) => userVoucherMap.has(voucher.id));

        availableVouchers.sort((a, b) => {
            if (a.canUse && !b.canUse) return -1;
            if (!a.canUse && b.canUse) return 1;
            return b.discountAmount - a.discountAmount;
        });

        return NextResponse.json({ vouchers: availableVouchers });
    } catch (error) {
        logger.error("Get checkout vouchers error", error as Error, { context: "vouchers-checkout-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi tải voucher" },
            { status: 500 }
        );
    }
}
