/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "../../../lib/prisma";
import { updateProductRating } from "@/lib/rating";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../generated/client";
import { notifyNewReview } from "@/lib/telegram";

// GET /api/reviews - List reviews (for a product or for user's pending reviews)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const productId = searchParams.get("productId");
        const hasMedia = searchParams.get("hasMedia") === "true";
        const rating = searchParams.get("rating");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.reviewWhereInput = { status: "APPROVED" };

        if (productId) {
            where.productId = Number(productId);
        }

        if (rating) {
            where.rating = Number.parseInt(rating, 10);
        }

        if (hasMedia) {
            where.media = { some: {} };
        }

        // Get reviews
        const [reviews, total] = await Promise.all([
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.review.count({ where })
        ]);

        return NextResponse.json({
            reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error("Get reviews error", error as Error, { context: "reviews-api-get" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        );
    }
}

// POST /api/reviews - Create a new review (Shopee rule: must have purchased)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    let productIdForLog: string | undefined;
    try {
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Vui lòng đăng nhập để đánh giá" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate request body
        const { createReviewSchema } = await import('@/lib/validations/review');
        const { validationErrorResponse } = await import('@/lib/validations/utils');

        const validationResult = createReviewSchema.safeParse({
            productId: body.productId,
            rating: body.rating,
            comment: body.comment,
            images: body.mediaUrls || [],
            orderId: body.orderItemId
        });

        if (!validationResult.success) {
            return NextResponse.json(
                validationErrorResponse(validationResult.error),
                { status: 400 }
            );
        }

        const productId = validationResult.data.productId;
        productIdForLog = productId;
        const { orderItemId, rating, comment, mediaUrls } = body ?? {};

        // Verify order item belongs to user and is completed
        const orderItem = await prisma.orderitem.findUnique({
            where: { id: orderItemId },
            include: {
                order: {
                    select: { userId: true, status: true }
                }
            }
        });

        if (!orderItem) {
            return NextResponse.json(
                { error: "Không tìm thấy đơn hàng" },
                { status: 404 }
            );
        }

        if (Number(orderItem.order.userId) !== Number(session.user.id)) {
            return NextResponse.json(
                { error: "Bạn không có quyền đánh giá sản phẩm này" },
                { status: 403 }
            );
        }

        if (orderItem.order.status !== "COMPLETED") {
            return NextResponse.json(
                { error: "Chỉ có thể đánh giá sau khi đơn hàng hoàn tất" },
                { status: 400 }
            );
        }

        if (orderItem.productId !== Number(productId)) {
            return NextResponse.json(
                { error: "Sản phẩm không khớp với đơn hàng" },
                { status: 400 }
            );
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findUnique({
            where: { orderItemId: Number(orderItemId) }
        });

        if (existingReview) {
            return NextResponse.json(
                { error: "Bạn đã đánh giá sản phẩm này rồi" },
                { status: 400 }
            );
        }

        // Create review with transaction
        const review = await prisma.$transaction(async (tx) => {
            // Create review
            const newReview = await tx.review.create({
                data: {
                    productId: Number(productId),
                    userId: session.user.id,
                    orderItemId: Number(orderItemId),
                    rating,
                    comment: comment || null,
                    status: "APPROVED" // Auto-approve for now
                }
            });

            // Add media if provided
            if (mediaUrls && mediaUrls.length > 0) {
                await tx.reviewmedia.createMany({
                    data: mediaUrls.map((url: string, index: number) => ({
                        reviewId: newReview.id,
                        type: url.includes('.mp4') || url.includes('.webm') ? 'video' : 'image',
                        url,
                        order: index
                    }))
                });
            }

            return newReview;
        });

        // Update product rating
        await updateProductRating(Number(productId));

        // Gửi thông báo Telegram cho review mới
        try {
            const product = await prisma.product.findUnique({ where: { id: Number(productId) }, select: { name: true } });
            notifyNewReview({
                productName: product?.name || "Sản phẩm",
                rating,
                comment: comment || undefined,
                customerName: session.user.name || "Khách hàng",
                customerEmail: session.user.email || undefined,
            }).catch(() => {});
        } catch {} 

        return NextResponse.json({
            success: true,
            message: "Đánh giá đã được gửi thành công!",
            review
        });

    } catch (error) {
        logger.error("Create review error", error as Error, { context: "reviews-api-post", userId: session?.user?.id ? String(session.user.id) : undefined, productId: productIdForLog });
        return NextResponse.json(
            { error: "Có lỗi xảy ra khi gửi đánh giá" },
            { status: 500 }
        );
    }
}
