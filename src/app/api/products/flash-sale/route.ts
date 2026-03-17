/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET /api/products/flash-sale - Get products currently on flash sale
// Sources: (1) products with isOnSale=true, (2) active FlashSaleCampaign entries from admin
export async function GET() {
    try {
        const now = new Date();

        // Source 1: products with isOnSale flag set directly on the product
        const saleProducts = await prisma.product.findMany({
            where: {
                isOnSale: true,
                salePrice: { not: null },
                saleStartAt: { lte: now },
                saleEndAt: { gte: now },
                inventory: { gt: 0 }
            },
            include: {
                productImages: {
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { imageUrl: true }
                }
            },
            orderBy: [{ saleStartAt: 'desc' }, { createdAt: 'desc' }],
            take: 20
        });

        // Source 2: active FlashSaleCampaign records created via admin panel
        const activeCampaigns = await prisma.flashsalecampaign.findMany({
            where: {
                isActive: true,
                startAt: { lte: now },
                endAt: { gte: now }
            },
            include: {
                products: {
            include: { product: { include: { productImages: { orderBy: { order: "asc" }, take: 1, select: { imageUrl: true } } } } }
                }
            }
        });

        // Build a map of productId → flash sale info from campaigns (flash sale price + campaign end)
        type CampaignEntry = { flashSalePrice: number; endAt: Date; soldCount: number; stockLimit: number | null };
        const campaignMap = new Map<string, CampaignEntry>();
        for (const campaign of activeCampaigns) {
            for (const fp of campaign.products) {
                if (fp.product.inventory > 0 && !campaignMap.has(String(fp.productId))) {
                    campaignMap.set(String(fp.productId), {
                        flashSalePrice: fp.flashSalePrice,
                        endAt: campaign.endAt,
                        soldCount: fp.soldCount,
                        stockLimit: fp.stockLimit
                    });
                }
            }
        }

        // Merge: source-1 products (keep their salePrice/saleEndAt)
        const seenIds = new Set<number>();
        const merged: Array<{
            id: number; slug: string; name: string; originalPrice: number;
            salePrice: number | null; discount: number; image: string | null;
            category: string; inventory: number; soldCount: number;
            badgeText: string | null; saleEndAt: Date | null; isHot: boolean;
        }> = [];

        for (const p of saleProducts) {
            seenIds.add(p.id);
            const salePrice = campaignMap.get(String(p.id))?.flashSalePrice ?? p.salePrice;
            const endAt = campaignMap.get(String(p.id))?.endAt ?? p.saleEndAt;
            const discount = salePrice && p.price > 0
                ? Math.round(((p.price - salePrice) / p.price) * 100)
                : 0;
            merged.push({
                id: p.id, slug: p.slug || String(p.id), name: p.name,
                originalPrice: p.price, salePrice, discount,
                image: p.image || p.productImages?.[0]?.imageUrl || null, category: p.category,
                inventory: p.inventory,
                soldCount: campaignMap.get(String(p.id))?.soldCount ?? 0,
                badgeText: p.badgeText, saleEndAt: endAt,
                isHot: discount >= 30
            });
        }

        // Add campaign products not already in source-1
        for (const campaign of activeCampaigns) {
            for (const fp of campaign.products) {
                if (seenIds.has(fp.productId)) continue;
                if (fp.product.inventory <= 0) continue;
                seenIds.add(fp.productId);
                const p = fp.product;
                const discount = p.price > 0
                    ? Math.round(((p.price - fp.flashSalePrice) / p.price) * 100)
                    : 0;
                merged.push({
                    id: p.id, slug: p.slug || String(p.id), name: p.name,
                    originalPrice: p.price, salePrice: fp.flashSalePrice, discount,
                    image: p.image || p.productImages?.[0]?.imageUrl || null, category: p.category,
                    inventory: p.inventory, soldCount: fp.soldCount,
                    badgeText: p.badgeText, saleEndAt: campaign.endAt,
                    isHot: discount >= 30
                });
            }
        }

        // Earliest end time among all flash sale products for the countdown
        const endTimes = [
            ...saleProducts.filter(p => p.saleEndAt).map(p => p.saleEndAt!.getTime()),
            ...activeCampaigns.map(c => c.endAt.getTime())
        ];
        const nextEndTime = endTimes.length > 0 ? Math.min(...endTimes) : null;

        return NextResponse.json({
            products: merged.slice(0, 40),
            countdown: nextEndTime ? new Date(nextEndTime).toISOString() : null,
            total: merged.length
        });

    } catch (error) {
        logger.error('Flash sale error', error as Error, { context: 'flash-sale-get' });
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi lấy sản phẩm flash sale' },
            { status: 500 }
        );
    }
}

// POST /api/products/flash-sale - Set flash sale for a product (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId, salePrice, saleStartAt, saleEndAt, badgeText } = await request.json();

        if (!productId || salePrice === undefined) {
            return NextResponse.json(
                { error: 'productId và salePrice là bắt buộc' },
                { status: 400 }
            );
        }

        const product = await prisma.product.update({
            where: { id: Number(productId) },
            data: {
                salePrice: salePrice || null,
                saleStartAt: saleStartAt ? new Date(saleStartAt) : new Date(),
                saleEndAt: saleEndAt ? new Date(saleEndAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
                isOnSale: salePrice > 0,
                badgeText: badgeText || null
            }
        });

        return NextResponse.json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                salePrice: product.salePrice,
                isOnSale: product.isOnSale,
                saleStartAt: product.saleStartAt,
                saleEndAt: product.saleEndAt
            }
        });

    } catch (error) {
        logger.error('Set flash sale error', error as Error, { context: 'flash-sale-post' });
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi thiết lập flash sale' },
            { status: 500 }
        );
    }
}

