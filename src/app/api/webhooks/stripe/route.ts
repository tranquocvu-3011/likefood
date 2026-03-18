/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 *
 * Stripe Webhook Handler
 * Flow: Stripe sends webhook → verify signature → create order on success
 *
 * IMPORTANT: Orders are ONLY created here, after successful payment.
 * This ensures no order exists without a confirmed payment.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";
import StripeSdk from "stripe";
import { getSystemSettingTrimmed } from "@/lib/system-settings";
import { normalizeOrderStatus, POINTS_PER_DOLLAR } from "@/lib/commerce";
import { notifyPaymentSuccess } from "@/lib/telegram";
export async function POST(req: Request) {
    const sig = req.headers.get("stripe-signature");
    const webhookSecret =
        (await getSystemSettingTrimmed("stripe_webhook_secret")) ||
        process.env.STRIPE_WEBHOOK_SECRET ||
        "";

    const stripeSecret =
        (await getSystemSettingTrimmed("stripe_secret_key")) ||
        process.env.STRIPE_SECRET_KEY ||
        "";

    const stripe = stripeSecret
        ? new StripeSdk(stripeSecret, {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              apiVersion: "2024-11-20" as any,
          })
        : null;

    if (!webhookSecret) {
        logger.error("[STRIPE] STRIPE_WEBHOOK_SECRET is not set", new Error("Webhook secret not configured"), { context: "stripe-webhook" });
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }
    if (!stripe) {
        logger.error("[STRIPE] STRIPE_SECRET_KEY is not set", new Error("Stripe secret not configured"), { context: "stripe-webhook" });
        return NextResponse.json({ error: "Stripe secret not configured" }, { status: 500 });
    }

    if (!sig) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error("[STRIPE] Webhook signature verification failed", err as Error, { context: "stripe-webhook" });
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    try {
        // Idempotency: skip events already processed
        const idempotencyKey = `stripe_event:${event.id}`;
        const alreadyProcessed = await prisma.systemsetting.findUnique({ where: { key: idempotencyKey } });
        if (alreadyProcessed) {
            return NextResponse.json({ received: true, skipped: true }, { status: 200 });
        }

        switch (event.type) {
            // ── Stripe Checkout Session completed → CREATE ORDER ──
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const metadata = session.metadata || {};

                // Check if this session has checkout data (new flow)
                if (metadata.userId && metadata.items) {
                    await handleCheckoutCompleted(session, metadata);
                } else {
                    // Legacy flow: orderId-based (backward compatibility)
                    const orderId = metadata.orderId || session.client_reference_id;
                    if (orderId) {
                        await handleLegacyPayment(Number(orderId), session);
                    }
                }
                break;
            }

            case "checkout.session.expired": {
                const session = event.data.object as Stripe.Checkout.Session;
                const metadata = session.metadata || {};

                // Restore reserved points if session expires
                if (metadata.userId && metadata.pointsToUse) {
                    const pointsToRestore = Number(metadata.pointsToUse);
                    if (pointsToRestore > 0) {
                        try {
                            await prisma.user.update({
                                where: { id: Number(metadata.userId) },
                                data: { points: { increment: pointsToRestore } },
                            });
                            logger.info("[STRIPE] Restored reserved points on session expiry", {
                                userId: metadata.userId,
                                points: pointsToRestore,
                            });
                        } catch (err) {
                            logger.error("[STRIPE] Failed to restore points", err as Error, { context: "stripe-webhook" });
                        }
                    }
                }

                // Legacy: update existing order if orderId present 
                const orderId = metadata.orderId || session.client_reference_id;
                if (orderId) {
                    await prisma.order.updateMany({
                        where: { id: Number(orderId), paymentStatus: { not: "PAID" } },
                        data: { paymentStatus: "FAILED" },
                    });
                }
                break;
            }

            // ── Stripe Elements (PaymentIntent) – backward compat ──
            case "payment_intent.succeeded": {
                const intent = event.data.object as Stripe.PaymentIntent;
                const paymentIntentId = intent.id as string;

                await prisma.order.updateMany({
                    where: { paymentIntentId },
                    data: {
                        paymentStatus: "PAID",
                    },
                });
                break;
            }
            case "payment_intent.payment_failed":
            case "payment_intent.canceled": {
                const intent = event.data.object as Stripe.PaymentIntent;
                const paymentIntentId = intent.id as string;

                await prisma.order.updateMany({
                    where: { paymentIntentId },
                    data: {
                        paymentStatus: "FAILED",
                    },
                });
                break;
            }
            case "charge.refunded": {
                const charge = event.data.object as Stripe.Charge;
                const paymentIntentId = charge.payment_intent as string;

                if (paymentIntentId) {
                    await prisma.order.updateMany({
                        where: { paymentIntentId },
                        data: {
                            paymentStatus: "REFUNDED",
                        },
                    });

                    // REF-003: Void referral commissions when order is refunded
                    try {
                        const refundedOrders = await prisma.order.findMany({
                            where: { paymentIntentId },
                            select: { id: true },
                        });
                        const { onOrderRefunded } = await import("@/lib/referral/events.service");
                        for (const refOrder of refundedOrders) {
                            await onOrderRefunded(refOrder.id, `Stripe refund: ${charge.id}`);
                        }
                    } catch (refErr) {
                        logger.error("[STRIPE] Failed to void referral commissions on refund", refErr as Error, { context: "stripe-webhook", paymentIntentId });
                    }
                }
                break;
            }
            default: {
                // Ignore other events
                break;
            }
        }

        // Mark event as processed for idempotency
        await prisma.systemsetting.create({
            data: { key: `stripe_event:${event.id}`, value: new Date().toISOString() },
        });

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        logger.error("[STRIPE] Webhook handling error", error as Error, { context: "stripe-webhook", eventType: event?.type });
        return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
    }
}

