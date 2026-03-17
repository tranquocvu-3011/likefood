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
import { createOrderNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { normalizeOrderStatus } from "@/lib/commerce";
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

// GET order detail (admin)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                slug: true,
                                name: true,
                                image: true,
                                price: true,
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
                user: {
                    select: { id: true, email: true, name: true, phone: true },
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
            shippingAddress: decryptForDisplay(order.shippingAddress),
            shippingPhone: decryptForDisplay(order.shippingPhone),
            status: normalizeOrderStatus(order.status),
            orderItems,
            items: orderItems,
            user: order.user ? { ...order.user, phone: decryptForDisplay(order.user.phone) } : order.user,
            events: order.events.map((event) => ({
                ...event,
                status: normalizeOrderStatus(event.status),
            })),
        });
    } catch (error) {
        logger.error("Order fetch error", error as Error, { context: "admin-orders-api-get", orderId: Number(id) });
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

// PUT update order (admin)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { status, notes } = await req.json();
        const normalizedStatus = status ? normalizeOrderStatus(status) : undefined;

        const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"];
        if (normalizedStatus && !validStatuses.includes(normalizedStatus)) {
            return NextResponse.json({ error: `Trang thai khong hop le: ${status}` }, { status: 400 });
        }

        const updateData: Prisma.orderUpdateInput = {};
        if (normalizedStatus) updateData.status = normalizedStatus;
        if (notes !== undefined) updateData.notes = notes;

        const previous = await prisma.order.findUnique({
            where: { id: Number(id) },
            select: { status: true, userId: true, total: true },
        });

        const order = await prisma.order.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                slug: true,
                                name: true,
                                image: true,
                                price: true,
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
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });

        if (normalizedStatus && previous && normalizedStatus !== normalizeOrderStatus(previous.status)) {
            await prisma.orderevent.create({
                data: {
                    orderId: order.id,
                    status: normalizedStatus,
                    note: notes || `Status changed from ${previous.status} to ${normalizedStatus}`,
                },
            });

            try {
                await createOrderNotification(previous.userId, order.id, normalizedStatus, previous.total);
            } catch (err) {
                logger.error("Failed to create order status notification", err as Error, {
                    context: "admin-orders-api-put",
                    orderId: Number(id),
                });
            }
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
            items: orderItems,
            orderItems,
        });
    } catch (error) {
        logger.error("Order update error", error as Error, { context: "admin-orders-api-put", orderId: Number(id) });
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
