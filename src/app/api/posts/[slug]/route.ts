/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET single post by slug
export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const post = await prisma.post.findUnique({
            where: {
                slug,
                isPublished: true,
            },
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
        logger.error("Failed to fetch public post detail", error as Error);
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}
