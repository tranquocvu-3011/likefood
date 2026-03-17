/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import Stripe from "stripe";
import { getSystemSettingTrimmed } from "@/lib/system-settings";

async function getStripeClient(): Promise<Stripe | null> {
    const secret =
        (await getSystemSettingTrimmed("stripe_secret_key")) ||
        process.env.STRIPE_SECRET_KEY ||
        "";
    if (!secret) return null;
    return new Stripe(secret, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: "2024-11-20" as any,
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = await getStripeClient();
    if (!stripe) {
        return NextResponse.json({ error: "Stripe is not configured on the server" }, { status: 500 });
    }

    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        const order = await prisma.order.findFirst({
            where: {
                id: Number(orderId),
                userId: Number(session.user.id),
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const amount = Math.round(order.total * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            metadata: {
                orderId: order.id,
                userId: order.userId,
            },
        });

        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentIntentId: paymentIntent.id,
                paymentStatus: "UNPAID",
            },
        });

        return NextResponse.json(
            { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id },
            { status: 200 }
        );
    } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to create payment intent");
        logger.error("Stripe create-intent error", err, {
            context: "payments-create-intent",
            userId: String(Number(session?.user?.id)),
        });
        return NextResponse.json(
            { error: "Khong the tao payment intent, vui long thu lai" },
            { status: 500 }
        );
    }
}
