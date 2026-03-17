/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAIRecommendations } from "@/services/ai-recommendation";

// GET related products
export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug: identifier } = await params;
        const product = await prisma.product.findFirst({
            where: { OR: [...(Number.isFinite(Number(identifier)) ? [{ id: Number(identifier) }] : []), { slug: identifier }]
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const id = product.id;

        // Get all products except current one, with fields needed for ProductCard UI
        const allProducts = await prisma.product.findMany({
            where: {
                id: { not: Number(id) },
            },
            select: {
                id: true,
                slug: true,
                name: true,
                category: true,
                description: true,
                price: true,
                originalPrice: true,
                salePrice: true,
                saleStartAt: true,
                saleEndAt: true,
                isOnSale: true,
                image: true,
                inventory: true,
                ratingAvg: true,
                ratingCount: true,
                soldCount: true,
                productImages: {
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { imageUrl: true }
                },
            },
        });

        // Use AI recommendation if available, otherwise fallback to same category
        let relatedProducts: typeof allProducts;
        try {
            const aiRecommended = await getAIRecommendations(product, allProducts);
            // Map AI results back to full product objects
            relatedProducts = allProducts.filter(p =>
                aiRecommended.some(r => r.id === p.id)
            );
        } catch (error) {
            logger.error("AI recommendation error", error as Error, { context: "products-slug-related-api" });
            // Fallback: get products from same category
            relatedProducts = allProducts
                .filter(p => p.category === product.category)
                .slice(0, 4);
        }

        // If not enough products, fill with random products
        if (relatedProducts.length < 4) {
            const remaining = allProducts
                .filter(p => !relatedProducts.some(rp => rp.id === p.id))
                .slice(0, 4 - relatedProducts.length);
            relatedProducts = [...relatedProducts, ...remaining];
        }

        // Decorate with flash sale flag for card badges / countdown
        const now = new Date();
        const decorated = relatedProducts.slice(0, 4).map((p) => ({
            ...p,
            image: p.image || p.productImages?.[0]?.imageUrl || null,
            isFlashSale:
                !!(
                    p.isOnSale &&
                    p.salePrice &&
                    p.saleStartAt &&
                    p.saleEndAt &&
                    p.saleStartAt <= now &&
                    p.saleEndAt >= now
                ),
        }));

        return NextResponse.json(decorated);
    } catch (error) {
        logger.error("Related products error", error as Error, { context: "products-slug-related-api" });
        return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
    }
}
