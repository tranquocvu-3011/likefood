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
import prisma from "@/lib/prisma";

// POST reorder - copy items from old order to cart
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

        const order = await prisma.order.findFirst({
            where: { id: Number(id), userId: Number(session.user.id) },
            include: {
                orderItems: {
                    include: {
                        product: { select: { id: true, inventory: true, price: true } },
                        variant: { select: { id: true, stock: true } },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Don hang khong ton tai" }, { status: 404 });
        }

        let cart = await prisma.cart.findFirst({
            where: { userId: Number(session.user.id) },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: Number(session.user.id) },
            });
        }

        const addedItems: string[] = [];
        const skippedItems: string[] = [];

        for (const item of order.orderItems) {
            const availableStock = item.variant ? item.variant.stock : item.product?.inventory || 0;

            if (!item.product || availableStock <= 0) {
                skippedItems.push(item.nameSnapshot || String(item.productId));
                continue;
            }

            const existing = await prisma.cartitem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: item.productId,
                    variantId: item.variantId || null,
                },
            });

            const desiredQuantity = existing ? existing.quantity + item.quantity : item.quantity;
            const quantity = Math.min(desiredQuantity, availableStock);

            if (quantity <= 0) {
                skippedItems.push(item.nameSnapshot || String(item.productId));
                continue;
            }

            if (existing) {
                await prisma.cartitem.update({
                    where: { id: existing.id },
                    data: { quantity },
                });
            } else {
                await prisma.cartitem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.productId,
                        variantId: item.variantId || null,
                        quantity,
                    },
                });
            }

            addedItems.push(item.nameSnapshot || String(item.productId));
        }

        return NextResponse.json({
            message: `Da them ${addedItems.length} san pham vao gio hang`,
            added: addedItems.length,
            skipped: skippedItems.length,
            skippedItems,
        });
    } catch (error) {
        logger.error("Reorder error", error as Error, { context: "user-orders-id-reorder-api" });
        return NextResponse.json({ error: "Loi khi mua lai" }, { status: 500 });
    }
}
