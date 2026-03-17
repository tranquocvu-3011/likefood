/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
    const identifier = getRateLimitIdentifier(req);
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                isVisible: true,
            },
            include: {
                children: {
                    where: { isActive: true, isVisible: true },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { position: 'asc' },
        });

        const counts = await prisma.product.groupBy({
            by: ['categoryId'],
            where: {
                isDeleted: false,
                isVisible: true,
                categoryId: { not: null },
            },
            _count: { _all: true },
        });
        const countByCategoryId = new Map();
        for (const row of counts) {
            if (row.categoryId) countByCategoryId.set(row.categoryId, row._count._all);
        }

        // Also count legacy products (categoryId=null but category string set)
        // Match by category name → Category.name to include them in the count
        const legacyCounts = await prisma.product.groupBy({
            by: ['category'],
            where: {
                isDeleted: false,
                isVisible: true,
                categoryId: null,
            },
            _count: { _all: true },
        });

        // Build a flat name→id map across all categories (including children)
        const catNameToId = new Map();
        for (const c of categories) {
            catNameToId.set(c.name, c.id);
            for (const ch of (c.children ?? [])) {
                catNameToId.set(ch.name, ch.id);
            }
        }

        for (const row of legacyCounts) {
            if (!row.category) continue;
            const count = (row._count as { _all?: number } | undefined)?._all ?? 0;
            if (count === 0) continue;
            const catId = catNameToId.get(row.category);
            if (catId) {
                countByCategoryId.set(catId, (countByCategoryId.get(catId) ?? 0) + count);
            }
        }

        // Return a flattened shape similar to legacy, but richer.
        const payload = categories
            .filter((c) => c.name !== "Khác" && c.slug !== "khac")
            .map((c) => ({
                id: c.id,
                name: c.name,
                nameEn: c.nameEn,
                slug: c.slug,
                description: c.description,
                descriptionEn: c.descriptionEn,
                imageUrl: c.imageUrl,
                parentId: c.parentId,
                position: c.position,
                isVisible: c.isVisible,
                isActive: c.isActive,
                productCount: countByCategoryId.get(c.id) ?? 0,
                children: (c.children ?? []).filter((ch) => ch.name !== "Khác" && ch.slug !== "khac").map((ch) => ({
                    id: ch.id,
                    name: ch.name,
                    nameEn: ch.nameEn,
                    slug: ch.slug,
                    description: ch.description,
                    descriptionEn: ch.descriptionEn,
                    imageUrl: ch.imageUrl,
                    parentId: ch.parentId,
                    position: ch.position,
                    isVisible: ch.isVisible,
                    isActive: ch.isActive,
                    productCount: countByCategoryId.get(ch.id) ?? 0,
                })),
            }));

        const res = NextResponse.json(payload);
        // Realtime storefront: do not cache categories
        res.headers.set("Cache-Control", "no-store");
        return res;
    } catch (error) {
        logger.error('Failed to fetch categories', error as Error, { context: 'categories-api-get' });
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
