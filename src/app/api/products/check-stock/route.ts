/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * POST /api/products/check-stock
 * Kiểm tra tồn kho trước khi đặt hàng (mid-checkout stock validation)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
interface StockCheckItem {
    productId: number;
    variantId: number | null;
    quantity: number;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const items: StockCheckItem[] = body.items || [];

        if (items.length === 0) {
            return NextResponse.json({ outOfStock: [] });
        }

        const outOfStock: Array<{ productId: number; name: string; available: number; requested: number }> = [];

        for (const item of items) {
            if (item.variantId) {
                // Check variant stock
                const variant = await prisma.productvariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: { select: { name: true } } },
                });

                if (!variant || variant.stock < item.quantity) {
                    outOfStock.push({
                        productId: item.productId,
                        name: variant?.product?.name || "Unknown product",
                        available: variant?.stock || 0,
                        requested: item.quantity,
                    });
                }
            } else {
                // Check product stock
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true, inventory: true },
                });

                if (!product || product.inventory < item.quantity) {
                    outOfStock.push({
                        productId: item.productId,
                        name: product?.name || "Unknown product",
                        available: product?.inventory || 0,
                        requested: item.quantity,
                    });
                }
            }
        }

        return NextResponse.json({ outOfStock });
    } catch (error) {
        logger.error("Stock check error", error as Error, { context: "products-check-stock-api" });
        return NextResponse.json(
            { error: "Failed to check stock" },
            { status: 500 }
        );
    }
}
