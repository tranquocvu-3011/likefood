/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import prisma from "@/lib/prisma";

/**
 * Update product rating stats after review changes
 */
export async function updateProductRating(productId: number) {
    const reviews = await prisma.review.findMany({
        where: {
            productId,
            status: "APPROVED"
        },
        select: { rating: true }
    });

    const ratingCount = reviews.length;
    const ratingAvg = ratingCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0;

    await prisma.product.update({
        where: { id: Number(productId) },
        data: {
            ratingAvg: Math.round(ratingAvg * 10) / 10, // 1 decimal place
            ratingCount
        }
    });

    return { ratingAvg, ratingCount };
}

/**
 * Increment sold count when order is completed
 */
export async function incrementSoldCount(orderId: number) {
    const orderItems = await prisma.orderitem.findMany({
        where: { orderId }
    });

    for (const item of orderItems) {
        await prisma.product.update({
            where: { id: item.productId },
            data: {
                soldCount: { increment: item.quantity }
            }
        });
    }
}

/**
 * Get rating breakdown for a product (5/4/3/2/1 stars count)
 */
export async function getRatingBreakdown(productId: number) {
    const reviews = await prisma.review.findMany({
        where: {
            productId,
            status: "APPROVED"
        },
        select: { rating: true }
    });

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            breakdown[r.rating as keyof typeof breakdown]++;
        }
    });

    const total = reviews.length;
    return {
        breakdown,
        total,
        percentages: {
            5: total > 0 ? Math.round((breakdown[5] / total) * 100) : 0,
            4: total > 0 ? Math.round((breakdown[4] / total) * 100) : 0,
            3: total > 0 ? Math.round((breakdown[3] / total) * 100) : 0,
            2: total > 0 ? Math.round((breakdown[2] / total) * 100) : 0,
            1: total > 0 ? Math.round((breakdown[1] / total) * 100) : 0,
        }
    };
}

/**
 * Check if user can review a product (Shopee rule)
 * - Must have purchased the product
 * - Order must be COMPLETED
 * - Haven't reviewed that specific order item yet
 */
export async function canUserReview(userId: number, productId: number) {
    // Find completed orders with this product that haven't been reviewed
    const eligibleItems = await prisma.orderitem.findMany({
        where: {
            productId,
            order: {
                userId,
                status: "COMPLETED"
            },
            reviews: {
                is: null
            }
        },
        include: {
            order: {
                select: { id: true, createdAt: true }
            },
            product: {
                select: { id: true, name: true, slug: true, image: true }
            }
        }
    });

    return {
        canReview: eligibleItems.length > 0,
        eligibleOrderItems: eligibleItems.map(item => ({
            orderItemId: item.id,
            orderId: item.order.id,
            orderDate: item.order.createdAt,
            quantity: item.quantity,
            productName: item.product.name,
            productImage: item.product.image
        }))
    };
}

/**
 * Check if user can review AND get their existing review
 */
export async function getPurchasableItems(userId: number, productId: number) {
    // Find all completed orders with this product
    const items = await prisma.orderitem.findMany({
        where: {
            productId,
            order: {
                userId,
                status: "COMPLETED"
            }
        },
        include: {
            order: {
                select: { id: true, status: true, createdAt: true }
            },
            product: {
                select: { id: true, name: true, image: true }
            },
            reviews: {
                select: { id: true, rating: true, comment: true }
            } as { select: { id: true; rating: true; comment: true } }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        order: item.order,
        review: item.reviews || null
    }));
}

/**
 * Get pending reviews for user (orders completed but not reviewed)
 */
export async function getPendingReviews(userId: number) {
    const pendingItems = await prisma.orderitem.findMany({
        where: {
            order: {
                userId,
                status: "COMPLETED"
            },
            reviews: {
                is: null
            }
        },
        include: {
            product: {
                select: { id: true, name: true, slug: true, image: true }
            },
            order: {
                select: { id: true, createdAt: true }
            }
        }
    });

    return pendingItems.map(item => ({
        orderItemId: item.id,
        orderId: item.order.id,
        orderDate: item.order.createdAt,
        product: item.product
    }));
}
