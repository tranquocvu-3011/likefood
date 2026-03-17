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
import { formatPrice } from "@/lib/currency";

const roundUsd = (amount: number) => Math.round(amount * 100) / 100;

export async function POST(request: NextRequest) {
    try {
        const identifier = getRateLimitIdentifier(request);
        const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60000, maxRequests: 10 });
        if (!rl.success) return rl.error as unknown as NextResponse;

        const { code, orderTotal } = await request.json();
        const normalizedOrderTotal = roundUsd(Number(orderTotal) || 0);

        if (!code || typeof code !== "string") {
            return NextResponse.json({ error: "Mã giảm giá không hợp lệ" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            return NextResponse.json({ error: "Mã giảm giá không tồn tại" }, { status: 404 });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ error: "Mã giảm giá đã hết hiệu lực" }, { status: 400 });
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
        }

        if (coupon.minOrderValue && normalizedOrderTotal < coupon.minOrderValue) {
            return NextResponse.json(
                { error: `Đơn hàng tối thiểu ${formatPrice(coupon.minOrderValue)}` },
                { status: 400 }
            );
        }

        let discountAmount = 0;
        if (coupon.discountType === "PERCENTAGE") {
            discountAmount = roundUsd((normalizedOrderTotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, roundUsd(coupon.maxDiscount));
            }
        } else {
            discountAmount = roundUsd(coupon.discountValue);
        }

        if (discountAmount > normalizedOrderTotal) {
            discountAmount = normalizedOrderTotal;
        }

        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
            },
            message: `Áp dụng thành công: Giảm ${formatPrice(discountAmount)}`,
        });
    } catch (error) {
        logger.error("Coupon validation error", error as Error, { context: "coupons-validate-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi kiểm tra mã giảm giá" },
            { status: 500 }
        );
    }
}
