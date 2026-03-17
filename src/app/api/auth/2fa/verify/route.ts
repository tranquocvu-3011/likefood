/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { applyRateLimit, otpRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

// POST /api/auth/2fa/verify — Xác thực OTP 2FA
export async function POST(req: NextRequest) {
    try {
        // Rate limit: 5 attempts per 15 minutes per IP
        const identifier = getRateLimitIdentifier(req);
        const rl = await applyRateLimit(identifier, otpRateLimit, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
        if (!rl.success) return rl.error as unknown as NextResponse;

        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ error: "Email và OTP là bắt buộc" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Mã OTP hoặc email không chính xác" }, { status: 400 });
        }

        // Tìm token hợp lệ
        const token = await prisma.twofactortoken.findFirst({
            where: {
                userId: user.id,
                token: otp,
                expires: { gte: new Date() },
            },
        });

        if (!token) {
            return NextResponse.json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" }, { status: 400 });
        }

        // Xóa token đã dùng
        await prisma.twofactortoken.delete({ where: { id: token.id } });

        return NextResponse.json({ success: true, message: "Xác thực 2FA thành công" });
    } catch (error) {
        logger.error("2FA verify error", error as Error, { context: "auth-2fa-verify-api" });
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}
