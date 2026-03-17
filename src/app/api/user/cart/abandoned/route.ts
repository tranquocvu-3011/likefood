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
import { logger } from "@/lib/logger";

interface AbandonedCartItem {
    id: number;
    productId?: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

interface AbandonedCartBody {
    cartItems: AbandonedCartItem[];
    abandonedAt: string;
}

// POST - Save abandoned cart for logged-in user
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            // Guest user - just return success, localStorage handles this
            return NextResponse.json({ message: "Guest cart not saved to server" }, { status: 200 });
        }

        const body: AbandonedCartBody = await req.json();
        const { cartItems, abandonedAt } = body;

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
        }

        // Save or update abandoned cart for user
        // This can be used for recovery emails later
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { id: true, email: true, name: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const totalValue = cartItems.reduce(
            (sum: number, item: AbandonedCartItem) => sum + item.price * item.quantity,
            0
        );

        // D-02: Persist to DB using systemsetting key-value store.
        // Key per user ensures one record per user; upsert prevents duplicates.
        const settingKey = `abandoned_cart_${session.user.id}`;
        const payload = JSON.stringify({ items: cartItems, totalValue, abandonedAt, savedAt: new Date().toISOString() });
        await prisma.systemsetting.upsert({
            where: { key: settingKey },
            create: { key: settingKey, value: payload },
            update: { value: payload },
        });

        logger.info("Abandoned cart persisted to DB", {
            context: "abandoned-cart",
            userId: String(user.id),
            itemCount: cartItems.length,
            totalValue,
            abandonedAt,
        });

        return NextResponse.json({
            success: true,
            message: "Abandoned cart recorded",
            itemCount: cartItems.length,
        });

    } catch (error) {
        logger.error("Abandoned cart API error", error as Error, { context: "abandoned-cart-api" });
        return NextResponse.json({ error: "Failed to record abandoned cart" }, { status: 500 });
    }
}

// GET - Retrieve user's active abandoned cart (for recovery on login)
export async function GET(_req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settingKey = `abandoned_cart_${session.user.id}`;
        const setting = await prisma.systemsetting.findUnique({ where: { key: settingKey } });
        const cart = setting ? JSON.parse(setting.value) : null;

        return NextResponse.json({ cart });

    } catch (error) {
        logger.error("Get abandoned cart error", error as Error, { context: "abandoned-cart-get" });
        return NextResponse.json({ error: "Failed to get abandoned cart" }, { status: 500 });
    }
}
