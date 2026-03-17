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
import type { Session } from "next-auth";

// PATCH /api/cart/items/[id] - Update item quantity
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let id: number | undefined;
    let session: Session | null = null;
    try {
        const { id: paramId } = await params;
        id = parseInt(paramId, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
        }
        session = await getServerSession(authOptions);
        const guestToken = request.cookies.get('guest_cart_token')?.value;
        const body = await request.json();

        // Validate request body
        const { updateCartItemSchema } = await import('@/lib/validations/cart');
        const { validationErrorResponse } = await import('@/lib/validations/utils');
        const validationResult = updateCartItemSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                validationErrorResponse(validationResult.error),
                { status: 400 }
            );
        }

        const { quantity } = validationResult.data;

        // Find cart item
        const cartItem = await prisma.cartitem.findUnique({
            where: { id },
            include: {
                cart: true,
                product: true,
                variant: true
            }
        });

        if (!cartItem) {
            return NextResponse.json(
                { error: "Sản phẩm không tồn tại trong giỏ hàng" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (session?.user?.id) {
            if (cartItem.cart.userId !== session.user.id) {
                return NextResponse.json(
                    { error: "Không có quyền truy cập" },
                    { status: 403 }
                );
            }
        } else if (guestToken) {
            if (cartItem.cart.guestToken !== guestToken) {
                return NextResponse.json(
                    { error: "Không có quyền truy cập" },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Không có quyền truy cập" },
                { status: 403 }
            );
        }

        // Check stock
        const availableStock = cartItem.variant
            ? cartItem.variant.stock
            : cartItem.product.inventory;

        if (quantity > availableStock) {
            return NextResponse.json(
                { error: `Chỉ còn ${availableStock} sản phẩm trong kho` },
                { status: 400 }
            );
        }

        // Update quantity
        const updated = await prisma.cartitem.update({
            where: { id },
            data: { quantity }
        });

        return NextResponse.json({
            success: true,
            message: "Đã cập nhật số lượng",
            item: updated
        });

    } catch (error) {
        logger.error("Update cart item error", error as Error, { context: "cart-item-patch", itemId: id ? String(id) : undefined, userId: session?.user?.id ? String(session.user.id) : undefined });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi cập nhật số lượng" },
            { status: 500 }
        );
    }
}

// DELETE /api/cart/items/[id] - Remove item from cart
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let id: number | undefined;
    let session: Session | null = null;
    try {
        const { id: paramId } = await params;
        id = parseInt(paramId, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
        }
        session = await getServerSession(authOptions);
        const guestToken = request.cookies.get('guest_cart_token')?.value;

        // Find cart item
        const cartItem = await prisma.cartitem.findUnique({
            where: { id },
            include: { cart: true }
        });

        if (!cartItem) {
            return NextResponse.json(
                { error: "Sản phẩm không tồn tại trong giỏ hàng" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (session?.user?.id) {
            if (cartItem.cart.userId !== session.user.id) {
                return NextResponse.json(
                    { error: "Không có quyền truy cập" },
                    { status: 403 }
                );
            }
        } else if (guestToken) {
            if (cartItem.cart.guestToken !== guestToken) {
                return NextResponse.json(
                    { error: "Không có quyền truy cập" },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Không có quyền truy cập" },
                { status: 403 }
            );
        }

        // Delete item
        await prisma.cartitem.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: "Đã xóa sản phẩm khỏi giỏ hàng"
        });

    } catch (error) {
        logger.error("Delete cart item error", error as Error, { context: "cart-item-delete", itemId: id ? String(id) : undefined, userId: session?.user?.id ? String(session.user.id) : undefined });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi xóa sản phẩm" },
            { status: 500 }
        );
    }
}
