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
import { generateSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/logger";
import { Prisma } from "../../../../../generated/client";

// GET single post for admin
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const post = await prisma.post.findUnique({
            where: { id: Number(id) },
            include: {
                images: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        logger.error("Failed to fetch post detail for admin", error as Error);
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}

// PUT update post
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const data: Prisma.postUpdateInput = {};
        if (title) {
            data.title = title;
            data.slug = generateSlug(title);
        }
        if (summary !== undefined) data.summary = summary;
        if (content) data.content = content;
        if (image !== undefined) data.image = image;
        if (authorName) data.authorName = authorName;
        if (category) data.category = category;
        if (isPublished !== undefined) data.isPublished = isPublished;
        if (publishedAt) data.publishedAt = new Date(publishedAt);

        const { id } = await params;

        // Update gallery images: delete old ones and create new ones
        if (galleryImages !== undefined) {
            await prisma.postimage.deleteMany({ where: { postId: Number(id) } });
            if (galleryImages.length > 0) {
                await prisma.postimage.createMany({
                    data: galleryImages.map((url: string, index: number) => ({
                        postId: Number(id),
                        imageUrl: url,
                        order: index,
                    })),
                });
            }
        }

        const post = await prisma.post.update({
            where: { id: Number(id) },
            data,
            include: { images: { orderBy: { order: "asc" } } },
        });

        return NextResponse.json(post);
    } catch (error: unknown) {
        if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "Slug already exists, please try another title" }, { status: 400 });
        }
        logger.error("Post update error", error as Error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}

// DELETE post
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.post.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ message: "Post deleted successfully" });
    } catch (error) {
        logger.error("Post deletion error", error as Error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
