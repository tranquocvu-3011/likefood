/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/client";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60000, maxRequests: 30 });
        if (!rl.success) return NextResponse.json({ hints: [] }, { status: 429 });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";

        if (!q || q.length < 2) {
            return NextResponse.json({ hints: [] });
        }

        if (q.length > 100) {
            return NextResponse.json({ hints: [] });
        }

        // Search by product name only
        const like = `%${q}%`;
        const likeLower = `%${q.toLowerCase()}%`;

        // Detect if query contains Vietnamese diacritics
        const hasDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(q);

        // Primary: accent-sensitive + case-insensitive
        // LOWER() + utf8mb4_bin: "Cá" → "cá" matches "CÁ" → "cá" but NOT "CA" → "ca"
        let products = await prisma.$queryRaw<Array<{
            id: number;
            name: string;
            category: string | null;
            price: number;
            image: string | null;
            slug: string | null;
        }>>(Prisma.sql`
            SELECT id, name, category, price, image, slug
            FROM product
            WHERE LOWER(name) COLLATE utf8mb4_bin LIKE ${likeLower}
            AND inventory > 0
            AND isDeleted = 0
            AND isVisible = 1
            ORDER BY soldCount DESC
            LIMIT 8
        `);

        // Fuzzy fallback: only when query has NO diacritics (e.g. "ca kho" → "Cá khô")
        if (products.length === 0 && !hasDiacritics) {
            products = await prisma.$queryRaw<Array<{
                id: number;
                name: string;
                category: string | null;
                price: number;
                image: string | null;
                slug: string | null;
            }>>(Prisma.sql`
                SELECT id, name, category, price, image, slug
                FROM product
                WHERE name COLLATE utf8mb4_general_ci LIKE ${like}
                AND inventory > 0
                AND isDeleted = 0
                AND isVisible = 1
                ORDER BY soldCount DESC
                LIMIT 8
            `);
        }

        const res = NextResponse.json({ hints: products });
        res.headers.set("Cache-Control", "no-store");
        return res;
    } catch {
        return NextResponse.json({ hints: [] });
    }
}
