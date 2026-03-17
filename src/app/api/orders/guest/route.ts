/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { createOrderNotification } from "@/lib/notifications";
import { getShippingFeeUsd, normalizeOrderStatus } from "@/lib/commerce";
import { applyRateLimit, checkoutRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { encrypt } from "@/lib/encryption";

// POST /api/orders/guest - Create order for guest users (no login required)
export async function POST(req: NextRequest) {
    // No session required for guest checkout
    const rl = await applyRateLimit(getRateLimitIdentifier(req), checkoutRateLimit, { windowMs: 60 * 60 * 1000, maxRequests: 10 });
    if (!rl.success) return rl.error as unknown as NextResponse;

    let productIdForLog: string | undefined;

    try {
        const rawBody = await req.json();

        // Validate body
        const { guestOrderSchema } = await import("@/lib/validations/order");
        const { validationErrorResponse } = await import("@/lib/validations/utils");

        const parsed = guestOrderSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                validationErrorResponse(parsed.error),
                { status: 400 }
            );
        }

        const {
            items,
            guestEmail,
            guestName,
            shippingAddress,
            shippingCity,
            shippingZipCode,
            shippingPhone,
            shippingMethod = "standard",
            paymentMethod,
            notes,
        } = parsed.data;

        // Validate guest email
        if (!guestEmail || !guestEmail.includes("@")) {
            return NextResponse.json(
                { error: "Vui lòng nhập email hợp lệ" },
                { status: 400 }
            );
        }

        // Create or find guest user by email (or create a temporary guest user)
        const user = await prisma.user.findUnique({
            where: { email: guestEmail }
        });

        let userId: number;

        if (user) {
            // Existing user - use their account
            userId = user.id;
        } else {
            // Create temporary guest user
            const guestUser = await prisma.user.create({
                data: {
                    email: guestEmail,
                    name: guestName || "Guest Customer",
                    // Generate a random password - guest won't be able to login without magic link
                    password: null,
                    role: "USER",
                }
            });
            userId = guestUser.id;
        }

        // Calculate totals and process order
        const order = await prisma.$transaction(async (tx) => {
            // 1. Fetch all products and variants
            const productIds = [...new Set(items.map((i) => Number(i.productId)))];
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    salePrice: true,
                    isOnSale: true,
                    saleStartAt: true,
                    saleEndAt: true,
                    inventory: true,
                },
            });
            const productMap = new Map(products.map(p => [p.id, p]));

            const variantIds = items
                .map((i) => i.variantId ? Number(i.variantId) : null)
                .filter(Boolean) as number[];
            const variants = variantIds.length
                ? await tx.productvariant.findMany({
                    where: { id: { in: variantIds } },
                    select: {
                        id: true,
                        productId: true,
                        priceAdjustment: true,
                        stock: true,
                        sku: true,
                        weight: true,
                        flavor: true,
                    },
                })
                : [];
            const variantMap = new Map(variants.map(v => [v.id, v]));

            // 2. Process items
            const itemsWithPrice = await Promise.all(
                items.map(async (item) => {
                    const product = productMap.get(Number(item.productId));
                    if (!product) {
                        throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
                    }
                    productIdForLog = item.productId;

                    const variant = item.variantId ? variantMap.get(Number(item.variantId)) : null;

                    // Calculate price
                    const now = new Date();
                    const isFlashSaleActive = product.isOnSale && product.salePrice &&
                        product.saleStartAt && product.saleEndAt &&
                        product.saleStartAt <= now && product.saleEndAt >= now;

                    const basePrice = isFlashSaleActive ? product.salePrice! : product.price;
                    const adjustment = variant?.priceAdjustment ?? 0;
                    const unitPrice = basePrice + adjustment;

                    // Check inventory
                    if (variant) {
                        if (variant.stock < item.quantity) {
                            const variantName = [variant.weight, variant.flavor].filter(Boolean).join(" - ");
                            throw new Error(`Chỉ còn ${variant.stock} sản phẩm cho loại ${variantName}`);
                        }
                    } else {
                        if (product.inventory < item.quantity) {
                            throw new Error(`Chỉ còn ${product.inventory} sản phẩm cho ${product.name}`);
                        }
                    }

                    const variantName = variant ? ` - ${[variant.weight, variant.flavor].filter(Boolean).join(" / ")}` : "";
                    const nameSnapshot = `${product.name}${variantName}`;
                    const skuSnapshot = variant?.sku || null;

                    return {
                        productId: Number(item.productId),
                        variantId: item.variantId ? Number(item.variantId) : null,
                        quantity: item.quantity,
                        price: unitPrice,
                        nameSnapshot,
                        skuSnapshot,
                    };
                })
            );

            const subtotal = itemsWithPrice.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
            );

            // 3. Calculate shipping
            const calculatedShippingFee = getShippingFeeUsd(subtotal, shippingMethod);

            // 4. Calculate discount (no voucher for guests by default)
            const calculatedDiscount = 0;
            
            // 5. Calculate total
            const total = Math.max(0, subtotal + calculatedShippingFee - calculatedDiscount);

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    status: "PENDING",
                    subtotal,
                    shippingFee: calculatedShippingFee,
                    discount: calculatedDiscount,
                    total,
                    couponCode: null,
                    shippingAddress: encrypt(shippingAddress) || shippingAddress,
                    shippingCity,
                    shippingZipCode,
                    shippingPhone: encrypt(shippingPhone) || shippingPhone,
                    shippingMethod,
                    paymentMethod: paymentMethod || "STRIPE",
                    paymentStatus: "UNPAID",
                    notes: notes || null,
                    orderItems: {
                        create: itemsWithPrice.map((item) => ({
                            productId: Number(item.productId),
                            variantId: item.variantId ? Number(item.variantId) : null,
                            quantity: item.quantity,
                            price: item.price,
                            nameSnapshot: item.nameSnapshot,
                            skuSnapshot: item.skuSnapshot,
                        })),
                    },
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // Create order event
            await tx.orderevent.create({
                data: {
                    orderId: newOrder.id,
                    status: newOrder.status,
                    note: "Guest order created",
                },
            });

            // Update inventory
            for (const item of itemsWithPrice) {
                if (item.variantId) {
                    await tx.productvariant.update({
                        where: { id: item.variantId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        inventory: { decrement: item.quantity },
                        soldCount: { increment: item.quantity },
                    }
                });
            }

            return newOrder;
        });

        // Send confirmation email
        try {
            await sendOrderConfirmationEmail({
                orderId: order.id,
                toEmail: guestEmail,
                total: order.total,
                status: normalizeOrderStatus(order.status),
                createdAt: order.createdAt
            });
        } catch (emailError) {
            logger.warn("Failed to send guest order confirmation email", {
                context: "guest-checkout",
                orderId: order.id,
                email: guestEmail,
                error: emailError
            });
        }

        // Create notification for user
        try {
            await createOrderNotification(order.userId, order.id, order.status, order.total);
        } catch (notifError) {
            logger.warn("Failed to create order notification", {
                context: "guest-checkout",
                orderId: order.id,
                error: notifError
            });
        }

        // Send Telegram notification for new order
        try {
            const { sendOrderNotification } = await import("@/lib/telegram");
            const orderItems = order.orderItems.map((item) => ({
                name: item.nameSnapshot || item.product?.name || "Unknown Product",
                quantity: item.quantity,
                price: item.price,
            }));

            await sendOrderNotification({
                orderId: order.id,
                customerName: guestName || "Guest Customer",
                customerPhone: shippingPhone || "N/A",
                shippingAddress: `${shippingAddress}, ${shippingCity} ${shippingZipCode}`,
                paymentMethod: paymentMethod || "STRIPE",
                totalAmount: order.total,
                items: orderItems,
            });
        } catch (telegramError) {
            logger.warn("Failed to send Telegram notification", {
                context: "guest-checkout",
                orderId: order.id,
                error: telegramError
            });
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            message: "Đơn hàng đã được tạo thành công",
            order: {
                id: order.id,
                total: order.total,
                status: normalizeOrderStatus(order.status),
            }
        });

    } catch (error) {
        logger.error("Guest order creation error", error as Error, {
            context: "guest-checkout",
            productId: productIdForLog
        });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo đơn hàng" },
            { status: 500 }
        );
    }
}
