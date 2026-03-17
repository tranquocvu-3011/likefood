/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { logger } from "@/lib/logger";
// GET - Get single refund request detail
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const refund = await prisma.refundrequest.findFirst({
            where: {
                id: Number(id),
                userId: Number(session.user.id),
            },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        slug: true,
                                        name: true,
                                        image: true,
                                    }
                                },
                                variant: {
                                    select: {
                                        id: true,
                                        weight: true,
                                        flavor: true,
                                        sku: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!refund) {
            return NextResponse.json({ error: "Yêu cầu hoàn tiền không tồn tại" }, { status: 404 });
        }

        return NextResponse.json({ refund });
    } catch (error) {
        logger.error("Refund detail error", error as Error, { context: "user-refunds-id-api" });
        return NextResponse.json({ error: "Lỗi khi tải chi tiết hoàn tiền" }, { status: 500 });
    }
}

// DELETE - Cancel refund request (only if still PENDING)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const refund = await prisma.refundrequest.findFirst({
            where: {
                id: Number(id),
                userId: Number(session.user.id),
            },
        });

        if (!refund) {
            return NextResponse.json({ error: "Yêu cầu hoàn tiền không tồn tại" }, { status: 404 });
        }

        if (refund.status !== "PENDING") {
            return NextResponse.json({ error: "Chỉ có thể hủy yêu cầu đang chờ xử lý" }, { status: 400 });
        }

        // Update refund status
        await prisma.refundrequest.update({
            where: { id: Number(id) },
            data: { status: "CANCELLED" },
        });

        // Create order event
        await prisma.orderevent.create({
            data: {
                orderId: refund.orderId,
                status: "REFUND_CANCELLED",
                note: "Người dùng hủy yêu cầu hoàn tiền",
            },
        });

        return NextResponse.json({ message: "Đã hủy yêu cầu hoàn tiền" });
    } catch (error) {
        logger.error("Cancel refund error", error as Error, { context: "user-refunds-id-api" });
        return NextResponse.json({ error: "Lỗi khi hủy yêu cầu hoàn tiền" }, { status: 500 });
    }
}
