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
import {
    DEFAULT_SHIPPING_FEE_USD,
    FREE_SHIPPING_THRESHOLD_USD,
} from "@/lib/commerce";

// GET /api/products/[slug]/shipping - Get shipping info and estimate fee
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const quantity = Math.max(1, parseInt(searchParams.get("quantity") || "1", 10) || 1);

        const product = await prisma.product.findUnique({
            where: { slug },
            select: {
                id: true,
                price: true,
                shipping: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const orderTotal = product.price * quantity;
        const freeShipMin = product.shipping?.freeShipMin ?? FREE_SHIPPING_THRESHOLD_USD;
        const shippingFee = product.shipping?.shippingFee ?? DEFAULT_SHIPPING_FEE_USD;
        const estimatedDays = product.shipping?.estimatedDays ?? 3;
        const isFreeShip = orderTotal >= freeShipMin;
        const totalShippingFee = isFreeShip ? 0 : shippingFee;

        return NextResponse.json({
            weight: product.shipping?.weight ?? null,
            dimensions: product.shipping
                ? {
                    length: product.shipping.length,
                    width: product.shipping.width,
                    height: product.shipping.height,
                }
                : null,
            shippingFee,
            freeShipMin,
            estimatedDays,
            canShip: true,
            totalShippingFee,
            isFreeShip,
        });
    } catch (error) {
        logger.error("Get shipping info error", error as Error, {
            context: "shipping-api-get",
        });
        return NextResponse.json({ error: "Failed to fetch shipping info" }, { status: 500 });
    }
}

// POST /api/products/[slug]/shipping - Create/update shipping info (admin)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { slug } = await params;
        const body = await request.json();
        const { weight, length, width, height, freeShipMin, shippingFee, estimatedDays } = body;

        const product = await prisma.product.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const shipping = await prisma.productshipping.upsert({
            where: { productId: product.id },
            create: {
                productId: product.id,
                weight,
                length,
                width,
                height,
                freeShipMin: freeShipMin ?? FREE_SHIPPING_THRESHOLD_USD,
                shippingFee: shippingFee ?? DEFAULT_SHIPPING_FEE_USD,
                estimatedDays: estimatedDays ?? 3,
            },
            update: {
                ...(weight !== undefined && { weight }),
                ...(length !== undefined && { length }),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...(freeShipMin !== undefined && { freeShipMin }),
                ...(shippingFee !== undefined && { shippingFee }),
                ...(estimatedDays !== undefined && { estimatedDays }),
            },
        });

        logger.info("Shipping info updated", {
            shippingId: shipping.id,
            productId: product.id,
            userId: String(Number(session.user.id)),
        });

        return NextResponse.json(shipping);
    } catch (error) {
        logger.error("Update shipping info error", error as Error, {
            context: "shipping-api-post",
        });
        return NextResponse.json({ error: "Failed to update shipping info" }, { status: 500 });
    }
}


