/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../generated/client";

type CategoryFilter =
    | { mode: "tagsContains"; value: string }
    | { mode: "categoryNameIn"; value: string[] }
    | { mode: "categoryId"; value: string }
    | { mode: "categoryName"; value: string };

async function resolveCategoryFilter(categoryParam: string) {
    const raw = categoryParam.trim();
    if (!raw) return null;

    // Special legacy aliases supported in UI
    if (raw === "gifts") return { mode: "tagsContains", value: "gift" } satisfies CategoryFilter;
    if (raw === "seafood") return { mode: "categoryNameIn", value: ["Cá khô", "Tôm & Mực khô"] } satisfies CategoryFilter;

    const cat = await prisma.category.findFirst({
        where: {
            OR: [...(Number.isFinite(Number(raw)) ? [{ id: Number(raw) }] : []), { slug: raw },
                { name: raw },
            ],
            isActive: true,
            isVisible: true,
        },
        select: { id: true, name: true, slug: true },
    });

    if (cat) return { mode: "categoryId", value: String(cat.id)} satisfies CategoryFilter;

    // Fallback for legacy category string
    return { mode: "categoryName", value: raw } satisfies CategoryFilter;
}

async function resolveTagSlugsOrNames(tagsParam: string) {
    const list = tagsParam
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 20);

    if (list.length === 0) return [];

    const tags = await prisma.tag.findMany({
        where: {
            isActive: true,
            OR: list.flatMap((q) => [{ slug: q }, { name: q }]),
        },
        select: { id: true, slug: true, name: true },
        take: 50,
    });

    // Keep original query order if possible
    const byKey = new Map<string, { id: number }>();
    for (const t of tags) {
        byKey.set(t.slug, { id: t.id });
        byKey.set(t.name, { id: t.id });
    }

    return list.map((q) => byKey.get(q)?.id).filter(Boolean) as number[];
}

