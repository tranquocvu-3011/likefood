/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { updateProductRating } from "@/lib/rating";
import { z } from "zod";

const moderateSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    adminReply: z.string().max(1000).optional().nullable(),
});

// PATCH /api/admin/reviews/[id] - Approve or reject a review
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const parsed = moderateSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map(e => e.message).join(", ");
            return NextResponse.json({ error: errors }, { status: 400 });
        }

        const { status, adminReply } = parsed.data;

        const review = await prisma.review.findUnique({ where: { id: Number(id) } });
        if (!review) {
            return NextResponse.json({ error: "Review không tồn tại" }, { status: 404 });
        }

        const updated = await prisma.review.update({
            where: { id: Number(id) },
            data: {
                status,
                ...(adminReply !== undefined && {
                    adminReply,
                    repliedAt: new Date(),
                }),
            },
        });

        // Recalculate product rating after approval/rejection
        await updateProductRating(review.productId);

        logger.info("Review moderated", {
            context: "admin-reviews-moderate",
            reviewId: Number(id),
            status,
            adminId: Number(session.user.id),
        });

        return NextResponse.json(updated);
    } catch (error) {
        logger.error("Admin review moderate error", error as Error, { context: "admin-reviews-patch", reviewId: Number(id) });
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }
}

// DELETE /api/admin/reviews/[id] - Soft-delete (set REJECTED) or hard delete
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const review = await prisma.review.findUnique({ where: { id: Number(id) } });
        if (!review) {
            return NextResponse.json({ error: "Review không tồn tại" }, { status: 404 });
        }

        // C-01: Soft delete — set status to REJECTED so the orderItemId unique constraint
        // is preserved but the review is not shown publicly. This allows the user to
        // re-submit if needed by an admin clearing orderItemId.
        await prisma.review.update({
            where: { id: Number(id) },
            data: { status: "REJECTED" },
        });

        await updateProductRating(review.productId);

        logger.info("Review soft-deleted (REJECTED)", {
            context: "admin-reviews-delete",
            reviewId: Number(id),
            adminId: Number(session.user.id),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Admin review delete error", error as Error, { context: "admin-reviews-delete", reviewId: Number(id) });
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
