/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { z } from "zod";

const brandCreateSchema = z.object({
    name: z.string().min(2, "Tên thương hiệu tối thiểu 2 ký tự").max(100, "Tên thương hiệu tối đa 100 ký tự"),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
    logo: z.string().url("Logo phải là URL hợp lệ").max(500).optional().nullable(),
});

// GET /api/brands - List all brands
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const activeOnly = searchParams.get("active") !== "false";

        const brands = await prisma.brand.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        return NextResponse.json({
            brands: brands.map(b => ({
                id: b.id,
                name: b.name,
                slug: b.slug,
                logo: b.logo,
                isActive: b.isActive,
                productCount: b._count.products
            }))
        });

    } catch (error) {
        logger.error("Get brands error", error as Error, { context: "brands-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        );
    }
}

// POST /api/brands - Create brand (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== "ADMIN")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const parsed = brandCreateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { name, slug, logo } = parsed.data;

        // Check slug uniqueness
        const existing = await prisma.brand.findUnique({
            where: { slug }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Slug đã tồn tại" },
                { status: 400 }
            );
        }

        const brand = await prisma.brand.create({
            data: { name, slug, logo }
        });

        return NextResponse.json({
            success: true,
            brand
        });

    } catch (error) {
        logger.error("Create brand error", error as Error, { context: "brands-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        );
    }
}
