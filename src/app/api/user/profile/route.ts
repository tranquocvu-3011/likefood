/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { decryptForDisplay, encrypt } from "@/lib/encryption";

const updateProfileSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(80, "Tên quá dài").optional(),
    phone: z
        .string()
        .regex(/^[0-9+\s\-().]{9,15}$/, "Số điện thoại không hợp lệ (9-15 ký tự)")
        .optional()
        .nullable(),
});

// GET user profile
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                image: true,
                avatarUrl: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...user,
            phone: decryptForDisplay(user.phone),
            image: user.avatarUrl || user.image,
        });
    } catch (error) {
        logger.error("Profile fetch error", error as Error, { context: "user-profile-api" });
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// PUT update user profile
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 10 profile updates per hour
    const identifier = getRateLimitIdentifier(req, String(session.user.id));
    const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 3600000, maxRequests: 10 });
    if (!rl.success && rl.error) {
        return rl.error;
    }

    try {
        const body = await req.json();

        // F-01: Validate input with Zod
        const parsed = updateProfileSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.issues.map(e => e.message).join(", ");
            return NextResponse.json({ error: errors }, { status: 400 });
        }

        const { name, phone } = parsed.data;

        const user = await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone: phone ? encrypt(phone) : null }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                image: true,
                avatarUrl: true,
                emailVerified: true,
            },
        });

        return NextResponse.json({
            ...user,
            phone: decryptForDisplay(user.phone),
            image: user.avatarUrl || user.image,
        });
    } catch (error) {
        logger.error("Profile update error", error as Error, { context: "user-profile-api" });
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
