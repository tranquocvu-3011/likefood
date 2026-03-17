/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 *
 * POST /api/vouchers/validate – Validate a manually entered voucher code
 * Used by VoucherPickerModal for manual code entry
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { formatPrice } from "@/lib/currency";

const roundUsd = (amount: number) => Math.round(amount * 100) / 100;

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Vui lòng đăng nhập để sử dụng mã giảm giá" },
                { status: 401 }
            );
        }

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

        // Check if user has claimed this voucher
        const userVoucher = await prisma.uservoucher.findUnique({
            where: {
                userId_couponId: {
                    userId: Number(session.user.id),
                    couponId: coupon.id,
                },
            },
        });

        // If user hasn't claimed, auto-claim it for them
        if (!userVoucher) {
            await prisma.uservoucher.create({
                data: {
                    userId: Number(session.user.id),
                    couponId: coupon.id,
                    status: "CLAIMED",
                },
            });
        } else if (userVoucher.status === "USED") {
            return NextResponse.json(
                { error: "Bạn đã sử dụng mã giảm giá này rồi" },
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

        // Return in format expected by VoucherPickerModal (data.voucher)
        return NextResponse.json({
            valid: true,
            voucher: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                minOrderValue: coupon.minOrderValue,
                maxDiscount: coupon.maxDiscount,
                category: coupon.category,
                canUse: true,
                reason: "",
            },
            message: `Áp dụng thành công: Giảm ${formatPrice(discountAmount)}`,
        });
    } catch (error) {
        logger.error("Voucher validation error", error as Error, { context: "vouchers-validate-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi kiểm tra mã giảm giá" },
            { status: 500 }
        );
    }
}
