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
// GET order timeline events
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

        const order = await prisma.order.findFirst({
            where: { id: Number(id), userId: Number(session.user.id) },
            select: {
                id: true,
                status: true,
                events: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
        }

        return NextResponse.json({
            orderId: order.id,
            currentStatus: order.status,
            events: order.events,
        });
    } catch (error) {
        logger.error("Order events fetch error", error as Error, { context: "user-orders-id-events-api" });
        return NextResponse.json({ error: "Lỗi khi tải lịch sử đơn hàng" }, { status: 500 });
    }
}
