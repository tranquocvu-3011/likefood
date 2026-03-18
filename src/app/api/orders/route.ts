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
import { createOrderNotification } from "@/lib/notifications";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { checkoutRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { Prisma } from "@/generated/client";
import { getOrderStatusFilter, getShippingFeeUsd, normalizeOrderStatus } from "@/lib/commerce";
import { encrypt } from "@/lib/encryption";

const roundUsd = (amount: number) => Math.round(amount * 100) / 100;

interface FormattedOrder {
    id: number;
    userId: number;
    total: number;
    subtotal: number | null;
    shippingFee: number;
    discount: number;
    status: string;
    paymentStatus: string | null;
    paymentMethod: string | null;
    shippingMethod: string | null;
    createdAt: Date;
    itemCount: number;
    userEmail: string;
    userName: string | null;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search") || "";
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const sortBy = searchParams.get("sort") || "newest";
        let page = parseInt(searchParams.get("page") || "1");
        let limit = parseInt(searchParams.get("limit") || "20");
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const skip = (page - 1) * limit;

        const where: Prisma.orderWhereInput = {};

        if (status && status !== "ALL") {
            const allowedStatuses = getOrderStatusFilter(status);
            where.status = allowedStatuses.length === 1 ? allowedStatuses[0] : { in: allowedStatuses };
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                const dFrom = new Date(dateFrom);
                if (!isNaN(dFrom.getTime())) where.createdAt.gte = dFrom;
            }
            if (dateTo) {
                const dTo = new Date(dateTo + "T23:59:59");
                if (!isNaN(dTo.getTime())) where.createdAt.lte = dTo;
            }
        }

        if (search) {
            const searchId = parseInt(search);
            if (!isNaN(searchId)) {
                where.OR = [
                    { id: searchId },
                ];
            }
        }

        let orderBy: Prisma.orderOrderByWithRelationInput = { createdAt: "desc" };
        if (sortBy === "total-desc") orderBy = { total: "desc" };
        if (sortBy === "total-asc") orderBy = { total: "asc" };
        if (sortBy === "oldest") orderBy = { createdAt: "asc" };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: { select: { email: true, name: true } },
                    orderItems: {
                        include: { product: { select: { id: true, name: true, image: true } } },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        const formattedOrders: FormattedOrder[] = orders.map(order => ({
            id: order.id,
            userId: order.userId,
            total: order.total,
            subtotal: order.subtotal,
            shippingFee: order.shippingFee,
            discount: order.discount,
            status: normalizeOrderStatus(order.status),
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            shippingMethod: order.shippingMethod,
            createdAt: order.createdAt,
            itemCount: order.orderItems?.length || 0,
            userEmail: order.user?.email || "N/A",
            userName: order.user?.name || "N/A",
        }));

        const totalPages = Math.max(1, Math.ceil(total / limit));

        return NextResponse.json({
            orders: formattedOrders,
            total,
            totalPages,
            pagination: { page, limit, total, totalPages },
        });
    } catch (error) {
        logger.error("Orders fetch error", error as Error, { context: "orders-api-get" });
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

// POST create new order
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting vá»›i Upstash Redis (fallback cho dev náº¿u chÆ°a cáº¥u hÃ¬nh)
    const identifier = getRateLimitIdentifier(req, String(session.user.id));
    const rateResult = await applyRateLimit(identifier, checkoutRateLimit);
    if (!rateResult.success && rateResult.error) {
        logger.warn("Rate limit exceeded for order creation", {
            userId: String(Number(session.user.id)),
            identifier,
        });
        return rateResult.error;
    }

    try {
        const rawBody = await req.json();

        // Validate body vá»›i Zod schema Ä‘á»ƒ chá»‘ng dá»¯ liá»‡u sai format
        const [{ createOrderRequestSchema }, { validationErrorResponse }] = await Promise.all([
            import("@/lib/validations/order"),
            import("@/lib/validations/utils"),
        ]);

        const parsed = createOrderRequestSchema.safeParse(rawBody);
        if (!parsed.success) {
            logger.warn("Order validation failed", {
                context: "orders-api",
                zodErrors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message, code: i.code })),
            });
            return NextResponse.json(
                validationErrorResponse(parsed.error),
                { status: 400 }
            );
        }

        const {
            items,
            shippingAddress,
            shippingCity,
            shippingZipCode,
            shippingPhone,
            shippingMethod = "standard",
            paymentMethod,
            couponCode,
            notes,
            idempotencyKey,
            pointsToUse = 0,
        } = parsed.data;

        // Check idempotency key if provided
        if (idempotencyKey) {
            const existingOrder = await prisma.order.findFirst({
                where: {
                    userId: Number(session.user.id),
                    notes: {
                        contains: `[IDEMPOTENCY:${idempotencyKey}]`,
                    },
                },
            });

            if (existingOrder) {
                logger.info("Duplicate order prevented by idempotency key", {
                    userId: String(Number(session.user.id)),
                    idempotencyKey,
                    orderId: existingOrder.id,
                });
                return NextResponse.json({
                    order: existingOrder,
                    message: "Order already exists",
                });
            }
        }

        // Verify user exists in database (prevent FK constraint violation)
        let userId = session.user.id;
        const existingUserById = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existingUserById) {
            // Session ID not in DB — look up by email (handles OAuth ID mismatch)
            if (session.user.email) {
                const existingUserByEmail = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true },
                });
                if (existingUserByEmail) {
                    userId = existingUserByEmail.id;
                    logger.info("Remapped userId via email", { sessionId: Number(session.user.id), dbUserId: userId });
                } else {
                    try {
                        const newUser = await prisma.user.create({
                            data: { id: userId, email: session.user.email, name: session.user.name || "LIKEFOOD User" },
                        });
                        userId = newUser.id;
                        logger.info("Auto-created user for order", { userId: String(userId) });
                    } catch (createErr) {
                        logger.error("Failed to create user", createErr as Error, { userId: String(userId) });
                        return NextResponse.json({ error: "Không thể tạo tài khoản. Vui lòng đăng nhập lại." }, { status: 400 });
                    }
                }
            } else {
                return NextResponse.json({ error: "Tài khoản không hợp lệ. Vui lòng đăng nhập lại." }, { status: 400 });
            }
        }

        // Recalculate giÃ¡ tá»« DB Ä‘á»ƒ trÃ¡nh client tá»± chá»‰nh giÃ¡
        const order = await prisma.$transaction(async (tx) => {
            // 1. Fetch all products and variants in bulk with ALL required fields
            const productIds = [...new Set(items.map((i: any) => Number(i.productId)))];
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
                .map((i: any) => i.variantId ? Number(i.variantId) : null)
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

            // Pre-aggregate quantities by productId for flash sale limit check
            const productQuantitiesInOrder = new Map<string, number>();
            for (const item of items) {
                productQuantitiesInOrder.set(
                    item.productId,
                    (productQuantitiesInOrder.get(item.productId) || 0) + item.quantity
                );
            }

            // 2. Process items (Calculate price, check inventory, check flash sale limits)
            // OPTIMIZATION: Pre-fetch all flash sale orders in ONE query to avoid N+1
            const flashSaleProducts = products.filter(p => 
                p.isOnSale && p.salePrice && p.saleStartAt && p.saleEndAt
            );
            
            const flashSaleOrderQuantities: Map<string, number> = new Map();
            if (flashSaleProducts.length > 0) {
                // Single bulk query: get all flash sale orders for all products in this order
                const flashSaleProductIds = flashSaleProducts.map(p => p.id);
                const earliestSaleStart = new Date(Math.min(...flashSaleProducts.map(p => p.saleStartAt!.getTime())));
                
                const userFlashOrders = await tx.order.findMany({
                    where: {
                        userId: userId,
                        createdAt: { gte: earliestSaleStart },
                        orderItems: { some: { productId: { in: flashSaleProductIds } } },
                    },
                    include: { orderItems: true },
                });

                // Pre-calculate total quantity per product
                for (const order of userFlashOrders) {
                    for (const oi of order.orderItems) {
                        const current = flashSaleOrderQuantities.get(String(oi.productId)) || 0;
                        flashSaleOrderQuantities.set(String(oi.productId), current + oi.quantity);
                    }
                }
            }

            const itemsWithPrice = await Promise.all(
                items.map(async (item) => {
                    const product = productMap.get(Number(item.productId));
                    if (!product) {
                        throw new Error(`Sáº£n pháº©m ${item.productId} khÃ´ng tá»“n táº¡i`);
                    }

                    const variant = item.variantId
                        ? variantMap.get(Number(item.variantId))
                        : null;

                    // Verify variant belongs to product
                    if (variant && String(variant.productId) !== String(item.productId)) {
                        throw new Error(`Dá»¯ liá»‡u khÃ´ng há»£p lá»‡: Loáº¡i sáº£n pháº©m khÃ´ng khá»›p vá»›i sáº£n pháº©m chÃ­nh`);
                    }

                    // Calculate price (considering Flash Sale)
                    const now = new Date();
                    const isFlashSaleActive = product.isOnSale && product.salePrice &&
                        product.saleStartAt && product.saleEndAt &&
                        product.saleStartAt <= now && product.saleEndAt >= now;

                    const basePrice = isFlashSaleActive ? product.salePrice! : product.price;
                    const adjustment = variant?.priceAdjustment ?? 0;
                    const unitPrice = basePrice + adjustment;

                    // Check Inventory (Using data already in memory from bulk fetch - NO N+1)
                    if (variant) {
                        if (variant.stock < item.quantity) {
                            const variantName = [variant.weight, variant.flavor].filter(Boolean).join(" - ");
                            throw new Error(`Chá»‰ cÃ²n ${variant.stock} sáº£n pháº©m cho loáº¡i ${variantName}`);
                        }
                    } else {
                        if (product.inventory < item.quantity) {
                            throw new Error(`Chá»‰ cÃ²n ${product.inventory} sáº£n pháº©m cho ${product.name}`);
                        }
                    }

                    // Inventory check already done at line 236
                    // We will decrement at the end of transaction (line 363) to include soldCount update

                    // Check flash sale perUserLimit if product is on flash sale
                    // Default limit: 5 items per user per flash sale event
                    // OPTIMIZATION: Use pre-fetched flash sale data instead of N+1 query
                    if (isFlashSaleActive) {
                        const FLASH_SALE_PER_USER_LIMIT = 5;
                        
                        // Use pre-fetched data from flashSaleOrderQuantities Map
                        const totalFlashQuantity = flashSaleOrderQuantities.get(String(item.productId)) || 0;
                        const currentOrderQuantity = productQuantitiesInOrder.get(item.productId) || 0;
                        
                        if (totalFlashQuantity + currentOrderQuantity > FLASH_SALE_PER_USER_LIMIT) {
                            throw new Error(`Giá»›i háº¡n Flash Sale: Báº¡n chá»‰ cÃ³ thá»ƒ mua tá»‘i Ä‘a ${FLASH_SALE_PER_USER_LIMIT} sáº£n pháº©m ${product.name} (hiá»‡n táº¡i báº¡n Ä‘ang chá» n ${currentOrderQuantity} vÃ £ Ä‘Ã£ mua ${totalFlashQuantity} trong Ä‘á»£t nÃ y).`);
                        }
                    }
                    if (isFlashSaleActive) {
                        const FLASH_SALE_PER_USER_LIMIT = 5;
                        const userFlashOrders = await tx.order.findMany({
                            where: {
                                userId: userId,
                                createdAt: { gte: product.saleStartAt! },
                                orderItems: { some: { productId: Number(item.productId) } },
                            },
                            include: { orderItems: { where: { productId: Number(item.productId) } } },
                        });

                        const totalFlashQuantity = userFlashOrders.reduce(
                            (sum, order) => sum + (order.orderItems?.reduce((itemSum, oi) => itemSum + oi.quantity, 0) || 0),
                            0
                        );

                        const currentOrderQuantity = productQuantitiesInOrder.get(item.productId) || 0;
                        if (totalFlashQuantity + currentOrderQuantity > FLASH_SALE_PER_USER_LIMIT) {
                            throw new Error(`Giá»›i háº¡n Flash Sale: Báº¡n chá»‰ cÃ³ thá»ƒ mua tá»‘i Ä‘a ${FLASH_SALE_PER_USER_LIMIT} sáº£n pháº©m ${product.name} (hiá»‡n táº¡i báº¡n Ä‘ang chá»n ${currentOrderQuantity} vÃ  Ä‘Ã£ mua ${totalFlashQuantity} trong Ä‘á»£t nÃ y).`);
                        }
                    }

                    // Snapshot name and sku from DB records (prevent forging)
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

            // 1. Recalculate shipping fee on the server
            const calculatedShippingFee = getShippingFeeUsd(subtotal, shippingMethod);

            // 2. RE-CALCULATE DISCOUNT (Server-side Voucher Verification)
            let calculatedDiscount = 0;
            if (couponCode) {
                const coupon = await tx.coupon.findUnique({
                    where: { code: couponCode },
                });

                if (!coupon || !coupon.isActive) {
                    throw new Error("MÃ£ giáº£m giÃ¡ khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n");
                }

                const now = new Date();
                if (coupon.startDate > now || coupon.endDate < now) {
                    throw new Error("MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t háº¡n sá»­ dá»¥ng");
                }

                if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
                    throw new Error(`MÃ£ nÃ y yÃªu cáº§u Ä‘Æ¡n hÃ ng tá»« $${coupon.minOrderValue}`);
                }

                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    throw new Error("MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t lÆ°á»£t sá»­ dá»¥ng");
                }

                // Check if user has claimed this voucher
                const userVoucher = await tx.uservoucher.findUnique({
                    where: { userId_couponId: { userId: userId, couponId: coupon.id } }
                });

                if (!userVoucher) {
                    throw new Error("Báº¡n chÆ°a lÆ°u mÃ£ giáº£m giÃ¡ nÃ y");
                }

                if (userVoucher.status === "USED") {
                    throw new Error("Báº¡n Ä‘Ã£ sá»­ dá»¥ng mÃ£ giáº£m giÃ¡ nÃ y rá»“i");
                }

                // Calculate discount amount (round to avoid floating-point precision)
                if (coupon.discountType === "PERCENTAGE") {
                    calculatedDiscount = roundUsd((subtotal * coupon.discountValue) / 100);
                    if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
                        calculatedDiscount = roundUsd(coupon.maxDiscount);
                    }
                } else {
                    calculatedDiscount = roundUsd(coupon.discountValue);
                }

                // Update coupon used count and user voucher status
                await Promise.all([
                    tx.coupon.update({
                        where: { id: coupon.id },
                        data: { usedCount: { increment: 1 } },
                    }),
                    tx.uservoucher.update({
                        where: { id: userVoucher.id },
                        data: { status: "USED", usedAt: new Date() }
                    })
                ]);
            }

            // 3. Handle Points Redemption (Phase 2)
            let pointsDiscountAmount = 0;
            if (pointsToUse > 0) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { points: true }
                });

                if (!user || user.points < pointsToUse) {
                    throw new Error("Sá»‘ dÆ° LIKEFOOD Xu khÃ´ng Ä‘á»§");
                }

                // 100 points = $1
                pointsDiscountAmount = pointsToUse / 100;

                // Cap points discount to subtotal
                if (pointsDiscountAmount > subtotal - calculatedDiscount) {
                    pointsDiscountAmount = Math.max(0, subtotal - calculatedDiscount);
                    // Adjust actual points used if capped
                    // (Actually we can just use what they asked but $1 per 100 points)
                }

                // M-05: Atomic check-and-decrement to prevent race condition / negative balance.
                // The WHERE clause (points >= pointsToUse) is evaluated atomically in MySQL,
                // so concurrent orders cannot both pass even if they read the same balance.
                const updated = await tx.user.updateMany({
                    where: { id: userId, points: { gte: pointsToUse } },
                    data: { points: { decrement: pointsToUse } }
                });

                if (updated.count === 0) {
                    throw new Error("Sá»‘ dÆ° LIKEFOOD Xu khÃ´ng Ä‘á»§ (giao dá»‹ch Ä‘á»“ng thá»i)");
                }

                await tx.pointtransaction.create({
                    data: {
                        userId: userId,
                        amount: -pointsToUse,
                        type: "SPEND",
                        description: `Sá»­ dá»¥ng cho Ä‘Æ¡n hÃ ng`,
                    }
                });
            }

            const total = Math.max(0, subtotal + calculatedShippingFee - calculatedDiscount - pointsDiscountAmount);

            const newOrder = await tx.order.create({
                data: {
                    userId: userId,
                    status: "PENDING",
                    subtotal,
                    shippingFee: calculatedShippingFee,
                    discount: calculatedDiscount,
                    pointsUsed: pointsToUse > 0 ? pointsToUse : null,
                    pointsDiscount: pointsDiscountAmount > 0 ? pointsDiscountAmount : null,
                    total,
                    couponCode: couponCode || null,
                    shippingAddress: encrypt(shippingAddress) || shippingAddress,
                    shippingCity,
                    shippingZipCode,
                    shippingPhone: encrypt(shippingPhone) || shippingPhone,
                    shippingMethod,
                    paymentMethod: paymentMethod || "STRIPE",
                    paymentStatus: "UNPAID",
                    notes: idempotencyKey
                        ? `${notes || ""}${notes ? " | " : ""}[IDEMPOTENCY:${idempotencyKey}]`
                        : notes || null,
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

            // Ghi láº¡i timeline cho Ä‘Æ¡n hÃ ng (ORDER TIMELINE)
            await tx.orderevent.create({
                data: {
                    orderId: newOrder.id,
                    status: newOrder.status,
                    note: "Order created",
                },
            });

            // Cáº­p nháº­t tá»“n kho + soldCount sau khi táº¡o order
            for (const item of itemsWithPrice) {
                // Update base product soldCount (always) and inventory (if no variant or we want to keep them in sync)
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        inventory: {
                            decrement: item.quantity,
                        },
                        soldCount: {
                            increment: item.quantity,
                        },
                    },
                });

                // Update variant stock if applicable
                if (item.variantId) {
                    await tx.productvariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }
            }

            // 4. Calculate Loyalty Points (1 point per $1 spent on subtotal)
            const earnedPoints = Math.floor(subtotal);
            if (earnedPoints > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        points: { increment: earnedPoints },
                    },
                });

                await tx.pointtransaction.create({
                    data: {
                        userId: userId,
                        orderId: newOrder.id,
                        amount: earnedPoints,
                        type: "EARN",
                        description: `TÃ­ch lÅ©y tá»« Ä‘Æ¡n hÃ ng #${String(newOrder.id).slice(-6).toUpperCase()}`,
                    },
                });
            }

            return newOrder;
        });

        // Auto-create order notification cho user
        try {
            await createOrderNotification(
                userId,
                order.id,
                'PENDING',
                order.total
            );
        } catch (notifError) {
            logger.error('Failed to create order notification', notifError as Error, {
                userId: String(userId),
                orderId: order.id,
            });
            // KhÃ´ng fail order náº¿u notification lá»—i
        }

        // Gá»­i email xÃ¡c nháº­n Ä‘Æ¡n hÃ ng (best-effort)
        try {
            if (session.user.email) {
                await sendOrderConfirmationEmail({
                    orderId: order.id,
                    toEmail: session.user.email,
                    total: order.total,
                    status: normalizeOrderStatus(order.status),
                    createdAt: order.createdAt,
                });
            }
        } catch (mailError) {
            logger.error("Failed to send order confirmation email", mailError as Error, { context: "orders-api-post", orderId: order.id });
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
                customerName: session.user.name || "Customer",
                customerPhone: shippingPhone || "N/A",
                shippingAddress: `${shippingAddress}, ${shippingCity} ${shippingZipCode}`,
                paymentMethod: paymentMethod || "STRIPE",
                totalAmount: order.total,
                items: orderItems,
            });
        } catch (telegramError) {
            logger.error("Failed to send Telegram notification", telegramError as Error, { context: "orders-api-post", orderId: order.id });
        }

        // n8n webhook: order-created (non-blocking)
        try {
            const { triggerOrderCreated } = await import("@/lib/n8n-trigger");
            await triggerOrderCreated({
                orderId: order.id,
                customerName: session.user.name || "Customer",
                customerEmail: session.user.email || "",
                total: order.total,
                items: order.orderItems.map((item) => ({
                    name: item.nameSnapshot || item.product?.name || "Unknown",
                    quantity: item.quantity,
                    price: item.price,
                })),
            });
        } catch (n8nError) {
            logger.error("n8n trigger failed", n8nError as Error, { context: "orders-api-post", orderId: order.id });
        }

        return NextResponse.json({
            ...order,
            status: normalizeOrderStatus(order.status),
            items: order.orderItems,
        }, { status: 201 });
    } catch (error) {
        logger.error("Order creation error", error as Error, {
            userId: String(Number(session?.user?.id)),
        });
        const message = error instanceof Error ? error.message : "Failed to create order";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

