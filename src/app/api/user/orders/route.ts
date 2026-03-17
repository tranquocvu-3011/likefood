/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/generated/client";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { getOrderStatusFilter, normalizeOrderStatus } from "@/lib/commerce";
import { decryptForDisplay } from "@/lib/encryption";

// GET user's orders
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        let page = parseInt(searchParams.get("page") || "1", 10);
        let limit = parseInt(searchParams.get("limit") || "10", 10);

        if (Number.isNaN(page) || page < 1) page = 1;
        if (Number.isNaN(limit) || limit < 1 || limit > 100) limit = 10;

        const skip = (page - 1) * limit;
        const where: Prisma.orderWhereInput = {
            userId: Number(session.user.id),
        };

        if (status && status !== "all") {
            const allowedStatuses = getOrderStatusFilter(status);
            where.status = allowedStatuses.length === 1 ? allowedStatuses[0] : { in: allowedStatuses };
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    slug: true,
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        const serializedOrders = orders.map((order) => {
            const orderItems = order.orderItems.map((item) => ({
                ...item,
                product: item.product
                    ? {
                        ...item.product,
                        slug: item.product.slug ?? item.product.id,
                    }
                    : null,
            }));

            return {
                ...order,
                status: normalizeOrderStatus(order.status),
                shippingAddress: decryptForDisplay(order.shippingAddress),
                shippingPhone: decryptForDisplay(order.shippingPhone),
                orderItems,
                items: orderItems,
            };
        });
        const totalPages = Math.max(1, Math.ceil(total / limit));

        return NextResponse.json({
            orders: serializedOrders,
            total,
            totalPages,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    } catch (error) {
        logger.error("Orders fetch error", error as Error, {
            context: "user-orders-api",
            userId: String(Number(session?.user?.id)),
        });
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
