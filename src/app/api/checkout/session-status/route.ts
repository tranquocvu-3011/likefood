/**
 * LIKEFOOD - Stripe Session Status API
 * Returns the status of a Checkout Session for the return page
 * Also looks up the orderId from DB since orders are created by webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.nextUrl.searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
        }

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Look up the order created by webhook using paymentIntentId
        let orderId: number | null = null;
        const paymentIntentId = session.payment_intent as string;

        if (paymentIntentId) {
            const order = await prisma.order.findFirst({
                where: { paymentIntentId },
                select: { id: true },
            });
            orderId = order?.id || null;
        }

        // If not found by payment_intent, try session.id
        if (!orderId) {
            const order = await prisma.order.findFirst({
                where: { paymentIntentId: sessionId },
                select: { id: true },
            });
            orderId = order?.id || null;
        }

        return NextResponse.json({
            status: session.status,
            customer_email: session.customer_details?.email || null,
            payment_status: session.payment_status,
            orderId,
        });
    } catch (error) {
        logger.error("Session status error", error as Error, { context: "session-status" });
        return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
    }
}
