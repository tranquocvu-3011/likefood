/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 *
 * Product API helpers — extracted from route.ts for maintainability (C-7)
 */

import prisma from "@/lib/prisma";

// ─── Category Filter ─────────────────────────────────────────────────────

export type CategoryFilter =
    | { mode: "tagsContains"; value: string }
    | { mode: "categoryNameIn"; value: string[] }
    | { mode: "categoryId"; value: string }
    | { mode: "categoryName"; value: string };

/**
 * Resolve a raw category query parameter into a structured filter.
 * Handles legacy aliases (gifts, seafood), Category table lookup, and string fallback.
 */
export async function resolveCategoryFilter(categoryParam: string): Promise<CategoryFilter | null> {
    const raw = categoryParam.trim();
    if (!raw) return null;

    // Special legacy aliases supported in UI
    if (raw === "gifts") return { mode: "tagsContains", value: "gift" };
    if (raw === "seafood") return { mode: "categoryNameIn", value: ["Cá khô", "Tôm & Mực khô"] };

    const cat = await prisma.category.findFirst({
        where: {
            OR: [...(Number.isFinite(Number(raw)) ? [{ id: Number(raw) }] : []), { slug: raw },
                { name: raw },
            ],
            isActive: true,
            isVisible: true,
        },
        select: { id: true, name: true, slug: true },
    });

    if (cat) return { mode: "categoryId", value: String(cat.id)};

    // Fallback for legacy category string
    return { mode: "categoryName", value: raw };
}

// ─── Tag Resolution ──────────────────────────────────────────────────────

/**
 * Resolve comma-separated tag slugs/names into Tag IDs.
 */
export async function resolveTagSlugsOrNames(tagsParam: string): Promise<number[]> {
    const list = tagsParam
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 20);

    if (list.length === 0) return [];

    const tags = await prisma.tag.findMany({
        where: {
            isActive: true,
            OR: list.flatMap((q) => [{ slug: q }, { name: q }]),
        },
        select: { id: true, slug: true, name: true },
        take: 50,
    });

    // Keep original query order if possible
    const byKey = new Map<string, { id: number }>();
    for (const t of tags) {
        byKey.set(t.slug, { id: t.id });
        byKey.set(t.name, { id: t.id });
    }

    return list.map((q) => byKey.get(q)?.id).filter(Boolean) as number[];
}

// ─── Price Normalization ─────────────────────────────────────────────────

/**
 * Parse a numeric field that may arrive as string or number from request body.
 * Returns null if parsing fails or value is not a valid finite number.
 */
export function parseNumericField(value: unknown, integer = false): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return integer ? Math.trunc(value) : value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = integer ? Number.parseInt(value, 10) : Number.parseFloat(value);
        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
    }
    return null;
}

/**
 * Normalize product pricing, adding flash sale detection.
 */
export function normalizeProductPricing<T extends {
    price: number;
    originalPrice: number | null;
    salePrice: number | null;
    saleStartAt: Date | null;
    saleEndAt: Date | null;
    isOnSale: boolean;
}>(product: T, now: Date) {
    let currentPrice = product.price;
    let original = product.originalPrice ?? null;

    if (product.salePrice && product.salePrice < product.price) {
        currentPrice = product.salePrice;
        if (!original || original <= currentPrice) {
            original = product.price;
        }
    }

    const isFlashSale =
        product.isOnSale &&
        !!product.salePrice &&
        !!product.saleStartAt &&
        !!product.saleEndAt &&
        product.saleStartAt <= now &&
        product.saleEndAt >= now;

    return {
        ...product,
        price: currentPrice,
        originalPrice: original,
        isFlashSale,
    };
}
