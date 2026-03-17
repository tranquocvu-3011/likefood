/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/client";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

// GET /api/search/suggestions?q=abc — Returns product name suggestions for autocomplete
export async function GET(request: NextRequest) {
    try {
        const identifier = getRateLimitIdentifier(request);
        const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60000, maxRequests: 30 });
        if (!rl.success) return rl.error as unknown as NextResponse;

        const q = request.nextUrl.searchParams.get("q")?.trim();
        if (!q || q.length < 2) {
            return NextResponse.json([]);
        }
        // Prevent extremely long queries
        if (q.length > 100) {
            return NextResponse.json([]);
        }



        const like = `%${q}%`;
        const likeLower = `%${q.toLowerCase()}%`;

        // Detect if query contains Vietnamese diacritics
        const hasDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(q);

        // Primary: accent-sensitive + case-insensitive
        // LOWER() + utf8mb4_bin: "Cá" → "cá" matches "CÁ" → "cá" but NOT "CA" → "ca"
        let rawProducts = await prisma.$queryRaw<Array<{
            id: number;
            name: string;
            slug: string | null;
            category: string | null;
            price: number;
            salePrice: number | null;
            image: string | null;
        }>>(Prisma.sql`
            SELECT id, name, slug, category, price, salePrice, image
            FROM product
            WHERE LOWER(name) COLLATE utf8mb4_bin LIKE ${likeLower}
            AND inventory > 0
            AND isDeleted = 0
            AND isVisible = 1
            ORDER BY soldCount DESC
            LIMIT 8
        `);

        // Fuzzy fallback: only when query has NO diacritics (e.g. "ca kho" → "Cá khô")
        if (rawProducts.length === 0 && !hasDiacritics) {
            rawProducts = await prisma.$queryRaw<Array<{
                id: number;
                name: string;
                slug: string | null;
                category: string | null;
                price: number;
                salePrice: number | null;
                image: string | null;
            }>>(Prisma.sql`
                SELECT id, name, slug, category, price, salePrice, image
                FROM product
                WHERE name COLLATE utf8mb4_general_ci LIKE ${like}
                AND inventory > 0
                AND isDeleted = 0
                AND isVisible = 1
                ORDER BY soldCount DESC
                LIMIT 8
            `);
        }

        const products = rawProducts;

        const suggestions = products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.category,
            price: p.salePrice ?? p.price,
            image: p.image || null,
        }));

        const res = NextResponse.json(suggestions);
        res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
        return res;
    } catch (error) {
        logger.error("Search suggestions error", error as Error, { context: "search-suggestions-api" });
        return NextResponse.json([], { status: 500 });
    }
}
