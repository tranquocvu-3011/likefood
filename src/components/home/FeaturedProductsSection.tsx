/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";

const FeaturedStickyShowcase = dynamic(
    () => import("@/components/shared/FeaturedStickyShowcase"),
    { ssr: true }
);

export default async function FeaturedProductsSection() {
    let rawProducts: Array<{
        id: number;
        slug: string | null;
        name: string;
        price: number;
        originalPrice: number | null;
        salePrice: number | null;
        isOnSale: boolean | null;
        image: string | null;
        category: string;
        productImages?: Array<{ imageUrl: string }>;
    }> = [];

    try {
        rawProducts = await prisma.product.findMany({
            where: { featured: true, inventory: { gt: 0 } },
            select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                originalPrice: true,
                salePrice: true,
                isOnSale: true,
                image: true,
                category: true,
                productImages: {
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { imageUrl: true }
                },
            },
            orderBy: [{ isOnSale: "desc" }, { originalPrice: "desc" }, { createdAt: "desc" }, { id: "asc" }],
            take: 8,
        });

        if (rawProducts.length === 0) {
            rawProducts = await prisma.product.findMany({
                where: { inventory: { gt: 0 } },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    price: true,
                    originalPrice: true,
                    salePrice: true,
                    isOnSale: true,
                    image: true,
                    category: true,
                    productImages: {
                        orderBy: { order: "asc" },
                        take: 1,
                        select: { imageUrl: true }
                    },
                },
                orderBy: [{ isOnSale: "desc" }, { originalPrice: "desc" }, { createdAt: "desc" }, { id: "asc" }],
                take: 8,
            });
        }
    } catch (error) {
        console.error("FeaturedProductsSection fetch error:", error);
        // Return empty array instead of null to allow parent to handle gracefully
        return <FeaturedStickyShowcase products={[]} />;
    }

    if (rawProducts.length === 0) {
        // Return empty showcase instead of silent null
        return <FeaturedStickyShowcase products={[]} />;
    }

    const products = rawProducts.map((p) => {
        const hasSalePrice = !!(p.salePrice && p.salePrice > 0 && p.salePrice < p.price);
        const useSale = !!p.isOnSale && hasSalePrice;
        const currentPrice = useSale ? (p.salePrice as number) : p.price;
        const basePrice = p.originalPrice && p.originalPrice > currentPrice
            ? p.originalPrice
            : useSale
                ? p.price
                : undefined;

        return {
            id: p.id,
            slug: String(p.slug || p.id),
            name: p.name,
            price: currentPrice,
            basePrice,
            image: p.image || p.productImages?.[0]?.imageUrl || undefined,
            category: p.category,
            colorLabel: p.category,
        };
    });

    return <FeaturedStickyShowcase products={products} />;
}
