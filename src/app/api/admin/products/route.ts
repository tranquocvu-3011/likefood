/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "@/generated/client";

const DEFAULT_PAGE_SIZE = 20;

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (
        !session ||
        (session.user.role !== "ADMIN")
    ) {
        return null;
    }
    return session;
}

// GET /api/admin/products - Admin product list (includes hidden products)
export async function GET(request: NextRequest) {
    const session = await requireAdmin();
    if (!session)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10))
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const stock = searchParams.get("stock") ?? "ALL";
    const visibility = searchParams.get("visibility") ?? "ALL";

    try {
        const where: Prisma.productWhereInput = { isDeleted: false };
        const andConditions: Prisma.productWhereInput[] = [];

        // Visibility filter (admin can see all, or filter by visible/hidden)
        if (visibility === "VISIBLE") where.isVisible = true;
        else if (visibility === "HIDDEN") where.isVisible = false;
        // "ALL" → no isVisible filter (admin sees everything)

        // Full-text search across name, description, category
        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                    { category: { contains: search } },
                    { badgeText: { contains: search } },
                ],
            });
        }

        // Category filter — supports categoryId (UUID), slug, or name
        if (category) {
            andConditions.push({
                OR: [
                    { categoryId: Number(category) },
                    { category: category },
                    { categoryRel: { slug: category } },
                    { categoryRel: { name: category } },
                ],
            });
        }

        // Stock status filter
        if (stock === "OUT_OF_STOCK") where.inventory = { lte: 0 };
        else if (stock === "LOW_STOCK") where.inventory = { gt: 0, lt: 10 };
        else if (stock === "IN_STOCK") where.inventory = { gt: 0 };

        if (andConditions.length > 0) where.AND = andConditions;

        // Sort mapping
        const orderBy: Prisma.productOrderByWithRelationInput =
            sort === "name"
                ? { name: "asc" }
                : sort === "price-asc"
                  ? { price: "asc" }
                  : sort === "price-desc"
                    ? { price: "desc" }
                    : sort === "best-selling"
                      ? { soldCount: "desc" }
                      : { createdAt: "desc" }; // default: newest

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    price: true,
                    originalPrice: true,
                    salePrice: true,
                    category: true,
                    weight: true,
                    inventory: true,
                    soldCount: true,
                    ratingAvg: true,
                    ratingCount: true,
                    image: true,
                    featured: true,
                    isVisible: true,
                    isOnSale: true,
                    badgeText: true,
                    createdAt: true,
                    categoryRel: {
                        select: { id: true, name: true, slug: true },
                    },
                },
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Admin products list error", error as Error, {
            context: "admin-products-get",
        });
        return NextResponse.json(
            { error: "Lỗi khi lấy danh sách sản phẩm" },
            { status: 500 }
        );
    }
}