// GET all products with search, filter, pagination
export async function GET(req: Request) {
    try {
        // API-01: Validate query parameters with Zod schema
        const { searchParams } = new URL(req.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const { productQuerySchema } = await import('@/lib/validations/product');
        const { validationErrorResponse } = await import('@/lib/validations/utils');
        const validationResult = productQuerySchema.safeParse(queryParams);

        if (!validationResult.success) {
            return NextResponse.json(
                validationErrorResponse(validationResult.error),
                { status: 400 }
            );
        }

        const {
            search,
            category,
            minPrice,
            maxPrice,
            featured,
            inStock,
            ratingGte,
            tags,
            freeShipping,
            sort,
            page,
            limit
        } = validationResult.data;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.productWhereInput = {};
        const andConditions: Prisma.productWhereInput[] = [];

        // Storefront visibility constraints
        where.isDeleted = false;
        where.isVisible = true;

        if (search) {
            // Search by product name only
            // LOWER() + utf8mb4_bin for accent-sensitive + case-insensitive
            const like = `%${search}%`;
            const likeLower = `%${search.toLowerCase()}%`;

            // Detect if query contains Vietnamese diacritics
            const hasDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(search);

            const matched = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
                SELECT id FROM product
                WHERE (
                    LOWER(name) COLLATE utf8mb4_bin LIKE ${likeLower}
                    OR searchKeywords LIKE ${likeLower}
                )
                AND isDeleted = 0 AND isVisible = 1
            `);

            if (matched.length === 0 && !hasDiacritics) {
                // Fuzzy fallback: accent-insensitive (handles 'ca kho' → 'Cá khô')
                const fuzzyMatched = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
                    SELECT id FROM product
                    WHERE (
                        name COLLATE utf8mb4_general_ci LIKE ${like}
                        OR slug LIKE ${like}
                        OR searchKeywords LIKE ${like}
                    )
                    AND isDeleted = 0 AND isVisible = 1
                    LIMIT 50
                `);

                if (fuzzyMatched.length === 0) {
                    return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
                }
                andConditions.push({ id: { in: fuzzyMatched.map(r => r.id) } });
            } else if (matched.length === 0) {
                // Query has diacritics but no results — return empty
                return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
            } else {
                andConditions.push({ id: { in: matched.map(r => r.id) } });
            }
        }

        if (category && category !== "Tất cả" && category !== "All Categories") {
            const resolved = await resolveCategoryFilter(category);
            if (resolved) {
                if (resolved.mode === "tagsContains") {
                    andConditions.push({
                        OR: [
                            { tags: { contains: resolved.value } },
                            { badgeText: { contains: resolved.value } },
                            { productTags: { some: { tag: { slug: resolved.value } } } },
                        ],
                    });
                }
                if (resolved.mode === "categoryNameIn") {
                    andConditions.push({
                        OR: [
                            { category: { in: resolved.value } },
                            { categoryRel: { is: { name: { in: resolved.value } } } },
                        ],
                    });
                }
                if (resolved.mode === "categoryId") {
                    andConditions.push({ categoryId: Number(resolved.value)});
                }
                if (resolved.mode === "categoryName") {
                    andConditions.push({ category: resolved.value });
                }
            }
        }

        // Price filtering is done at application level AFTER normalizing sale prices
        // This ensures we filter by the actual displayed price (discounted), not the original DB price

        if (featured) {
            where.featured = true;
        }

        if (inStock) {
            where.inventory = { gt: 0 };
        }

        if (ratingGte) {
            where.ratingAvg = { gte: ratingGte };
        }

        if (tags) {
            const tagIds = await resolveTagSlugsOrNames(tags);
            if (tagIds.length > 0) {
                andConditions.push({
                    productTags: { some: { tagId: { in: tagIds } } },
                });
            } else {
                // Fallback to legacy CSV contains if Tag table not seeded for some reason
                const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
                if (tagList.length > 0) {
                    andConditions.push(...tagList.map(tag => ({
                        tags: { contains: tag }
                    })));
                }
            }
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        // Build orderBy
        let orderBy: Prisma.productOrderByWithRelationInput = {};
        switch (sort) {
            case "price-asc":
                orderBy = { price: "asc" };
                break;
            case "price-desc":
                orderBy = { price: "desc" };
                break;
            case "best-selling":
                orderBy = { soldCount: "desc" };
                break;
            case "top-rated":
                orderBy = { ratingAvg: "desc" };
                break;
            case "name":
                orderBy = { name: "asc" };
                break;
            case "newest":
            default:
                orderBy = { createdAt: "desc" };
                break;
        }

        // When price filter is active, we need to fetch ALL matching products first,
        // normalize prices, then filter and paginate at application level
        const hasPriceFilter = !!(minPrice || maxPrice);

        const productSelect = {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            price: true,
            originalPrice: true,
            salePrice: true,
            saleStartAt: true,
            saleEndAt: true,
            isOnSale: true,
            badgeText: true,
            badgeTextEn: true,
            image: true,
            category: true,
            categoryId: true,
            weight: true,
            weightEn: true,
            description: true,
            descriptionEn: true,
            inventory: true,
            featured: true,
            tags: true,
            isVisible: true,
            ratingAvg: true,
            ratingCount: true,
            soldCount: true,
            createdAt: true,
            categoryRel: {
                select: { id: true, name: true, nameEn: true, slug: true },
            },
            productImages: {
                orderBy: { order: "asc" } as const,
                take: 1,
                select: { imageUrl: true }
            },
        };

        // Get products and total count
        let products;
        let total: number;

        if (hasPriceFilter) {
            // Fetch all products (no pagination at DB level) so we can filter by normalized price
            products = await prisma.product.findMany({
                where,
                orderBy,
                select: productSelect,
            });
            total = 0; // Will be set after price filtering
        } else {
            [products, total] = await Promise.all([
                prisma.product.findMany({
                    where,
                    orderBy,
                    skip,
                    take: limit,
                    select: productSelect,
                }),
                prisma.product.count({ where }),
            ]);
        }

        // If free shipping filter is enabled, check for active shipping vouchers
        let filteredProducts = products;
        if (freeShipping) {
            const now = new Date();
            const shippingCoupons = await prisma.coupon.findMany({
                where: {
                    category: "shipping",
                    isActive: true,
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
                select: { id: true },
            });

            // For simplicity, if there are active shipping vouchers, show all products
            // In a more complex system, you'd check per-product eligibility
            // For now, we'll just return all products if shipping vouchers exist
            if (shippingCoupons.length === 0) {
                filteredProducts = [];
            }
        }

        // Normalize pricing + add flash sale flag to products
        const now = new Date();
        const normalizedProducts = filteredProducts.map((p) => {
            // Determine current price vs original
            let currentPrice = p.price;
            let original = p.originalPrice ?? null;

            if (p.salePrice && p.salePrice < p.price) {
                currentPrice = p.salePrice;
                if (!original || original <= currentPrice) {
                    original = p.price;
                }
            }

            const isFlashSale =
                p.isOnSale &&
                !!p.salePrice &&
                !!p.saleStartAt &&
                !!p.saleEndAt &&
                p.saleStartAt <= now &&
                p.saleEndAt >= now;

            return {
                ...p,
                categoryEn: (p as unknown as { categoryRel?: { nameEn?: string | null } }).categoryRel?.nameEn || null,
                image: p.image || p.productImages?.[0]?.imageUrl || null,
                price: currentPrice,
                originalPrice: original,
                isFlashSale,
            };
        });

        // Apply price filter on NORMALIZED (discounted) price
        let finalProducts = normalizedProducts;
        let finalTotal = freeShipping ? filteredProducts.length : total;

        if (hasPriceFilter) {
            finalProducts = normalizedProducts.filter((p) => {
                if (minPrice && p.price < minPrice) return false;
                if (maxPrice && p.price > maxPrice) return false;
                return true;
            });
            finalTotal = finalProducts.length;
            // Apply pagination at application level
            finalProducts = finalProducts.slice(skip, skip + limit);
        }

        // Add cache-control header
        const response = NextResponse.json({
            products: finalProducts,
            pagination: {
                page,
                limit,
                total: finalTotal,
                totalPages: Math.ceil(finalTotal / limit),
            },
        });

        // Realtime storefront: do not cache list responses (Admin changes must reflect immediately)
        response.headers.set('Cache-Control', 'no-store');

        return response;
    } catch (error) {
        logger.error("Failed to fetch products", error as Error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

// POST new product
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
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
            weight,
            weightEn,
            image,
            featured,
            isVisible,
            images: galleryImages,
        } = body;

        // Normalize numeric fields defensively
        let priceNumber = 0;
        if (typeof price === "number" && Number.isFinite(price)) {
            priceNumber = price;
        } else if (typeof price === "string" && price.trim() !== "") {
            const parsed = Number.parseFloat(price);
            if (!Number.isNaN(parsed)) priceNumber = parsed;
        }

        let inventoryNumber = 0;
        if (typeof inventory === "number" && Number.isFinite(inventory)) {
            inventoryNumber = Math.trunc(inventory);
        } else if (typeof inventory === "string" && inventory.trim() !== "") {
            const parsed = Number.parseInt(inventory, 10);
            if (!Number.isNaN(parsed)) inventoryNumber = parsed;
        }

        // Normalize optional pricing fields
        let originalPriceNumber: number | null = null;
        if (typeof originalPrice === "number" && Number.isFinite(originalPrice)) {
            originalPriceNumber = originalPrice;
        } else if (typeof originalPrice === "string" && originalPrice.trim() !== "") {
            const parsed = Number.parseFloat(originalPrice);
            if (!Number.isNaN(parsed)) originalPriceNumber = parsed;
        }

        let salePriceNumber: number | null = null;
        if (typeof salePrice === "number" && Number.isFinite(salePrice)) {
            salePriceNumber = salePrice;
        } else if (typeof salePrice === "string" && salePrice.trim() !== "") {
            const parsed = Number.parseFloat(salePrice);
            if (!Number.isNaN(parsed)) salePriceNumber = parsed;
        }

        const slug = generateSlug(name);

        // Resolve category (prefer id, then name)
        let finalCategoryId: number | null = null;
        let finalCategoryName: string = category;
        if (typeof categoryId === "string" && categoryId.trim()) {
            const existing = await prisma.category.findFirst({
                where: { id: Number(categoryId.trim()), isActive: true },
                select: { id: true, name: true },
            });
            if (existing) {
                finalCategoryId = existing.id;
                finalCategoryName = existing.name;
            }
        }
        if (!finalCategoryId && typeof category === "string" && category.trim()) {
            const catSlug = category.trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            const cat = await prisma.category.upsert({
                where: { slug: catSlug || `cat-${slug}` },
                update: { name: category.trim() },
                create: { name: category.trim(), slug: catSlug || `cat-${slug}`, isActive: true, isVisible: true },
                select: { id: true, name: true },
            });
            finalCategoryId = cat.id;
            finalCategoryName = cat.name;
        }

        // Resolve tags into Tag table (best-effort)
        const tagInputs: string[] = Array.isArray(tagSlugs)
            ? tagSlugs.map((t: unknown) => String(t)).map(t => t.trim()).filter(Boolean)
            : (typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : []);

        const product = await prisma.product.create({
            data: {
                name,
                nameEn: nameEn || null,
                slug,
                description,
                descriptionEn: descriptionEn || null,
                price: priceNumber,
                originalPrice: originalPriceNumber,
                salePrice: salePriceNumber,
                isOnSale: !!isOnSale && !!salePriceNumber,
                badgeText: badgeText ?? null,
                badgeTextEn: badgeTextEn || null,
                tags: typeof tags === "string" ? tags : (tagInputs.length ? tagInputs.join(",") : null),
                category: finalCategoryName,
                categoryId: finalCategoryId,
                weight: weight || null,
                weightEn: weightEn || null,
                inventory: inventoryNumber,
                image: image || null,
                featured: featured || false,
                isVisible: typeof isVisible === "boolean" ? isVisible : true,
                // Add gallery images if provided
                ...(galleryImages && Array.isArray(galleryImages) && galleryImages.length > 0 && {
                    productImages: {
                        create: galleryImages.map((url: string, index: number) => ({
                            imageUrl: url,
                            order: index,
                            isPrimary: false
                        }))
                    }
                })
            },
            include: {
                productImages: true
            }
        });

        if (tagInputs.length > 0) {
            const createdTags = await Promise.all(tagInputs.slice(0, 20).map(async (t) => {
                const slug = t
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                const tag = await prisma.tag.upsert({
                    where: { slug: slug || `tag-${String(product.id).slice(-6)}-${Math.random().toString(16).slice(2, 6)}` },
                    update: { name: t },
                    create: { name: t, slug: slug || `tag-${String(product.id).slice(-6)}-${Math.random().toString(16).slice(2, 6)}` },
                    select: { id: true },
                });
                return tag.id;
            }));
            await prisma.producttag.createMany({
                data: createdTags.map((tagId) => ({ productId: product.id, tagId })),
                skipDuplicates: true,
            });
        }

        return NextResponse.json({
            ...product,
            images: product.productImages
        });
    } catch (error) {
        logger.error("Product creation error", error as Error, { context: "products-api-post" });
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}

// DELETE product
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.product.update({
            where: { id: Number(id) },
            data: { isDeleted: true, deletedAt: new Date(), isVisible: false },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch {
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}

