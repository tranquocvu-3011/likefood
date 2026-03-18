/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../generated/client";

const normalizeMediaPath = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("/uploads/")) return `/api${trimmed}`;
    return trimmed;
};

// GET all published posts
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "6") || 6));
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const skip = (page - 1) * limit;

        const where: Prisma.postWhereInput = {
            isPublished: true,
            publishedAt: { lte: new Date() }
        };

        if (category && category !== "Tất cả") {
            where.category = category;
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: { publishedAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    titleEn: true,
                    slug: true,
                    summary: true,
                    summaryEn: true,
                    image: true,
                    authorName: true,
                    category: true,
                    publishedAt: true,
                    content: true,
                    images: {
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            imageUrl: true,
                            altText: true,
                            order: true,
                        },
                    },
                }
            }),
            prisma.post.count({ where }),
        ]);

        const normalizedPosts = posts.map((post) => ({
            ...post,
            image: normalizeMediaPath(post.image),
            images: post.images.map((img) => ({
                ...img,
                imageUrl: normalizeMediaPath(img.imageUrl) || "",
            })),
        }));

        return NextResponse.json({
            posts: normalizedPosts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Failed to fetch public posts", error as Error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}
