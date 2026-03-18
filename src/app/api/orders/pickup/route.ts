/**
 * LIKEFOOD - Store Pickup Order API
 * Creates an order for in-store pickup (no Stripe payment required).
 * Customer pays at the store when picking up.
 * 
 * Flow: User selects "Store Pickup" → This API creates order directly
 *       → User goes to store to pick up and pay
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { POINTS_PER_DOLLAR, getStoreAddressFromDB } from "@/lib/commerce";

interface PickupItem {
    productId: string | number;
    variantId?: string | number | null;
    quantity: number;
}

export async function POST(req: NextRequest) {
    try {
        // Require authentication
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return NextResponse.json(
                { error: "Vui lòng đăng nhập để đặt hàng" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            items,
            fullName,
            email,
            phone,
            couponCode,
            pointsToUse = 0,
            notes,
        } = body as {
            items: PickupItem[];
            fullName: string;
            email: string;
            phone: string;
            couponCode?: string | null;
            pointsToUse?: number;
            notes?: string;
        };

        // Validate
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 400 });
        }
        if (!fullName || !phone) {
            return NextResponse.json({ error: "Vui lòng nhập đầy đủ họ tên và số điện thoại" }, { status: 400 });
        }

        const userId = authSession.user.id;

        // Verify user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, points: true, email: true, name: true },
        });
        if (!existingUser) {
            return NextResponse.json({ error: "Tài khoản không hợp lệ" }, { status: 400 });
        }

        // Fetch products
        const productIds = [...new Set(items.map((i) => Number(i.productId)))];
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true, name: true, price: true, salePrice: true,
                isOnSale: true, saleStartAt: true, saleEndAt: true,
                inventory: true, image: true, slug: true,
            },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        // Fetch active flash sale prices
        const now = new Date();
        const flashSalePrices = await prisma.flashsaleproduct.findMany({
            where: {
                productId: { in: productIds },
                campaign: {
                    isActive: true,
                    startAt: { lte: now },
                    endAt: { gte: now },
                },
            },
            select: { productId: true, flashSalePrice: true, stockLimit: true, soldCount: true },
        });
        const flashSalePriceMap = new Map(flashSalePrices.map((fp) => [fp.productId, fp]));

        // Fetch variants
        const variantIds = items
            .map((i) => (i.variantId ? Number(i.variantId) : null))
            .filter(Boolean) as number[];
        const variants = variantIds.length
            ? await prisma.productvariant.findMany({
                where: { id: { in: variantIds } },
                select: { id: true, productId: true, priceAdjustment: true, stock: true, weight: true, flavor: true },
            })
            : [];
        const variantMap = new Map(variants.map((v) => [v.id, v]));

        // Calculate prices & validate stock
        const lineItemsData: Array<{
            productId: number; variantId: number | null;
            quantity: number; unitPrice: number; name: string;
        }> = [];

        for (const item of items) {
            const product = productMap.get(Number(item.productId));
            if (!product) {
                return NextResponse.json(
                    { error: `Sản phẩm không tồn tại (ID: ${item.productId})` },
                    { status: 400 }
                );
            }

            const variant = item.variantId ? variantMap.get(Number(item.variantId)) : null;

            // Verify variant belongs to product
            if (variant && String(variant.productId) !== String(item.productId)) {
                return NextResponse.json(
                    { error: "Dữ liệu không hợp lệ: loại sản phẩm không khớp" },
                    { status: 400 }
                );
            }

            // Check inventory
            if (variant) {
                if (variant.stock < item.quantity) {
                    const variantName = [variant.weight, variant.flavor].filter(Boolean).join(" - ");
                    return NextResponse.json(
                        { error: `Sản phẩm "${product.name} - ${variantName}" chỉ còn ${variant.stock} trong kho` },
                        { status: 400 }
                    );
                }
            } else {
                if (product.inventory < item.quantity) {
                    return NextResponse.json(
                        { error: `Sản phẩm "${product.name}" chỉ còn ${product.inventory} trong kho` },
                        { status: 400 }
                    );
                }
            }

            // Calculate price
            let basePrice = product.price;
            const flashSale = flashSalePriceMap.get(Number(item.productId));
            if (flashSale) {
                if (!flashSale.stockLimit || flashSale.soldCount < flashSale.stockLimit) {
                    basePrice = flashSale.flashSalePrice;
                }
            } else {
                const isProductSaleActive = product.isOnSale && product.salePrice &&
                    product.saleStartAt && product.saleEndAt &&
                    product.saleStartAt <= now && product.saleEndAt >= now;
                if (isProductSaleActive) {
                    basePrice = product.salePrice!;
                }
            }

            const adjustment = variant?.priceAdjustment ?? 0;
            const unitPrice = basePrice + adjustment;
            const variantName = variant ? ` - ${[variant.weight, variant.flavor].filter(Boolean).join(" / ")}` : "";

            lineItemsData.push({
                productId: Number(item.productId),
                variantId: item.variantId ? Number(item.variantId) : null,
                quantity: item.quantity,
                unitPrice,
                name: `${product.name}${variantName}`,
            });
        }

        const subtotal = lineItemsData.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const shippingFee = 0; // Pickup is always free

        // Validate voucher
        let calculatedDiscount = 0;
        let validatedCouponCode: string | null = null;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
            if (coupon && coupon.isActive) {
                if (coupon.startDate <= now && coupon.endDate >= now) {
                    if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
                        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
                            const userVoucher = await prisma.uservoucher.findUnique({
                                where: { userId_couponId: { userId, couponId: coupon.id } },
                            });
                            if (userVoucher && userVoucher.status !== "USED") {
                                if (coupon.discountType === "PERCENTAGE") {
                                    calculatedDiscount = (subtotal * coupon.discountValue) / 100;
                                    if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
                                        calculatedDiscount = coupon.maxDiscount;
                                    }
                                } else {
                                    calculatedDiscount = coupon.discountValue;
                                }
                                validatedCouponCode = couponCode;
                            }
                        }
                    }
                }
            }
        }

        // Validate points
        let validatedPointsToUse = 0;
        let pointsDiscountAmount = 0;
        if (pointsToUse > 0) {
            if (existingUser.points >= pointsToUse) {
                pointsDiscountAmount = pointsToUse / 100; // 100 points = $1
                if (pointsDiscountAmount > subtotal - calculatedDiscount) {
                    pointsDiscountAmount = Math.max(0, subtotal - calculatedDiscount);
                }
                validatedPointsToUse = pointsToUse;
            }
        }

        const total = Math.max(0, subtotal + shippingFee - calculatedDiscount - pointsDiscountAmount);

        // Get dynamic store address from admin settings
        const storeInfo = await getStoreAddressFromDB();

        // Create order in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // 1. Decrement inventory
            for (const item of lineItemsData) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { inventory: true },
                });
                if (product) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            inventory: { decrement: Math.min(item.quantity, product.inventory) },
                            soldCount: { increment: item.quantity },
                        },
                    });
                }
                if (item.variantId) {
                    const variant = await tx.productvariant.findUnique({
                        where: { id: item.variantId },
                        select: { stock: true },
                    });
                    if (variant) {
                        await tx.productvariant.update({
                            where: { id: item.variantId },
                            data: { stock: { decrement: Math.min(item.quantity, variant.stock) } },
                        });
                    }
                }
            }

            // 2. Process voucher
            if (validatedCouponCode) {
                try {
                    const coupon = await tx.coupon.findUnique({ where: { code: validatedCouponCode } });
                    if (coupon) {
                        await tx.coupon.update({
                            where: { id: coupon.id },
                            data: { usedCount: { increment: 1 } },
                        });
                        const userVoucher = await tx.uservoucher.findFirst({
                            where: { userId, couponId: coupon.id, status: { not: "USED" } },
                        });
                        if (userVoucher) {
                            await tx.uservoucher.update({
                                where: { id: userVoucher.id },
                                data: { status: "USED", usedAt: new Date() },
                            });
                        }
                    }
                } catch (voucherErr) {
                    logger.error("[PICKUP] Voucher processing error", voucherErr as Error, { context: "pickup-order" });
                }
            }

            // 3. Process points deduction
            if (validatedPointsToUse > 0) {
                const updated = await tx.user.updateMany({
                    where: { id: userId, points: { gte: validatedPointsToUse } },
                    data: { points: { decrement: validatedPointsToUse } },
                });
                if (updated.count > 0) {
                    await tx.pointtransaction.create({
                        data: {
                            userId,
                            amount: -validatedPointsToUse,
                            type: "SPEND",
                            description: "Sử dụng cho đơn hàng tại cửa hàng",
                        },
                    });
                }
            }


            // 4. Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    status: "PENDING",
                    subtotal,
                    shippingFee: 0,
                    discount: calculatedDiscount,
                    pointsUsed: validatedPointsToUse > 0 ? validatedPointsToUse : null,
                    pointsDiscount: pointsDiscountAmount > 0 ? pointsDiscountAmount : null,
                    total,
                    couponCode: validatedCouponCode || null,
                    shippingAddress: storeInfo.address,
                    shippingCity: "",
                    shippingZipCode: "",
                    shippingPhone: phone,
                    shippingMethod: "pickup",
                    paymentMethod: "PICKUP",
                    paymentStatus: "PENDING",
                    notes: notes || `Store pickup order for ${fullName}`,
                    orderItems: {
                        create: lineItemsData.map((item) => ({
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: item.unitPrice,
                            nameSnapshot: item.name,
                        })),
                    },
                },
            });

            // 5. Record order event
            await tx.orderevent.create({
                data: {
                    orderId: newOrder.id,
                    status: "PENDING",
                    note: "Đơn hàng nhận tại cửa hàng đã được tạo — chờ khách đến nhận",
                },
            });

            // 6. Earn loyalty points ($1 = 2 points)
            const earnedPoints = Math.floor(subtotal * POINTS_PER_DOLLAR);
            if (earnedPoints > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { points: { increment: earnedPoints } },
                });
                await tx.pointtransaction.create({
                    data: {
                        userId,
                        orderId: newOrder.id,
                        amount: earnedPoints,
                        type: "EARN",
                        description: `Tích lũy từ đơn hàng tại cửa hàng #${String(newOrder.id).slice(-6).toUpperCase()} (${POINTS_PER_DOLLAR} điểm/$1)`,
                    },
                });
            }

            return newOrder;
        });

        logger.info(`[PICKUP] Order ${order.id} created for store pickup`, {
            userId: String(userId),
            total,
        });

        // Send notifications (non-blocking)
        try {
            const { createOrderNotification } = await import("@/lib/notifications");
            await createOrderNotification(userId, order.id, "PENDING", order.total);
        } catch (notifError) {
            logger.error("Failed to create order notification", notifError as Error, { orderId: order.id });
        }

        try {
            const { sendOrderNotification } = await import("@/lib/telegram");
            await sendOrderNotification({
                orderId: order.id,
                customerName: fullName,
                customerPhone: phone,
                shippingAddress: `📍 Store Pickup: ${storeInfo.address}`,
                paymentMethod: "PICKUP (Pay at store)",
                totalAmount: order.total,
                items: lineItemsData.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.unitPrice,
                })),
            });
        } catch (telegramError) {
            logger.error("Failed to send Telegram notification", telegramError as Error, { orderId: order.id });
        }

        return NextResponse.json({
            orderId: order.id,
            total: order.total,
            status: order.status,
            message: "Đơn hàng đã được tạo. Vui lòng đến cửa hàng để nhận hàng và thanh toán.",
        });
    } catch (error) {
        logger.error("[PICKUP] Order creation error", error as Error, { context: "pickup-order" });
        const message = error instanceof Error ? error.message : "Không tạo được đơn hàng";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
