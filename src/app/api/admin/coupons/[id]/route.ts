/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateCouponSchema = z.object({
    code: z.string().min(1).max(50).optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    discountValue: z
        .number()
        .positive("discountValue phải dương")
        .max(100, "Tỷ lệ giảm tối đa 100%")
        .optional(),
    minOrderValue: z.number().min(0).optional().nullable(),
    maxDiscount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    category: z.string().max(100).optional(),
});

// PUT update coupon
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        const parsed = updateCouponSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // Validate PERCENTAGE <= 100
        if (data.discountType === "PERCENTAGE" && data.discountValue && data.discountValue > 100) {
            return NextResponse.json({ error: "Tỷ lệ giảm giá không thể vượt quá 100%" }, { status: 400 });
        }

        const coupon = await prisma.coupon.update({
            where: { id: Number(id) },
            data: {
                ...(data.code && { code: data.code.toUpperCase() }),
                ...(data.discountType && { discountType: data.discountType }),
                ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
                ...(data.minOrderValue !== undefined && { minOrderValue: data.minOrderValue ?? 0 }),
                ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount }),
                ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.endDate && { endDate: new Date(data.endDate) }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.category && { category: data.category }),
            },
        });

        return NextResponse.json(coupon);
    } catch (error) {
        logger.error("Coupon update error", error as Error, { context: "admin-coupons-id-api" });
        return NextResponse.json({ error: "Lỗi khi cập nhật mã giảm giá" }, { status: 500 });
    }
}

// DELETE coupon
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.coupon.delete({ where: { id: Number(id) } });
        return NextResponse.json({ message: "Đã xóa mã giảm giá" });
    } catch (error) {
        logger.error("Coupon delete error", error as Error, { context: "admin-coupons-id-api" });
        return NextResponse.json({ error: "Lỗi khi xóa mã giảm giá" }, { status: 500 });
    }
}
