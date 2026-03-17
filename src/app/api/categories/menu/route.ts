/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * GET /api/categories/menu
 * Returns active categories with up to 4 real products each — used by MegaMenu.
 * Lightweight, cached response (60s stale-while-revalidate).
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
export const revalidate = 60; // ISR: revalidate every 60s

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true, isVisible: true, parentId: null },
            orderBy: { position: "asc" },
            select: { id: true, name: true, nameEn: true, slug: true },
            take: 8,
        });

        // Fetch up to 4 products per category in parallel
        const results = await Promise.all(
            categories.map(async (cat) => {
                const products = await prisma.product.findMany({
                    where: {
                        isDeleted: false,
                        isVisible: true,
                        OR: [
                            { categoryId: cat.id },
                            { category: cat.name },
                        ],
                    },
                    orderBy: [
                        { soldCount: "desc" },
                        { ratingAvg: "desc" },
                    ],
                    take: 4,
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        nameEn: true,
                        price: true,
                        salePrice: true,
                        originalPrice: true,
                        image: true,
                        productImages: {
                            orderBy: { order: "asc" },
                            take: 1,
                            select: { imageUrl: true }
                        },
                    },
                });

                return {
                    id: cat.id,
                    name: cat.name,
                    nameEn: cat.nameEn,
                    slug: cat.slug,
                    products: products.map(p => ({
                        ...p,
                        image: p.image || p.productImages?.[0]?.imageUrl || null,
                        productImages: undefined,
                    })),
                };
            })
        );

        // Only return categories that have at least 1 product
        const withProducts = results.filter((c) => c.products.length > 0);

        return NextResponse.json({ categories: withProducts });
    } catch (error) {
        logger.error("[CATEGORIES_MENU_GET]", error as Error, { context: "categories-menu-api" });
        return NextResponse.json({ categories: [] }, { status: 500 });
    }
}
