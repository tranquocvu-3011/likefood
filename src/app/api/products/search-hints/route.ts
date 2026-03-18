/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 *
 * Search Hints API — smart autocomplete with:
 * - Vietnamese diacritics-insensitive search ("ca" → "Cá khô")
 * - Category + description search (not just name)
 * - Popular products boosted by soldCount
 * - Trending/popular suggestions when no results
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

/**
 * Strip Vietnamese diacritics for fuzzy matching
 * "Cá khô miền Tây" → "Ca kho mien Tay"
 */
function stripDiacritics(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

export async function GET(req: NextRequest) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60000, maxRequests: 60 });
        if (!rl.success) return NextResponse.json({ hints: [] }, { status: 429 });

        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();

        if (!q || q.length < 1) {
            return NextResponse.json({ hints: [] });
        }

        if (q.length > 100) {
            return NextResponse.json({ hints: [] });
        }

        const like = `%${q}%`;
        const likeLower = `%${q.toLowerCase()}%`;
        const strippedQuery = stripDiacritics(q.toLowerCase());
        const likeStripped = `%${strippedQuery}%`;

        // Strategy 1: Exact direct match with diacritics using BINARY collation (Accent-Sensitive & Case-Insensitive via LOWER)
        let products = await prisma.$queryRaw<Array<{
            id: number;
            name: string;
            category: string | null;
            price: number;
            image: string | null;
            slug: string;
        }>>(Prisma.sql`
            SELECT id, name, category, price, image, COALESCE(slug, CAST(id AS CHAR)) AS slug
            FROM product
            WHERE
                LOWER(name) COLLATE utf8mb4_bin LIKE ${likeLower}
            AND inventory > 0
            AND isDeleted = 0
            AND isVisible = 1
            ORDER BY 
                CASE WHEN LOWER(name) COLLATE utf8mb4_bin LIKE ${`${q.toLowerCase()}%`} THEN 0 ELSE 1 END,
                soldCount DESC
            LIMIT 10
        `);

        // Detect if query contains Vietnamese diacritics
        const hasDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(q);

        // Strategy 2: Fuzzy fallback — ONLY IF NO DIACRITICS IN QUERY (User typed "ca kho", not "cá khô")
        if (products.length === 0 && !hasDiacritics && q.length >= 2) {
            products = await prisma.$queryRaw<Array<{
                id: number;
                name: string;
                category: string | null;
                price: number;
                image: string | null;
                slug: string;
            }>>(Prisma.sql`
                SELECT id, name, category, price, image, COALESCE(slug, CAST(id AS CHAR)) AS slug
                FROM product
                WHERE
                    name COLLATE utf8mb4_general_ci LIKE ${like}
                AND inventory > 0
                AND isDeleted = 0
                AND isVisible = 1
                ORDER BY soldCount DESC
                LIMIT 10
            `);
        }

        // Strategy 3: If still no results, try popular products as suggestions
        if (products.length === 0 && q.length >= 2) {
            products = await prisma.$queryRaw<Array<{
                id: number;
                name: string;
                category: string | null;
                price: number;
                image: string | null;
                slug: string;
            }>>(Prisma.sql`
                SELECT id, name, category, price, image, COALESCE(slug, CAST(id AS CHAR)) AS slug
                FROM product
                WHERE inventory > 0
                AND isDeleted = 0
                AND isVisible = 1
                ORDER BY soldCount DESC
                LIMIT 6
            `);
        }

        const res = NextResponse.json({ hints: products });
        res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
        return res;
    } catch {
        return NextResponse.json({ hints: [] });
    }
}
