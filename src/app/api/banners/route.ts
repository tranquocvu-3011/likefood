/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ALLOWED_PLACEMENTS = ["home", "category", "product", "flash-sale"] as const;

const bannerSchema = z.object({
    imageUrl: z.string().url("imageUrl phải là URL hợp lệ"),
    title: z.string().max(200).default(""),
    subtitle: z.string().max(500).optional().nullable(),
    ctaText: z.string().max(100).optional().nullable(),
    ctaLink: z
        .string()
        .url("ctaLink phải là URL hợp lệ")
        .refine((v) => v.startsWith("https://"), { message: "ctaLink phải bắt đầu bằng https://" })
        .optional()
        .nullable(),
    startAt: z.string().datetime().optional().nullable(),
    endAt: z.string().datetime().optional().nullable(),
    priority: z.number().int().min(0).max(100).default(0),
    placement: z.enum(ALLOWED_PLACEMENTS).default("home"),
});

// GET active banners
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const placement = searchParams.get("placement") || "home";

        const now = new Date();

        const banners = await prisma.banner.findMany({
            where: {
                placement,
                isActive: true,
                OR: [
                    {
                        AND: [
                            { startAt: { lte: now } },
                            { endAt: { gte: now } }
                        ]
                    },
                    {
                        AND: [
                            { startAt: null },
                            { endAt: null }
                        ]
                    }
                ]
            },
            orderBy: [
                { priority: "desc" },
                { createdAt: "desc" }
            ],
            take: 3
        });

        const res = NextResponse.json(banners);
        // Banners home có thể cache ngắn hạn để giảm LCP
        res.headers.set(
            "Cache-Control",
            "public, s-maxage=300, stale-while-revalidate=600"
        );
        return res;
    } catch (error) {
        logger.error("Banners fetch error", error as Error, { context: "banners-api" });
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}

// POST new banner (Admin only)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = bannerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }
        const { imageUrl, title, subtitle, ctaText, ctaLink, startAt, endAt, priority, placement } = parsed.data;

        const banner = await prisma.banner.create({
            data: {
                imageUrl,
                title,
                subtitle: subtitle ?? null,
                ctaText: ctaText ?? null,
                ctaLink: ctaLink ?? null,
                startAt: startAt ? new Date(startAt) : null,
                endAt: endAt ? new Date(endAt) : null,
                priority,
                placement,
            },
        });

        return NextResponse.json(banner);
    } catch (error) {
        logger.error("Banner creation error", error as Error, { context: "banners-api" });
        return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
    }
}
