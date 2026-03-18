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

// GET /api/admin/products/[id] - Lấy chi tiết sản phẩm cho trang admin (không include reviews/flash sale nặng)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                productImages: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...product,
            images: product.productImages,
        });
    } catch (error) {
        logger.error("Admin product fetch error", error as Error, {
            context: "admin-product-get",
        });
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/products/[id] - Cập nhật sản phẩm từ trang admin
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const {
            name,
            nameEn,
            description,
            descriptionEn,
            price,
            originalPrice,
            salePrice,
            isOnSale,
            badgeText,
            badgeTextEn,
            tags,
            tagSlugs,
            category,
            categoryId,
            inventory,
            image,
            featured,
            weight,
            weightEn,
            isVisible,
            images: galleryImages,
        } = body;

        // Normalize numeric fields defensively
        const normalizeNumber = (val: unknown): number | null => {
            if (typeof val === "number" && Number.isFinite(val)) return val;
            if (typeof val === "string" && val.trim() !== "") {
                const parsed = Number.parseFloat(val);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return null;
        };

        const priceNumber = normalizeNumber(price);
        const originalPriceNumber = normalizeNumber(originalPrice);
        const salePriceNumber = normalizeNumber(salePrice);

        let inventoryNumber: number | null = null;
        if (typeof inventory === "number" && Number.isFinite(inventory)) {
            inventoryNumber = Math.trunc(inventory);
        } else if (typeof inventory === "string" && inventory.trim() !== "") {
            const parsed = Number.parseInt(inventory, 10);
            if (!Number.isNaN(parsed)) inventoryNumber = parsed;
        }

        const tagInputs: string[] = Array.isArray(tagSlugs)
            ? tagSlugs.map((t: unknown) => String(t)).map(t => t.trim()).filter(Boolean)
            : (typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : []);

        const updatedProduct = await prisma.$transaction(async (tx) => {
            // Resolve category mapping (admin can send categoryId or category name)
            let finalCategoryId: number | null | undefined = undefined;
            let finalCategoryName: string | undefined = undefined;
            if (typeof categoryId === "number" || (typeof categoryId === "string" && categoryId.trim())) {
                const catId = Number(categoryId);
                const c = await tx.category.findFirst({
                    where: { id: Number(catId), isActive: true },
                    select: { id: true, name: true },
                });
                if (c) {
                    finalCategoryId = c.id;
                    finalCategoryName = c.name;
                }
            } else if (typeof category === "string" && category.trim()) {
                // Keep legacy behavior (store name string) but also upsert Category row
                const catSlug = category.trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                const c = await tx.category.upsert({
                    where: { slug: catSlug || `cat-${String(id).slice(-6)}` },
                    update: { name: category.trim() },
                    create: { name: category.trim(), slug: catSlug || `cat-${String(id).slice(-6)}`, isActive: true, isVisible: true },
                    select: { id: true, name: true },
                });
                finalCategoryId = c.id;
                finalCategoryName = c.name;
            }

            // Update main product info
            const product = await tx.product.update({
                where: { id: Number(id) },
                data: {
                    ...(name && { name }),
                    ...(nameEn !== undefined && { nameEn: nameEn || null }),
                    // Không tự đổi slug khi đổi tên để tránh link cũ 404
                    ...(description && { description }),
                    ...(descriptionEn !== undefined && { descriptionEn: descriptionEn || null }),
                    ...(priceNumber !== null && { price: priceNumber }),
                    ...(originalPrice !== undefined && { originalPrice: originalPriceNumber }),
                    ...(salePrice !== undefined && { salePrice: salePriceNumber }),
                    ...(typeof isOnSale !== "undefined" && {
                        isOnSale: !!isOnSale && !!salePriceNumber,
                    }),
                    ...(badgeText !== undefined && { badgeText: badgeText || null }),
                    ...(badgeTextEn !== undefined && { badgeTextEn: badgeTextEn || null }),
                    ...(tags !== undefined && { tags: typeof tags === "string" ? tags : (tagInputs.length ? tagInputs.join(",") : null) }),
                    ...(finalCategoryName ? { category: finalCategoryName } : (category ? { category } : {})),
                    ...(finalCategoryId !== undefined ? { categoryId: Number(finalCategoryId) } : {}),
                    ...(inventoryNumber !== null && { inventory: inventoryNumber }),
                    ...(image !== undefined && { image: image || null }),
                    ...(typeof featured !== "undefined" && { featured }),
                    ...(weight !== undefined && { weight: weight || null }),
                    ...(weightEn !== undefined && { weightEn: weightEn || null }),
                    ...(typeof isVisible !== "undefined" && { isVisible: !!isVisible }),
                },
            });

            // Update gallery images if provided
            if (galleryImages && Array.isArray(galleryImages)) {
                // Filter out empty/invalid URLs
                const validImages = galleryImages.filter((url: string) => typeof url === 'string' && url.trim() !== '');

                await tx.productimage.deleteMany({
                    where: { productId: Number(id) },
                });

                if (validImages.length > 0) {
                    await tx.productimage.createMany({
                        data: validImages.map((url: string, index: number) => ({
                            productId: Number(id),
                            imageUrl: url.trim(),
                            order: index,
                            isPrimary: index === 0,
                        })),
                    });
                }
            }

            // Sync tags relation if provided
            if (tags !== undefined || tagSlugs !== undefined) {
                await tx.producttag.deleteMany({ where: { productId: Number(id) } });
                if (tagInputs.length > 0) {
                    const tagIds = await Promise.all(tagInputs.slice(0, 20).map(async (t) => {
                        const slug = t
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "");
                        const tag = await tx.tag.upsert({
                            where: { slug: slug || `tag-${String(id).slice(-6)}-${Math.random().toString(16).slice(2, 6)}` },
                            update: { name: t },
                            create: { name: t, slug: slug || `tag-${String(id).slice(-6)}-${Math.random().toString(16).slice(2, 6)}`, isActive: true },
                            select: { id: true },
                        });
                        return tag.id;
                    }));
                    await tx.producttag.createMany({
                        data: tagIds.map((tagId) => ({ productId: Number(id), tagId })),
                        skipDuplicates: true,
                    });
                }
            }

            return product;
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        logger.error("Admin product update error", error as Error, {
            context: "admin-product-put",
        });
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

