/**
 * LIKEFOOD - Stripe Checkout Session API
 * Creates a Stripe Checkout Session with cart data.
 * Flow: User fills checkout form → This API validates & creates Stripe session
 *       → User pays on Stripe → Webhook creates order after payment succeeds
 *
 * IMPORTANT: No order is created at this point. The order is only created
 * in the Stripe webhook after payment is confirmed.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getShippingFeeUsd } from "@/lib/commerce";
import { checkoutRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { encrypt } from "@/lib/encryption";

const roundUsd = (amount: number) => Math.round(amount * 100) / 100;

interface CheckoutItem {
    productId: string | number;
    variantId?: string | number | null;
    quantity: number;
}

export async function POST(req: NextRequest) {
    try {
        // SEC: Require authentication
        const authSession = await getServerSession(authOptions);
        if (!authSession?.user?.id) {
            return NextResponse.json(
                { error: "Vui lòng đăng nhập để thanh toán" },
                { status: 401 }
            );
        }

        // Rate limiting
        const identifier = getRateLimitIdentifier(req, String(authSession.user.id));
        const rateResult = await applyRateLimit(identifier, checkoutRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const body = await req.json();
        const {
            items,
            shippingAddress,
            shippingCity,
            shippingZipCode,
            shippingPhone,
            shippingMethod = "standard",
            fullName,
            email,
            couponCode,
            pointsToUse = 0,
            notes,
        } = body as {
            items: CheckoutItem[];
            shippingAddress: string;
            shippingCity: string;
            shippingZipCode: string;
            shippingPhone: string;
            shippingMethod: string;
            fullName: string;
            email: string;
            couponCode?: string | null;
            pointsToUse?: number;
            notes?: string;
        };

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 400 });
        }
        if (!shippingPhone) {
            return NextResponse.json({ error: "Vui lòng nhập số điện thoại" }, { status: 400 });
        }
        // For non-pickup orders, require full shipping address
        if (shippingMethod !== "pickup" && (!shippingAddress || !shippingCity)) {
            return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin giao hàng" }, { status: 400 });
        }

        // Verify user exists
        let userId = authSession.user.id;
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, points: true },
        });
        if (!existingUser) {
            if (authSession.user.email) {
                const userByEmail = await prisma.user.findUnique({
                    where: { email: authSession.user.email },
                    select: { id: true, points: true },
                });
                if (userByEmail) {
                    userId = userByEmail.id;
                } else {
                    return NextResponse.json({ error: "Tài khoản không hợp lệ. Vui lòng đăng nhập lại." }, { status: 400 });
                }
            } else {
                return NextResponse.json({ error: "Tài khoản không hợp lệ." }, { status: 400 });
            }
        }

        // Fetch products and variants from DB to calculate real prices
        const productIds = [...new Set(items.map((i) => Number(i.productId)))];
        const products = await prisma.product.findMany({
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
                image: true,
                slug: true,
            },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        // Fetch active flash sale prices for products in cart
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
            select: {
                productId: true,
                flashSalePrice: true,
                stockLimit: true,
                soldCount: true,
            },
        });
        const flashSalePriceMap = new Map(flashSalePrices.map((fp) => [fp.productId, fp]));

        const variantIds = items
            .map((i) => (i.variantId ? Number(i.variantId) : null))
            .filter(Boolean) as number[];
        const variants = variantIds.length
            ? await prisma.productvariant.findMany({
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
        const variantMap = new Map(variants.map((v) => [v.id, v]));

        // Calculate prices & validate stock
        const lineItemsData: Array<{
            productId: number;
            variantId: number | null;
            quantity: number;
            unitPrice: number;
            name: string;
            image: string | null;
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

            // Calculate price - priority: Flash Sale Campaign > Product Sale > Regular Price
            let basePrice = product.price;

            // Check flash sale campaign price first (highest priority)
            const flashSale = flashSalePriceMap.get(Number(item.productId));
            if (flashSale) {
                // Check stock limit for flash sale
                if (!flashSale.stockLimit || flashSale.soldCount < flashSale.stockLimit) {
                    basePrice = flashSale.flashSalePrice;
                }
            } else {
                // Fallback: check product-level sale price
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
                image: product.image,
            });
        }

        // Calculate subtotal
        const subtotal = lineItemsData.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

        // Calculate shipping fee
        const calculatedShippingFee = getShippingFeeUsd(subtotal, shippingMethod);

        // Validate voucher (if any)
        let calculatedDiscount = 0;
        let validatedCouponCode: string | null = null;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
            if (coupon && coupon.isActive) {
                const now = new Date();
                if (coupon.startDate <= now && coupon.endDate >= now) {
                    if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
                        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
                            const userVoucher = await prisma.uservoucher.findUnique({
                                where: { userId_couponId: { userId, couponId: coupon.id } },
                            });
                            if (userVoucher && userVoucher.status !== "USED") {
                                if (coupon.discountType === "PERCENTAGE") {
                                    calculatedDiscount = roundUsd((subtotal * coupon.discountValue) / 100);
                                    if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
                                        calculatedDiscount = roundUsd(coupon.maxDiscount);
                                    }
                                } else {
                                    calculatedDiscount = roundUsd(coupon.discountValue);
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
            const userForPoints = existingUser || await prisma.user.findUnique({
                where: { id: userId },
                select: { points: true },
            });
            if (userForPoints && userForPoints.points >= pointsToUse) {
                pointsDiscountAmount = pointsToUse / 100; // 100 points = $1
                if (pointsDiscountAmount > subtotal - calculatedDiscount) {
                    pointsDiscountAmount = Math.max(0, subtotal - calculatedDiscount);
                }
                validatedPointsToUse = pointsToUse;
            }
        }

        // Calculate total
        const total = Math.max(0, subtotal + calculatedShippingFee - calculatedDiscount - pointsDiscountAmount);
        const totalDiscount = calculatedDiscount + pointsDiscountAmount;

        const stripe = getStripe();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Build Stripe line_items
        const line_items = lineItemsData.map((item) => {
            const productImage = item.image
                ? (item.image.startsWith("http") ? item.image : `${appUrl}${item.image}`)
                : undefined;
            const unitAmount = Math.round(item.unitPrice * 100); // USD cents

            return {
                quantity: item.quantity,
                price_data: {
                    currency: "usd",
                    unit_amount: unitAmount,
                    product_data: {
                        name: item.name,
                        ...(productImage && { images: [productImage] }),
                        metadata: { productId: String(item.productId) },
                    },
                },
            };
        });

        // Add shipping fee as line item
        if (calculatedShippingFee > 0) {
            line_items.push({
                quantity: 1,
                price_data: {
                    currency: "usd",
                    unit_amount: Math.round(calculatedShippingFee * 100),
                    product_data: {
                        name: "Phí vận chuyển",
                        metadata: { productId: "shipping_fee" },
                    },
                },
            });
        }

        // Create Stripe coupon for discount (so user sees accurate total on Stripe)
        let discounts: Array<{ coupon: string }> | undefined;
        if (totalDiscount > 0) {
            try {
                const stripeCoupon = await stripe.coupons.create({
                    amount_off: Math.round(totalDiscount * 100),
                    currency: "usd",
                    duration: "once",
                    name: validatedCouponCode
                        ? `Voucher ${validatedCouponCode}${pointsDiscountAmount > 0 ? " + Points" : ""}`
                        : "Giảm giá điểm thưởng",
                });
                discounts = [{ coupon: stripeCoupon.id }];
            } catch (couponErr) {
                logger.error("Failed to create Stripe coupon for discount", couponErr as Error, { context: "create-checkout-session" });
                // Continue without coupon — user will see full price but order total is correct
            }
        }

        // Store all checkout data in Stripe metadata for the webhook to create the order
        // Stripe metadata values must be strings, max 500 chars per value, max 50 keys
        // Split items JSON into chunks if it exceeds 500 chars
        const itemsJson = JSON.stringify(lineItemsData.map((i) => ({
            pid: i.productId,
            vid: i.variantId,
            qty: i.quantity,
            price: i.unitPrice,
            name: i.name,
        })));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkoutData: Record<string, string> = {
            userId: String(userId),
            shippingAddress: encrypt(shippingAddress) || shippingAddress,
            shippingCity,
            shippingZipCode: shippingZipCode || "",
            shippingPhone: encrypt(shippingPhone) || shippingPhone,
            shippingMethod,
            shippingFee: String(calculatedShippingFee),
            subtotal: String(subtotal),
            discount: String(calculatedDiscount),
            pointsToUse: String(validatedPointsToUse),
            pointsDiscount: String(pointsDiscountAmount),
            total: String(total),
            couponCode: validatedCouponCode || "",
            notes: (notes || `Order for ${fullName}`).slice(0, 450),
            fullName: fullName || "",
        };

        // Split items into chunks of 450 chars to avoid Stripe 500-char limit per metadata value
        const CHUNK_SIZE = 450;
        if (itemsJson.length <= CHUNK_SIZE) {
            checkoutData.items = itemsJson;
        } else {
            const chunks: string[] = [];
            for (let i = 0; i < itemsJson.length; i += CHUNK_SIZE) {
                chunks.push(itemsJson.slice(i, i + CHUNK_SIZE));
            }
            chunks.forEach((chunk, idx) => {
                checkoutData[`items_${idx}`] = chunk;
            });
            checkoutData.itemChunks = String(chunks.length);
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items,
            ...(discounts && { discounts }),
            success_url: `${appUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/checkout?cancelled=true`,
            ...(email && { customer_email: email }),
            metadata: checkoutData,
            payment_intent_data: {
                metadata: {
                    userId: String(userId),
                },
            },
            phone_number_collection: {
                enabled: true,
            },
        });

        logger.info("Stripe checkout session created", {
            sessionId: session.id,
            userId: String(userId),
            total,
            itemCount: items.length,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        logger.error("Stripe Checkout Session error", error as Error, { context: "create-checkout-session" });
        const message = error instanceof Error ? error.message : "Không tạo được phiên thanh toán";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
