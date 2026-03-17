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

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        // Check for guest token in cookies
        const guestToken = request.cookies.get('guest_cart_token')?.value;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let cart: any = null;

        if (session?.user?.id) {
            // Logged in user
            cart = await prisma.cart.findUnique({
                where: { userId: Number(session.user.id) },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    price: true,
                                    salePrice: true,
                                    isOnSale: true,
                                    image: true,
                                    inventory: true
                                }
                            },
                            variant: {
                                select: {
                                    id: true,
                                    weight: true,
                                    flavor: true,
                                    priceAdjustment: true,
                                    stock: true,
                                    sku: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        } else if (guestToken) {
            // Guest user
            cart = await prisma.cart.findUnique({
                where: { guestToken },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    price: true,
                                    salePrice: true,
                                    isOnSale: true,
                                    image: true,
                                    inventory: true
                                }
                            },
                            variant: {
                                select: {
                                    id: true,
                                    weight: true,
                                    flavor: true,
                                    priceAdjustment: true,
                                    stock: true,
                                    sku: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        }

        if (!cart) {
            return NextResponse.json({ items: [], itemCount: 0, total: 0 });
        }

        // Fetch active flash sale prices for products in cart
        const cartProductIds = [...new Set(cart.items.map((item: { productId: number }) => item.productId))] as number[];
        const now = new Date();
        const flashSalePrices = await prisma.flashsaleproduct.findMany({
            where: {
                productId: { in: cartProductIds },
                campaign: {
                    isActive: true,
                    startAt: { lte: now },
                    endAt: { gte: now },
                },
            },
            select: {
                productId: true,
                flashSalePrice: true,
                stockLimit: true,
                soldCount: true,
            },
        });
        const flashSalePriceMap = new Map(flashSalePrices.map(fp => [fp.productId, fp]));

        // Calculate totals with flash sale priority
        const formattedItems = cart.items.map(item => {
            let basePrice = item.product.price;

            // Priority 1: Flash Sale Campaign price
            const flashSale = flashSalePriceMap.get(item.productId);
            if (flashSale && (!flashSale.stockLimit || flashSale.soldCount < flashSale.stockLimit)) {
                basePrice = flashSale.flashSalePrice;
            }
            // Priority 2: Product-level sale price
            else if (item.product.isOnSale && item.product.salePrice) {
                basePrice = item.product.salePrice;
            }

            const variantAdjustment = item.variant?.priceAdjustment || 0;
            const finalPrice = basePrice + variantAdjustment;

            return {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                product: item.product,
                variant: item.variant,
                price: finalPrice,
                subtotal: finalPrice * item.quantity
            };
        });

        const total = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);

        return NextResponse.json({
            items: formattedItems,
            itemCount: formattedItems.reduce((sum, item) => sum + item.quantity, 0),
            total: Math.round(total * 100) / 100
        });

    } catch (error) {
        logger.error("Get cart error", error as Error, { context: "cart-api-get" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi lấy giỏ hàng" },
            { status: 500 }
        );
    }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    let productId: number | undefined;

    try {
        // Apply rate limiting
        const { apiRateLimit, getRateLimitIdentifier, applyRateLimit } = await import('@/lib/ratelimit');
        const identifier = getRateLimitIdentifier(request, session?.user?.id);
        const rateLimitResult = await applyRateLimit(identifier, apiRateLimit);

        if (!rateLimitResult.success && rateLimitResult.error) {
            return rateLimitResult.error;
        }

        const body = await request.json();

        // Import validation schema dynamically to avoid circular deps
        const { addToCartSchema } = await import('@/lib/validations/cart');
        const { validationErrorResponse } = await import('@/lib/validations/utils');

        // Validate request body
        const validationResult = addToCartSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                validationErrorResponse(validationResult.error),
                { status: 400 }
            );
        }

        const { productId: validProductId, variantId, quantity } = validationResult.data;
        productId = Number(validProductId);

        // Use transaction to prevent race condition
        // All stock checks and cart updates happen atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify product exists and has stock (inside transaction)
            const product = await tx.product.findUnique({
                where: { id: Number(productId) },
                select: {
                    id: true,
                    name: true,
                    inventory: true,
                    isDeleted: true
                }
            });

            if (!product) {
                throw new Error("Sản phẩm không tồn tại");
            }

            if (product.isDeleted) {
                throw new Error("Sản phẩm đã bị xóa");
            }

            // 2. Check stock
            let availableStock = product.inventory;
            if (variantId) {
                const variant = await tx.productvariant.findUnique({
                    where: { id: Number(variantId) },
                    select: { id: true, stock: true, isActive: true }
                });
                if (!variant || !variant.isActive) {
                    throw new Error("Loại sản phẩm không hợp lệ");
                }
                availableStock = variant.stock;
            }

            // 3. Get or create cart (inside transaction)
            let guestToken = request.cookies.get('guest_cart_token')?.value;
            let cart;

            if (session?.user?.id) {
                cart = await tx.cart.upsert({
                    where: { userId: Number(session.user.id) },
                    update: {},
                    create: { userId: Number(session.user.id) }
                });
            } else {
                if (!guestToken) {
                    guestToken = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                }
                cart = await tx.cart.upsert({
                    where: { guestToken },
                    update: {},
                    create: { guestToken }
                });
            }

            // 4. Check existing item in cart (inside transaction)
            const queryVariantId = variantId ? Number(variantId) : null;
            const existingItem = await tx.cartitem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: productId!,
                    variantId: queryVariantId
                }
            });

            // 5. Calculate new quantity and check stock atomically
            const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
            
            if (availableStock < newQuantity) {
                throw new Error(`Chỉ còn ${availableStock} sản phẩm trong kho`);
            }

            // 6. Add or update cart item (inside transaction)
            let cartItem;
            if (existingItem) {
                cartItem = await tx.cartitem.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQuantity }
                });
            } else {
                cartItem = await tx.cartitem.create({
                    data: {
                        cartId: cart.id,
                        productId: productId!, // Already validated
                        variantId: variantId ? Number(variantId) : null,
                        quantity
                    }
                });
            }

            return { cartItem, newGuestToken: guestToken };
        });

        // Build response with Set-Cookie for guest
        const response = NextResponse.json({
            success: true,
            message: "Đã thêm vào giỏ hàng",
            cartItemId: result.cartItem.id
        });

        if (!session?.user?.id && result.newGuestToken) {
            response.cookies.set('guest_cart_token', result.newGuestToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
        }

        return response;

    } catch (error) {
        const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi thêm vào giỏ hàng";
        logger.error("Add to cart error", error as Error, { context: "cart-api-post", userId: session?.user?.id ? String(session.user.id) : undefined, productId });
        
        // Handle known errors with appropriate status codes
        if (message.includes("không tồn tại") || message.includes("đã bị xóa") || message.includes("không hợp lệ")) {
            return NextResponse.json({ error: message }, { status: 404 });
        }
        if (message.includes("Chỉ còn")) {
            return NextResponse.json({ error: message }, { status: 400 });
        }
        
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi thêm vào giỏ hàng" },
            { status: 500 }
        );
    }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        const guestToken = request.cookies.get('guest_cart_token')?.value;

        let cart: any = null;

        if (session?.user?.id) {
            cart = await prisma.cart.findUnique({
                where: { userId: Number(session.user.id) }
            });
        } else if (guestToken) {
            cart = await prisma.cart.findUnique({
                where: { guestToken }
            });
        }

        if (cart) {
            await prisma.cartitem.deleteMany({
                where: { cartId: cart.id }
            });
        }

        return NextResponse.json({ success: true, message: "Đã xóa giỏ hàng" });

    } catch (error) {
        logger.error("Clear cart error", error as Error, { context: "cart-api-delete", userId: session?.user?.id ? String(session.user.id) : undefined });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi xóa giỏ hàng" },
            { status: 500 }
        );
    }
}
