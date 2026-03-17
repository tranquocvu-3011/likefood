/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { canUserReview as _canUserReview, getPendingReviews, getPurchasableItems } from "@/lib/rating";

// GET /api/reviews/check - Check if user can review a product
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                canReview: false,
                reason: "not_logged_in",
                message: "Vui lòng đăng nhập để đánh giá"
            });
        }

        const productId = request.nextUrl.searchParams.get("productId");

        if (productId) {
            // Check for specific product - get all purchasable items
            const purchasableItems = await getPurchasableItems(session.user.id, Number(productId));
            
            // Filter items that can be reviewed (COMPLETED orders without reviews)
            const eligibleItems = purchasableItems.filter(
                item => item.order.status === "COMPLETED" && !item.review
            );

            return NextResponse.json({
                canReview: eligibleItems.length > 0,
                purchasableItems: purchasableItems,
                eligibleItems: eligibleItems,
                message: eligibleItems.length > 0 
                    ? "Bạn có thể đánh giá sản phẩm này"
                    : "Bạn cần mua và nhận hàng thành công để đánh giá sản phẩm này"
            });
        } else {
            // Get all pending reviews
            const pending = await getPendingReviews(session.user.id);

            return NextResponse.json({
                pendingCount: pending.length,
                pendingReviews: pending
            });
        }

    } catch (error) {
        logger.error("Check review eligibility error", error as Error, { context: "reviews-check-api" });
        return NextResponse.json(
            { error: "Có lỗi xảy ra" },
            { status: 500 }
        );
    }
}
