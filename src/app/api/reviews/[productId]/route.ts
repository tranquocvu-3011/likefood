/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getRatingBreakdown } from "@/lib/rating";
import { Prisma } from "../../../../generated/client";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

// GET /api/reviews/[productId] - Get reviews for a product with breakdown
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
) {
    const identifier = getRateLimitIdentifier(request);
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    try {
        const { productId } = await params;
        const productIdNum = Number(productId);
        const searchParams = request.nextUrl.searchParams;
        const hasMedia = searchParams.get("hasMedia") === "true";
        const rating = searchParams.get("rating");
        const sort = searchParams.get("sort") || "newest";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.reviewWhereInput = {
            productId: Number(productIdNum),
            status: "APPROVED"
        };

        if (rating) {
            where.rating = Number.parseInt(rating, 10);
        }

        if (hasMedia) {
            where.media = { some: {} };
        }

        // Sort order
        let orderBy: Prisma.reviewOrderByWithRelationInput = { createdAt: 'desc' };
        if (sort === "rating-high") {
            orderBy = { rating: 'desc' };
        } else if (sort === "rating-low") {
            orderBy = { rating: 'asc' };
        }

        // Get reviews and breakdown
        const [reviews, total, breakdown, product] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, image: true }
                    },
                    media: {
                        orderBy: { order: 'asc' }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.review.count({ where }),
            getRatingBreakdown(Number(productId)),
            prisma.product.findUnique({
                where: { id: Number(productId) },
                select: { ratingAvg: true, ratingCount: true }
            })
        ]);

        return NextResponse.json({
            reviews,
            rating: {
                average: product?.ratingAvg || 0,
                count: product?.ratingCount || 0,
                breakdown: breakdown.breakdown,
                percentages: breakdown.percentages
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error("Get product reviews error", error as Error);
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        );
    }
}
