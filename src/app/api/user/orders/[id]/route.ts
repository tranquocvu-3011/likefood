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
import { normalizeOrderStatus } from "@/lib/commerce";
import prisma from "@/lib/prisma";
import { decryptForDisplay } from "@/lib/encryption";

function buildVariantLabel(variant: { weight?: string | null; flavor?: string | null; sku?: string | null } | null | undefined) {
    if (!variant) return null;

    const parts = [variant.weight, variant.flavor].filter(Boolean);
    const name = parts.length > 0 ? parts.join(" / ") : variant.sku || null;

    return {
        ...variant,
        name,
    };
}

// GET single order detail
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const order = await prisma.order.findFirst({
            where: {
                id: Number(id),
                userId: session.user.id,
            },
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
                        variant: {
                            select: {
                                id: true,
                                weight: true,
                                flavor: true,
                                sku: true,
                            },
                        },
                    },
                },
                events: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const orderItems = order.orderItems.map((item) => ({
            ...item,
            product: {
                ...item.product,
                slug: item.product.slug ?? item.product.id,
            },
            variant: buildVariantLabel(item.variant),
        }));

        return NextResponse.json({
            ...order,
            status: normalizeOrderStatus(order.status),
            shippingAddress: decryptForDisplay(order.shippingAddress),
            shippingPhone: decryptForDisplay(order.shippingPhone),
            orderItems,
            items: orderItems,
            events: order.events.map((event) => ({
                ...event,
                status: normalizeOrderStatus(event.status),
            })),
        });
    } catch (error) {
        logger.error("Order fetch error", error as Error, { context: "user-orders-id-api" });
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}
