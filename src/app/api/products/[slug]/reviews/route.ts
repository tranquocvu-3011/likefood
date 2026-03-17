/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "../../../../../generated/client";
import { logger } from "@/lib/logger";

// GET reviews for a product
export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(req.url);
        const rating = searchParams.get("rating"); // filter by star
        const hasMedia = searchParams.get("has_media") === "true";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
        const skip = (page - 1) * limit;

        // Find product
        const product = await prisma.product.findFirst({
            where: { OR: [...(Number.isFinite(Number()) ? [{ id: Number() }] : []), {  }] },
            select: { id: true, ratingAvg: true, ratingCount: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 });
        }

        // Build where
        const where: Prisma.reviewWhereInput = { productId: product.id, status: "APPROVED" };
        if (rating) where.rating = Number.parseInt(rating, 10);
        if (hasMedia) {
            where.media = { some: {} };
        }

        // Get rating distribution
        const ratingDistribution = await prisma.review.groupBy({
            by: ["rating"],
            where: { productId: product.id, status: "APPROVED" },
            _count: { rating: true },
        });

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingDistribution.forEach((r) => {
            distribution[r.rating] = r._count.rating;
        });

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    media: true,
                    orderItem: {
                        select: {
                            nameSnapshot: true,
                            product: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        return NextResponse.json({
            reviews,
            summary: {
                average: product.ratingAvg,
                total: product.ratingCount,
                distribution,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Reviews fetch error", error as Error, { context: 'product-reviews-slug' });
        return NextResponse.json({ error: "Lỗi khi tải đánh giá" }, { status: 500 });
    }
}

// POST create review (verified purchase only)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const { slug } = await params;

    try {
        const body = await req.json();
        const { rating, comment, orderItemId, mediaUrls } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Đánh giá phải từ 1-5 sao" }, { status: 400 });
        }

        // Find product
        const product = await prisma.product.findFirst({
            where: { OR: [...(Number.isFinite(Number()) ? [{ id: Number() }] : []), {  }] },
            select: { id: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 });
        }

        // Verify purchase - user must have bought this product
        const purchasedItem = await prisma.orderitem.findFirst({
            where: {
                ...(orderItemId ? { id: Number(orderItemId) } : {}),
                productId: product.id,
                order: {
                    userId: Number(session.user.id),
                    status: { in: ["DELIVERED", "COMPLETED"] },
                },
            },
            include: { reviews: true },
        });

        if (!purchasedItem) {
            return NextResponse.json(
                { error: "Bạn cần mua sản phẩm này trước khi đánh giá" },
                { status: 403 }
            );
        }

        // C-01: Check if already reviewed this order item.
        // Allow re-submission if the previous review was REJECTED (soft-deleted by admin).
        const existingReview = purchasedItem.reviews;
        if (existingReview !== null && existingReview.status !== "REJECTED") {
            return NextResponse.json(
                { error: "Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi" },
                { status: 400 }
            );
        }

        const mediaCreatePayload = mediaUrls && mediaUrls.length > 0
            ? (mediaUrls as string[])
                .filter((url) => {
                    try {
                        const parsed = new URL(url);
                        return ["http:", "https:"].includes(parsed.protocol);
                    } catch {
                        return false;
                    }
                })
                .slice(0, 10) // max 10 media files per review
                .map((url, i) => ({
                    url,
                    type: /\.(mp4|webm|mov)$/i.test(url) ? "video" : "image",
                    order: i,
                }))
            : [];

        // Create review + update product rating
        const review = await prisma.$transaction(async (tx) => {
            let newReview;

            if (existingReview !== null && existingReview.status === "REJECTED") {
                // C-01: Re-submission — update the existing REJECTED review in place.
                // This preserves the @unique(orderItemId) constraint since we keep the same record.
                await tx.reviewmedia.deleteMany({ where: { reviewId: existingReview.id } });
                newReview = await tx.review.update({
                    where: { id: existingReview.id },
                    data: {
                        rating,
                        comment: comment || null,
                        status: "PENDING",  // Goes back to moderation queue
                        adminReply: null,
                        repliedAt: null,
                        updatedAt: new Date(),
                        ...(mediaCreatePayload.length > 0
                            ? { media: { create: mediaCreatePayload } }
                            : {}),
                    },
                    include: {
                        user: { select: { id: true, name: true, image: true } },
                        media: true,
                    },
                });
            } else {
                newReview = await tx.review.create({
                    data: {
                        productId: product.id,
                        userId: Number(session.user.id),
                        orderItemId: purchasedItem.id,
                        rating,
                        comment: comment || null,
                        status: "PENDING",  // Moderation queue (schema default)
                        ...(mediaCreatePayload.length > 0
                            ? { media: { create: mediaCreatePayload } }
                            : {}),
                    },
                    include: {
                        user: { select: { id: true, name: true, image: true } },
                        media: true,
                    },
                });
            }

            // Update product rating aggregates
            const agg = await tx.review.aggregate({
                where: { productId: product.id, status: "APPROVED" },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.product.update({
                where: { id: product.id },
                data: {
                    ratingAvg: Math.round((agg._avg.rating || 0) * 10) / 10,
                    ratingCount: agg._count.rating,
                },
            });

            return newReview;
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        logger.error("Review creation error", error as Error, { context: "review-create", slug });
        return NextResponse.json({ error: "Lỗi khi tạo đánh giá" }, { status: 500 });
    }
}
