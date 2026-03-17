/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * GET /api/public/payment-methods
 * Public endpoint — no auth required.
 * Returns Stripe publishable key. Only Stripe is supported.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
export async function GET() {
    try {
        const row = await prisma.systemsetting.findUnique({ where: { key: "stripe_publishable_key" } });

        const stripePublishableKey =
            row?.value ||
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
            null;

        return NextResponse.json({
            COD: false,
            BANK: false,
            MOMO: false,
            PAYPAL: false,
            STRIPE: true,
            ZALOPAY: false,
            stripePublishableKey,
        });
    } catch (error) {
        logger.error("[PUBLIC_PAYMENT_METHODS_GET]", error as Error, { context: "public-payment-methods-api" });
        return NextResponse.json({
            COD: false,
            BANK: false,
            MOMO: false,
            PAYPAL: false,
            STRIPE: true,
            ZALOPAY: false,
            stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
        });
    }
}
