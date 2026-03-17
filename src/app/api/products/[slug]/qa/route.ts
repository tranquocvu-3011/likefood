/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { applyRateLimit, loginRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { NextRequest } from "next/server";

// GET - Lấy danh sách Q&A cho sản phẩm
export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const product = await prisma.product.findFirst({
            where: { OR: [...(Number.isFinite(Number()) ? [{ id: Number() }] : []), {  }] },
            select: { id: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const qas = await prisma.productqa.findMany({
            where: {
                productId: product.id,
                isPublic: true,
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(qas);
    } catch (error) {
        logger.error("Q&A fetch error", error as Error, { context: "products-slug-qa-api" });
        return NextResponse.json({ error: "Failed to fetch Q&A" }, { status: 500 });
    }
}

// POST - Đặt câu hỏi mới
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 questions per 15 minutes per user
    const identifier = `qa:${getRateLimitIdentifier(req)}`;
    const rl = await applyRateLimit(identifier, loginRateLimit, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
    if (!rl.success) return rl.error as unknown as NextResponse;

    try {
        const { slug } = await params;
        const { question } = await req.json();

        if (!question || question.trim().length < 5) {
            return NextResponse.json(
                { error: "Câu hỏi phải có ít nhất 5 ký tự" },
                { status: 400 }
            );
        }

        const product = await prisma.product.findFirst({
            where: { OR: [...(Number.isFinite(Number()) ? [{ id: Number() }] : []), {  }] },
            select: { id: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const qa = await prisma.productqa.create({
            data: {
                productId: product.id,
                userId: Number(session.user.id),
                question: question.trim(),
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        return NextResponse.json(qa, { status: 201 });
    } catch (error) {
        logger.error("Q&A create error", error as Error, { context: "products-slug-qa-api" });
        return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
    }
}
