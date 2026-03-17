/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// POST /api/brands/seed - Seed sample brands (ADMIN only)
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const brands = [
            {
                name: "LIKEFOOD Premium",
                slug: "likefood-premium",
                logo: "/images/brands/likefood.png"
            },
            {
                name: "Đặc Sản Châu Đốc",
                slug: "dac-san-chau-doc",
                logo: "/images/brands/chau-doc.png"
            },
            {
                name: "Làng nghề Phan Thiết",
                slug: "lang-nghe-phan-thiet",
                logo: "/images/brands/phan-thiet.png"
            },
            {
                name: "Phú Quốc Authentic",
                slug: "phu-quoc-authentic",
                logo: "/images/brands/phu-quoc.png"
            },
            {
                name: "Miền Tây Xanh",
                slug: "mien-tay-xanh",
                logo: "/images/brands/mien-tay.png"
            },
            {
                name: "Cà Mau Seafood",
                slug: "ca-mau-seafood",
                logo: "/images/brands/ca-mau.png"
            }
        ];

        const results: { name: string; slug: string; logo: string; status: string }[] = [];

        for (const brand of brands) {
            const existing = await prisma.brand.findUnique({
                where: { slug: brand.slug }
            });

            if (existing) {
                results.push({ ...brand, status: 'exists' });
                continue;
            }

            await prisma.brand.create({ data: brand });
            results.push({ ...brand, status: 'created' });
        }

        return NextResponse.json({
            success: true,
            results,
            message: 'Brands seeded successfully!'
        });

    } catch (error: unknown) {
        logger.error("Seed brands error", error as Error, { context: "brands-seed-api" });
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// GET /api/brands/seed - List all brands (ADMIN only)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { products: true } }
            }
        });

        return NextResponse.json({ brands });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