/**
 * Handle completed checkout session (NEW FLOW):
 * Creates the order, decrements inventory, processes voucher/points, sends notifications.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, metadata: Record<string, string>) {
    const userId = Number(metadata.userId);
    const subtotal = Number(metadata.subtotal || 0);
    const shippingFee = Number(metadata.shippingFee || 0);
    const discount = Number(metadata.discount || 0);
    const pointsToUse = Number(metadata.pointsToUse || 0);
    const pointsDiscount = Number(metadata.pointsDiscount || 0);
    const total = Number(metadata.total || 0);
    const couponCode = metadata.couponCode || null;
    const shippingMethod = metadata.shippingMethod || "standard";
    const notes = metadata.notes || null;

    // Parse items from metadata (handle chunks for large carts)
    let items: Array<{ pid: number; vid: number | null; qty: number; price: number; name: string }>;
    try {
        let itemsJson: string;
        if (metadata.items) {
            itemsJson = metadata.items;
        } else if (metadata.itemChunks) {
            // Reassemble chunked items
            const chunkCount = Number(metadata.itemChunks);
            itemsJson = "";
            for (let i = 0; i < chunkCount; i++) {
                itemsJson += metadata[`items_${i}`] || "";
            }
        } else {
            logger.error("[STRIPE] No items data in metadata", new Error("Missing items"), { context: "stripe-webhook", sessionId: session.id });
            return;
        }
        items = JSON.parse(itemsJson);
    } catch (e) {
        logger.error("[STRIPE] Failed to parse items from metadata", e as Error, { context: "stripe-webhook", sessionId: session.id });
        return;
    }

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
        // 1. Verify stock and decrement inventory
        for (const item of items) {
            const product = await tx.product.findUnique({
                where: { id: item.pid },
                select: { inventory: true, name: true },
            });

            if (!product) {
                logger.error(`[STRIPE] Product ${item.pid} not found during order creation`, new Error("Product not found"), { context: "stripe-webhook" });
                continue;
            }

            if (product.inventory < item.qty) {
                logger.error(`[STRIPE] Insufficient inventory for "${product.name}": have ${product.inventory}, need ${item.qty}`, new Error("Inventory guard triggered"), { context: "stripe-webhook" });
                // Still create order but log the issue — admin must handle manually
            }

            await tx.product.update({
                where: { id: item.pid },
                data: {
                    inventory: { decrement: Math.min(item.qty, product.inventory) },
                    soldCount: { increment: item.qty },
                },
            });

            // Decrement variant stock if applicable
            if (item.vid) {
                const variant = await tx.productvariant.findUnique({
                    where: { id: item.vid },
                    select: { stock: true },
                });
                if (variant) {
                    await tx.productvariant.update({
                        where: { id: item.vid },
                        data: { stock: { decrement: Math.min(item.qty, variant.stock) } },
                    });
                }
            }
        }

        // 2. Process voucher
        if (couponCode) {
            try {
                const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
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
                logger.error("[STRIPE] Voucher processing error", voucherErr as Error, { context: "stripe-webhook" });
            }
        }

        // 3. Process points (deduct if not yet deducted)
        if (pointsToUse > 0) {
            // Atomic deduct points
            const updated = await tx.user.updateMany({
                where: { id: userId, points: { gte: pointsToUse } },
                data: { points: { decrement: pointsToUse } },
            });

            if (updated.count > 0) {
                await tx.pointtransaction.create({
                    data: {
                        userId,
                        amount: -pointsToUse,
                        type: "SPEND",
                        description: "Sử dụng cho đơn hàng",
                    },
                });
            }
        }

        // 4. Create the order
        const newOrder = await tx.order.create({
            data: {
                userId,
                status: "CONFIRMED",
                subtotal,
                shippingFee,
                discount,
                pointsUsed: pointsToUse > 0 ? pointsToUse : null,
                pointsDiscount: pointsDiscount > 0 ? pointsDiscount : null,
                total,
                couponCode: couponCode || null,
                shippingAddress: metadata.shippingAddress, // Already encrypted in checkout
                shippingCity: metadata.shippingCity,
                shippingZipCode: metadata.shippingZipCode,
                shippingPhone: metadata.shippingPhone, // Already encrypted in checkout
                shippingMethod,
                paymentMethod: "STRIPE",
                paymentStatus: "PAID",
                paymentIntentId: (session.payment_intent as string) || session.id,
                notes,
                orderItems: {
                    create: items.map((item) => ({
                        productId: item.pid,
                        variantId: item.vid,
                        quantity: item.qty,
                        price: item.price,
                        nameSnapshot: item.name,
                    })),
                },
            },
            include: {
                orderItems: {
                    include: { product: true },
                },
                user: { select: { email: true, name: true } },
            },
        });

        // 5. Record order event
        await tx.orderevent.create({
            data: {
                orderId: newOrder.id,
                status: "CONFIRMED",
                note: "Đơn hàng được tạo sau khi thanh toán Stripe thành công",
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
                    description: `Tích lũy từ đơn hàng #${String(newOrder.id).slice(-6).toUpperCase()} (${POINTS_PER_DOLLAR} điểm/$1)`,
                },
            });
        }

        return newOrder;
    });

    logger.info(`[STRIPE] Order ${order.id} created after successful payment`, {
        sessionId: session.id,
        userId: String(userId),
        total,
    });

    // ── Send notifications (non-blocking) ──

    // 1. Order notification
    try {
        const { createOrderNotification } = await import("@/lib/notifications");
        await createOrderNotification(userId, order.id, "CONFIRMED", order.total);
    } catch (notifError) {
        logger.error("Failed to create order notification", notifError as Error, { orderId: order.id });
    }

    // 2. Email confirmation
    try {
        const userEmail = order.user?.email || session.customer_email;
        if (userEmail) {
            const { sendOrderConfirmationEmail } = await import("@/lib/mail");
            await sendOrderConfirmationEmail({
                orderId: order.id,
                toEmail: userEmail,
                total: order.total,
                status: normalizeOrderStatus(order.status),
                createdAt: order.createdAt,
            });
        }
    } catch (mailError) {
        logger.error("Failed to send order confirmation email", mailError as Error, { orderId: order.id });
    }

    // 3. Telegram notification to admin
    try {
        const { sendOrderNotification } = await import("@/lib/telegram");
        const isPickupOrder = shippingMethod === "pickup";
        await sendOrderNotification({
            orderId: order.id,
            customerName: order.user?.name || metadata.fullName || "Customer",
            customerPhone: metadata.shippingPhone || "N/A",
            shippingAddress: isPickupOrder
                ? `📍 Store Pickup (Paid via Stripe)`
                : `${metadata.shippingAddress}, ${metadata.shippingCity} ${metadata.shippingZipCode}`,
            paymentMethod: isPickupOrder ? "STRIPE (Store Pickup)" : "STRIPE",
            totalAmount: order.total,
            items: order.orderItems.map((item) => ({
                name: item.nameSnapshot || item.product?.name || "Unknown",
                quantity: item.quantity,
                price: item.price,
            })),
        });
    } catch (telegramError) {
        logger.error("Failed to send Telegram notification", telegramError as Error, { orderId: order.id });
    }

    // 4. Telegram payment success
    try {
        notifyPaymentSuccess({
            orderId: order.id,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || "USD",
            method: "STRIPE",
            customerEmail: session.customer_email || undefined,
        }).catch(() => {});
    } catch {
        // silent
    }

    // 5. n8n webhook
    try {
        const { triggerOrderCreated } = await import("@/lib/n8n-trigger");
        await triggerOrderCreated({
            orderId: order.id,
            customerName: order.user?.name || metadata.fullName || "Customer",
            customerEmail: order.user?.email || "",
            total: order.total,
            items: order.orderItems.map((item) => ({
                name: item.nameSnapshot || item.product?.name || "Unknown",
                quantity: item.quantity,
                price: item.price,
            })),
        });
    } catch (n8nError) {
        logger.error("n8n trigger failed", n8nError as Error, { orderId: order.id });
    }
}

/**
 * Handle legacy payment flow (backward compatibility for orders created before this change)
 */
async function handleLegacyPayment(orderId: number, session: Stripe.Checkout.Session) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
    });

    if (order && order.paymentStatus !== "PAID") {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "PAID",
                paymentIntentId: (session.payment_intent as string) || session.id,
            },
        });
        logger.info(`[STRIPE] Legacy order ${orderId} marked as paid`, { sessionId: session.id });
    }
}
