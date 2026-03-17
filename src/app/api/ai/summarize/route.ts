/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { callGPT } from "@/lib/ai/ai-provider";

export async function GET(req: NextRequest) {
    // Rate limit: 10 per minute per IP to protect AI API cost
    const identifier = getRateLimitIdentifier(req);
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 10 });
    if (!rl.success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 });
        }

        // Fetch approved reviews
        const reviews = await prisma.review.findMany({
            where: {
                productId: Number(productId),
                status: "APPROVED",
                NOT: [
                    { comment: null },
                    { comment: "" }
                ]
            },
            select: {
                rating: true,
                comment: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        if (reviews.length === 0) {
            return NextResponse.json({ summary: "Chưa có đánh giá chi tiết nào cho sản phẩm này." });
        }

        // If very few reviews, return a simple formatted list
        if (reviews.length < 3) {
            const combined = reviews.map(r => `- [${r.rating}*] ${r.comment}`).join("\n");
            return NextResponse.json({
                summary: `Dựa trên ${reviews.length} đánh giá gần đây:\n${combined}`
            });
        }

        // Build prompt
        const reviewsText = reviews.map(r => `Rating: ${r.rating}, Comment: ${r.comment}`).join("\n---\n");

        const prompt = `Bạn là chuyên gia phân tích đánh giá sản phẩm cho LIKEFOOD — cửa hàng đặc sản Việt Nam tại Mỹ.

Hãy tóm tắt ${reviews.length} đánh giá sau đây một cách chuyên nghiệp và dễ hiểu.

Yêu cầu:
1. Ngôn ngữ: Tiếng Việt, giọng thân thiện nhưng khách quan.
2. Cấu trúc:
   - Tổng quan: Một câu tóm tắt mức hài lòng chung (rating trung bình nếu tính được).
   - ✅ Ưu điểm: 2-3 điểm nổi bật nhất (từ các review 4-5 sao).
   - ⚠️ Lưu ý: Điểm cần cải thiện (từ các review thấp sao, nếu không có thì ghi "Chưa ghi nhận phản hồi tiêu cực").
3. Không bịa đặt thông tin.
4. Tối đa 150 từ.

Dữ liệu đánh giá:
${reviewsText}`;

        const result = await callGPT(prompt, {
            task: "review-summary",
            temperature: 0.5,
            maxTokens: 600,
            frequencyPenalty: 0.2,
        });

        if (result?.text) {
            return NextResponse.json({ summary: result.text });
        }

        // Fallback if AI unavailable
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        return NextResponse.json({
            summary: `Tóm tắt (Hệ thống AI đang bảo trì): Khách hàng đánh giá trung bình ${avgRating.toFixed(1)}/5 sao. Đa số khách hàng hài lòng với chất lượng sản phẩm.`
        });

    } catch (error) {
        logger.error("AI Summarize Error", error as Error, { context: "ai-summarize-api" });
        return NextResponse.json({ error: "Failed to summarize reviews" }, { status: 500 });
    }
}
