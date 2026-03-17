/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/generated/client";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createOrderNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import {
    ORDER_STATUS,
    ORDER_STATUS_VALUES,
    normalizeOrderStatus,
} from "@/lib/commerce";
import { isValidOrderTransition } from "@/lib/order-state-machine";
import { onOrderCompleted, onOrderRefunded } from "@/lib/referral/events.service";
import { notifyOrderStatusChange } from "@/lib/telegram";
import { decryptForDisplay } from "@/lib/encryption";

type SessionUser = {
    role?: string;
    id?: number;
};

function buildVariantLabel(variant: { weight?: string | null; flavor?: string | null; sku?: string | null } | null | undefined) {
    if (!variant) return null;

    const parts = [variant.weight, variant.flavor].filter(Boolean);
    const name = parts.length > 0 ? parts.join(" / ") : variant.sku || null;

    return {
        ...variant,
        name,
    };
}

// PATCH /api/admin/orders/[id]/status - Update order status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as SessionUser)?.role;

        if (!session?.user || (role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const status = normalizeOrderStatus(body.status);
        const trackingCode = body.trackingCode?.trim() || null;
        const carrier = body.carrier?.trim() || null;
        const notes = body.notes?.trim() || "";

        if (!ORDER_STATUS_VALUES.includes(status)) {
            return NextResponse.json(
                { error: `Trang thai khong hop le. Chi chap nhan: ${ORDER_STATUS_VALUES.join(", ")}` },
                { status: 400 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
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

        const previousStatus = normalizeOrderStatus(order.status);

        // PAY-004: Validate state machine transition
        const transition = isValidOrderTransition(previousStatus, status);
        if (!transition.valid) {
            return NextResponse.json(
                { error: transition.reason || "Không thể chuyển trạng thái đơn hàng" },
                { status: 400 }
            );
        }

        const updateData: Record<string, string | Date | null> = {
            status,
            ...(status === ORDER_STATUS.SHIPPING && {
                shippedAt: order.shippedAt || new Date(),
            }),
            ...(status === ORDER_STATUS.DELIVERED && {
                deliveredAt: order.deliveredAt || new Date(),
            }),
            ...(status === ORDER_STATUS.COMPLETED && {
                deliveredAt: order.deliveredAt || new Date(),
            }),
        };

        if (trackingCode) updateData["trackingCode"] = trackingCode;
        if (carrier) updateData["carrier"] = carrier;
        if (notes) {
            updateData["notes"] = order.notes
                ? `${order.notes}\n[${new Date().toISOString()}] ${notes}`
                : `[${new Date().toISOString()}] ${notes}`;
        }

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: Number(id) },
                data: updateData as Prisma.orderUncheckedUpdateInput,
            });

            if (status === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
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
            }

            await tx.orderevent.create({
                data: {
                    orderId: Number(id),
                    status,
                    note: notes || `Status changed from ${previousStatus} to ${status}`,
                },
            });
        });

        const updatedOrder = await prisma.order.findUnique({
            where: { id: Number(id) },
        });

        try {
            await createOrderNotification(order.userId, order.id, status, order.total);
        } catch (e) {
            logger.error("Failed to send order notification", e as Error, { context: "order-status" });
        }

        // Referral system integration — trigger on order completion/cancellation
        try {
            if (status === ORDER_STATUS.COMPLETED && previousStatus !== ORDER_STATUS.COMPLETED) {
                await onOrderCompleted(Number(id));
            } else if (status === ORDER_STATUS.CANCELLED && previousStatus !== ORDER_STATUS.CANCELLED) {
                await onOrderRefunded(Number(id), `Order cancelled by admin`);
            }
        } catch (e) {
            logger.error("Referral event processing failed", e as Error, { context: "referral-event" });
        }

        // Gửi thông báo Telegram cập nhật trạng thái
        try {
            const customer = await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true, email: true } });
            notifyOrderStatusChange({
                orderId: Number(id),
                oldStatus: previousStatus,
                newStatus: status,
                customerName: customer?.name || undefined,
                customerEmail: customer?.email || undefined,
            }).catch(() => {});
        } catch {}

        return NextResponse.json({
            success: true,
            message: `Da cap nhat trang thai thanh ${status}`,
            order: updatedOrder
                ? {
                    ...updatedOrder,
                    status: normalizeOrderStatus(updatedOrder.status),
                }
                : null,
        });
    } catch (error) {
        logger.error("Update order status error", error as Error, { context: "order-status" });
        const message = error instanceof Error ? error.message : "Co loi xay ra";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET /api/admin/orders/[id]/status - Get order with full details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as SessionUser)?.role;

        if (!session?.user || (role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: { id: true, name: true, image: true, slug: true },
                        },
                        variant: {
                            select: { id: true, weight: true, flavor: true, sku: true },
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
            return NextResponse.json({ error: "Don hang khong ton tai" }, { status: 404 });
        }

        const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: { id: true, name: true, email: true, phone: true },
        });

        const orderItems = order.orderItems.map((item) => ({
            ...item,
            product: {
                ...item.product,
                slug: item.product.slug ?? item.product.id,
            },
            variant: buildVariantLabel(item.variant),
        }));

        return NextResponse.json({
            order: {
                ...order,
                shippingAddress: decryptForDisplay(order.shippingAddress),
                shippingPhone: decryptForDisplay(order.shippingPhone),
                status: normalizeOrderStatus(order.status),
                orderItems,
                items: orderItems,
                events: order.events.map((event) => ({
                    ...event,
                    status: normalizeOrderStatus(event.status),
                })),
            },
            user: user ? { ...user, phone: decryptForDisplay(user.phone) } : user,
        });
    } catch (error) {
        logger.error("Get order status detail error", error as Error, { context: "order-status-get" });
        const message = error instanceof Error ? error.message : "Co loi xay ra";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


