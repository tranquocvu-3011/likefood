/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../../generated/client";

// GET all coupons (admin)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // active, upcoming, expired
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
        const skip = (page - 1) * limit;

        const now = new Date();
        const where: Prisma.CouponWhereInput = {};

        if (status === "active") {
            where.startDate = { lte: now };
            where.endDate = { gte: now };
            where.isActive = true;
        } else if (status === "upcoming") {
            where.startDate = { gt: now };
        } else if (status === "expired") {
            where.OR = [
                { endDate: { lt: now } },
                { isActive: false },
            ];
        }

        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    _count: { select: { userVouchers: true } },
                },
            }),
            prisma.coupon.count({ where }),
        ]);

        return NextResponse.json({
            coupons,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Coupons fetch error", error as Error, { context: "admin-coupons-api" });
        return NextResponse.json({ error: "Lỗi khi tải mã giảm giá" }, { status: 500 });
    }
}

// POST create coupon
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // API-03: Apply Zod validation schema
        const { createCouponSchema } = await import('@/lib/validations/coupon');
        const { validationErrorResponse } = await import('@/lib/validations/utils');
        
        const validationResult = createCouponSchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json(
                validationErrorResponse(validationResult.error),
                { status: 400 }
            );
        }

        const {
            code,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            usageLimit,
            startDate,
            endDate,
            category,
            isActive,
        } = validationResult.data;

        // API-03 additional validation: PERCENTAGE must be 0-100
        if (discountType === 'PERCENTAGE' && discountValue > 100) {
            return NextResponse.json(
                { error: "Giảm giá theo phần trăm không được vượt quá 100%" },
                { status: 400 }
            );
        }

        // Check duplicate code
        const existing = await prisma.coupon.findFirst({
            where: { code: code.toUpperCase() },
        });
        if (existing) {
            return NextResponse.json({ error: "Mã giảm giá đã tồn tại" }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                discountType, // PERCENTAGE, FIXED
                discountValue,
                minOrderValue: minOrderValue || 0,
                maxDiscount: maxDiscount || null,
                usageLimit: usageLimit || null,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: isActive !== undefined ? isActive : true,
                category: category || "all",
            },
        });

        return NextResponse.json(coupon, { status: 201 });
    } catch (error) {
        logger.error("Coupon create error", error as Error, { context: "admin-coupons-api" });
        return NextResponse.json({ error: "Lỗi khi tạo mã giảm giá" }, { status: 500 });
    }
}
