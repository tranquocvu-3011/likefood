/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

// GET user's wishlist
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const rateLimitId = session?.user?.id ? `user:${session.user.id}` : getRateLimitIdentifier(req);
    const rl = await applyRateLimit(rateLimitId, apiRateLimit, { windowMs: 60000, maxRequests: 30 });
    if (!rl.success) return rl.error!;

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEn = req.cookies.get("language")?.value === "en";

    try {
        const wishlist = await prisma.wishlist.findMany({
            where: {
                userId: Number(session.user.id),
            },
            take: 200,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        nameEn: true,
                        slug: true,
                        price: true,
                        salePrice: true,
                        image: true,
                        category: true,
                        categoryRel: {
                            select: {
                                name: true,
                                nameEn: true,
                            },
                        },
                        inventory: true,
                        ratingAvg: true,
                        productImages: {
                            orderBy: { order: "asc" },
                            take: 1,
                            select: { imageUrl: true }
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(wishlist.map(item => {
            const localizedName = isEn && item.product.nameEn ? item.product.nameEn : item.product.name;
            const localizedCategory = item.product.categoryRel
                ? (isEn && item.product.categoryRel.nameEn
                    ? item.product.categoryRel.nameEn
                    : item.product.categoryRel.name)
                : item.product.category;

            return {
                ...item.product,
                name: localizedName,
                category: localizedCategory,
                image: item.product.image || item.product.productImages?.[0]?.imageUrl || null,
                productImages: undefined,
                categoryRel: undefined,
            };
        }));
    } catch (error) {
        logger.error("Wishlist fetch error", error as Error, { context: "user-wishlist-api-get", userId: String(Number(session?.user?.id))});
        return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
    }
}

// POST add to wishlist
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: Number(productId) },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check if already in wishlist
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: Number(session.user.id),
                    productId: Number(productId),
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: "Product already in wishlist" }, { status: 400 });
        }

        // Add to wishlist
        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId: Number(session.user.id),
                productId,
            },
            include: {
                product: true,
            },
        });

        return NextResponse.json(wishlistItem.product, { status: 201 });
    } catch (error) {
        logger.error("Wishlist add error", error as Error, { context: "user-wishlist-api-post", userId: String(Number(session?.user?.id))});
        return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
    }
}

// DELETE remove from wishlist
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId: Number(session.user.id),
                    productId: Number(productId),
                },
            },
        });

        return NextResponse.json({ message: "Removed from wishlist" });
    } catch (error) {
        logger.error("Wishlist remove error", error as Error, { context: "user-wishlist-api-delete", userId: String(Number(session?.user?.id))});
        return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
    }
}
