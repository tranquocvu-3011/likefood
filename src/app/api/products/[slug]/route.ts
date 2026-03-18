/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET single product by ID or Slug
export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug: identifier } = await params;
        const numId = Number(identifier);
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    ...(Number.isFinite(numId) ? [{ id: numId }] : []),
                    { slug: identifier },
                ],
                isDeleted: false,
                isVisible: true,
            },
            include: {
                categoryRel: true,
                productImages: {
                    orderBy: [
                        { isPrimary: "desc" },
                        { order: "asc" },
                    ],
                },
                productVariants: {
                    where: { isActive: true },
                    orderBy: { createdAt: "asc" },
                },
                specifications: {
                    orderBy: { order: "asc" },
                },
                shipping: true,
                productTags: {
                    include: { tag: true },
                },
                reviews: {
                    include: { user: { select: { name: true, image: true } } },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const productMetrics = product as unknown as {
            ratingAvg?: number | null;
            ratingCount?: number | null;
            originalPrice?: number | null;
            salePrice?: number | null;
            soldCount?: number | null;
        };

        const avgRating = productMetrics.ratingAvg ?? 0;
        const reviewCount = productMetrics.ratingCount ?? 0;

        // Legacy flash sale (product-level sale only)
        const now = new Date();
        const legacyFlashSale =
            product.isOnSale &&
            product.salePrice &&
            product.saleStartAt &&
            product.saleEndAt &&
            product.saleStartAt <= now &&
            product.saleEndAt >= now;


        const res = NextResponse.json({
            ...product,
            avgRating: Math.round((avgRating as number) * 10) / 10,
            reviewCount,
            images: product.productImages,
            variants: product.productVariants,
            tags: product.productTags?.map((pt) => pt.tag).filter(Boolean) ?? [],
            specifications: product.specifications ?? [],
            shipping: product.shipping ?? null,
            // Flash sale support (legacy product-level only for now)
            originalPrice: productMetrics.originalPrice || null,
            salePrice: productMetrics.salePrice || null,
            soldCount: productMetrics.soldCount || 0,
            isFlashSale: legacyFlashSale,
            saleStartAt: product.saleStartAt,
            saleEndAt: product.saleEndAt,
        });
        res.headers.set("Cache-Control", "no-store");
        return res;
    } catch (error) {
        logger.error("Product fetch error", error as Error, { context: "products-api-get" });
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

// PUT update product
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { slug: identifier } = await params;
        const body = await req.json();
        const {
            name,
            description,
            price,
            originalPrice,
            salePrice,
            isOnSale,
            badgeText,
            tags,
            category,
            inventory,
            image,
            weight,
            featured,
            images: galleryImages,
        } = body;

        // Find product first to get ID if identifier is slug
        const numIdPut = Number(identifier);
        const existingProduct = await prisma.product.findFirst({
            where: {
                OR: [
                    ...(Number.isFinite(numIdPut) ? [{ id: numIdPut }] : []),
                    { slug: identifier }
                ]
            }
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const id = existingProduct.id;

        // Map and normalize inventory
        let finalInventory = inventory as number | string | boolean | undefined;
        if (typeof finalInventory === 'boolean') {
            finalInventory = finalInventory ? 100 : 0;
        } else if (typeof finalInventory === 'string') {
            finalInventory = parseInt(finalInventory, 10) || 0;
        }

        // Normalize pricing fields
        const normalizeNumber = (val: unknown): number | null => {
            if (typeof val === 'number' && Number.isFinite(val)) return val;
            if (typeof val === 'string' && val.trim() !== '') {
                const parsed = Number.parseFloat(val);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return null;
        };

        const priceNumber = normalizeNumber(price);
        const originalPriceNumber = normalizeNumber(originalPrice);
        const salePriceNumber = normalizeNumber(salePrice);

        // Use transaction to update product and its gallery images
        await prisma.$transaction(async (tx) => {
            // Update main product info
            const product = await tx.product.update({
                where: { id: Number(id) },
                data: {
                    ...(name && { name }),
                    // Không tự đổi slug khi đổi tên để tránh link cũ 404
                    ...(description && { description }),
                    ...(priceNumber !== null && { price: priceNumber }),
                    ...(originalPrice !== undefined && { originalPrice: originalPriceNumber }),
                    ...(salePrice !== undefined && { salePrice: salePriceNumber }),
                    ...(typeof isOnSale !== 'undefined' && { isOnSale: !!isOnSale && !!salePriceNumber }),
                    ...(badgeText !== undefined && { badgeText: badgeText || null }),
                    ...(tags !== undefined && { tags: tags || null }),
                    ...(category && { category }),
                    ...(finalInventory !== undefined && { inventory: finalInventory as number }),
                    ...(image !== undefined && { image: image || null }),
                    ...(featured !== undefined && { featured }),
                    ...(weight !== undefined && { weight: weight || null }),
                },
            });

            // Update gallery images if provided
            if (galleryImages && Array.isArray(galleryImages)) {
                // Filter out empty/invalid URLs
                const validImages = galleryImages.filter((url: string) => typeof url === 'string' && url.trim() !== '');

                await tx.productimage.deleteMany({
                    where: { productId: Number(id) }
                });

                if (validImages.length > 0) {
                    await tx.productimage.createMany({
                        data: validImages.map((url: string, index: number) => ({
                            productId: Number(id),
                            imageUrl: url.trim(),
                            order: index,
                            isPrimary: index === 0
                        }))
                    });
                }
            }

            return product;
        });

        // Fetch the fully updated product with images to return
        const finalProduct = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                productImages: true,
                productVariants: true,
            }
        });

        if (!finalProduct) {
            return NextResponse.json({ error: "Product not found after update" }, { status: 404 });
        }

        return NextResponse.json({
            ...finalProduct,
            images: finalProduct.productImages,
            variants: finalProduct.productVariants
        });
    } catch (error) {
        logger.error("Product update error", error as Error, { context: "products-api-put" });
        return NextResponse.json({
            error: "Failed to update product",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
