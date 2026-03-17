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
import { logger } from "@/lib/logger";
import { z } from "zod";

// Inline validation schema - avoid dynamic import issues
const createFlashSaleSchema = z.object({
    name: z.string().min(3, 'Tên chương trình phải có ít nhất 3 ký tự').max(200, 'Tên chương trình không được quá 200 ký tự').trim(),
    startAt: z.coerce.date({ error: 'Thời gian bắt đầu không hợp lệ' }),
    endAt: z.coerce.date({ error: 'Thời gian kết thúc không hợp lệ' }),
    isActive: z.boolean().default(true),
}).refine(
    (data) => data.endAt > data.startAt,
    { message: 'Thời gian kết thúc phải sau thời gian bắt đầu', path: ['endAt'] }
);

// GET /api/flash-sales - Lấy danh sách flash sale campaigns
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const active = searchParams.get("active");

        const now = new Date();
        const where: {
            isActive?: boolean;
            startAt?: { lte: Date };
            endAt?: { gte: Date };
        } = {};

        if (active === "true") {
            where.isActive = true;
            where.startAt = { lte: now };
            where.endAt = { gte: now };
        }

        const campaigns = await prisma.flashsalecampaign.findMany({
            where,
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                image: true,
                                price: true,
                                category: true,
                                ratingAvg: true,
                                soldCount: true,
                                productImages: {
                                    orderBy: { order: "asc" },
                                    take: 1,
                                    select: { imageUrl: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { startAt: 'desc' }
        });

        return NextResponse.json(campaigns);
    } catch (error) {
        logger.error("Get flash sales error", error as Error, {
            context: "flash-sales-api-get"
        });
        return NextResponse.json(
            { error: "Lỗi khi tải danh sách Flash Sale" },
            { status: 500 }
        );
    }
}

// POST /api/flash-sales - Tạo flash sale campaign mới (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 401 });
        }

        const body = await request.json();
        const parsed = createFlashSaleSchema.safeParse(body);

        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ";
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { name, startAt, endAt, isActive } = parsed.data;

        const campaign = await prisma.flashsalecampaign.create({
            data: {
                name,
                startAt,
                endAt,
                isActive: isActive ?? true
            }
        });

        logger.info("Flash sale campaign created", { campaignId: campaign.id });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error) {
        logger.error("Create flash sale error", error as Error, {
            context: "flash-sales-api-post"
        });
        return NextResponse.json(
            { error: "Lỗi khi tạo chiến dịch Flash Sale. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
