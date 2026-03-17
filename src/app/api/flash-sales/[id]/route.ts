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

// GET /api/flash-sales/[id] - Lấy chi tiết campaign
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const campaign = await prisma.flashsalecampaign.findUnique({
            where: { id: Number(id) },
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
                                productImages: {
                                    orderBy: { order: "asc" },
                                    take: 1,
                                    select: { imageUrl: true }
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Không tìm thấy chiến dịch" }, { status: 404 });
        }

        return NextResponse.json(campaign);
    } catch (error) {
        logger.error("Get flash sale campaign error", error as Error, {
            context: "flash-sales-get-by-id",
        });
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}

// PATCH /api/flash-sales/[id] - Cập nhật campaign (admin)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Bạn không có quyền" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, startAt, endAt, isActive } = body;

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (name !== undefined) {
            const trimmed = String(name).trim();
            if (trimmed.length < 3) {
                return NextResponse.json({ error: "Tên phải có ít nhất 3 ký tự" }, { status: 400 });
            }
            updateData.name = trimmed.slice(0, 200);
        }

        if (startAt !== undefined) {
            const d = new Date(startAt);
            if (isNaN(d.getTime())) {
                return NextResponse.json({ error: "startAt không hợp lệ" }, { status: 400 });
            }
            updateData.startAt = d;
        }

        if (endAt !== undefined) {
            const d = new Date(endAt);
            if (isNaN(d.getTime())) {
                return NextResponse.json({ error: "endAt không hợp lệ" }, { status: 400 });
            }
            updateData.endAt = d;
        }

        if (isActive !== undefined && typeof isActive === "boolean") {
            updateData.isActive = isActive;
        }

        const campaign = await prisma.flashsalecampaign.update({
            where: { id: Number(id) },
            data: updateData,
        });

        return NextResponse.json(campaign);
    } catch (error) {
        logger.error("Update flash sale campaign error", error as Error, {
            context: "flash-sales-patch",
        });
        return NextResponse.json({ error: "Lỗi khi cập nhật chiến dịch" }, { status: 500 });
    }
}

// DELETE /api/flash-sales/[id] - Xóa campaign (admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Bạn không có quyền" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const campaign = await prisma.flashsalecampaign.findUnique({ where: { id: Number(id) } });
        if (!campaign) {
            return NextResponse.json({ error: "Không tìm thấy chiến dịch" }, { status: 404 });
        }

        // Cascade delete (flashsaleproducts will be deleted via DB cascade)
        await prisma.flashsalecampaign.delete({ where: { id: Number(id) } });

        logger.info("Flash sale campaign deleted", { campaignId: Number(id), adminId: Number(session.user.id) });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Delete flash sale campaign error", error as Error, {
            context: "flash-sales-delete",
        });
        return NextResponse.json({ error: "Lỗi khi xóa chiến dịch" }, { status: 500 });
    }
}
