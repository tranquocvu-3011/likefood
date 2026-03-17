/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../../generated/client";

// GET all posts (admin)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category");
        const isPublished = searchParams.get("isPublished");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
        const skip = (page - 1) * limit;

        const where: Prisma.postWhereInput = {};

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { summary: { contains: search } },
                { content: { contains: search } },
            ];
        }

        if (category) {
            where.category = category;
        }

        if (isPublished !== null && isPublished !== undefined && isPublished !== "") {
            where.isPublished = isPublished === "true";
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    images: {
                        orderBy: { order: "asc" },
                    },
                },
            }),
            prisma.post.count({ where }),
        ]);

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Failed to fetch posts for admin", error as Error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

// POST create new post
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            title,
            summary,
            content,
            image,
            authorName,
            category,
            isPublished,
            publishedAt,
            galleryImages,
        } = body;

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        const slug = generateSlug(title);

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                summary,
                content,
                image,
                authorName: authorName || "LIKEFOOD",
                category: category || "Tin tức",
                isPublished: isPublished ?? true,
                publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                images: galleryImages && galleryImages.length > 0
                    ? {
                        create: galleryImages.map((url: string, index: number) => ({
                            imageUrl: url,
                            order: index,
                        })),
                    }
                    : undefined,
            },
            include: { images: { orderBy: { order: "asc" } } },
        });

        return NextResponse.json(post);
    } catch (error: unknown) {
        if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "Slug already exists, please try another title" }, { status: 400 });
        }
        logger.error("Post creation error", error as Error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
