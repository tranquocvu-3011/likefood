/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createOrderNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import { ORDER_STATUS, normalizeOrderStatus } from "@/lib/commerce";

// POST cancel order (only pending/confirmed/processing)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui long dang nhap" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const reason = body.reason || "Khach hang huy don";

        const order = await prisma.order.findFirst({
            where: { id: Number(id), userId: Number(session.user.id) },
            include: {
                orderItems: {
                    include: {
                        variant: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Don hang khong ton tai" }, { status: 404 });
        }

        const normalizedStatus = normalizeOrderStatus(order.status);
        const cancellableStatuses: string[] = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING];
        if (!cancellableStatuses.includes(normalizedStatus)) {
            return NextResponse.json(
                { error: "Chi co the huy don hang dang cho xu ly hoac dang chuan bi" },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: Number(id) },
                data: { status: ORDER_STATUS.CANCELLED },
            });

            await tx.orderevent.create({
                data: {
                    orderId: Number(id),
                    status: ORDER_STATUS.CANCELLED,
                    note: reason,
                },
            });

            for (const item of order.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        inventory: { increment: item.quantity },
                        soldCount: { decrement: item.quantity },
                    },
                });

                if (item.variantId) {
                    await tx.productvariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: { increment: item.quantity },
                        },
                    });
                }
            }
        });

        try {
            await createOrderNotification(session.user.id, Number(id), ORDER_STATUS.CANCELLED, order.total);
        } catch (e) {
            logger.error("Failed to create cancel notification", e as Error, { context: "user-orders-id-cancel-api" });
        }

        return NextResponse.json({ message: "Don hang da duoc huy thanh cong" });
    } catch (error) {
        logger.error("Order cancel error", error as Error, { context: "user-orders-id-cancel-api" });
        return NextResponse.json({ error: "Loi khi huy don hang" }, { status: 500 });
    }
}
