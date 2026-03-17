/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import * as crypto from "crypto";
import { applyRateLimit, loginRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

export async function POST(req: Request) {
    try {
        // Rate limit: 5 attempts per 15 minutes per IP
        const identifier = getRateLimitIdentifier(req);
        const rl = await applyRateLimit(identifier, loginRateLimit, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
        if (!rl.success) return rl.error as unknown as NextResponse;

        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Vui lòng cung cấp đầy đủ thông tin." },
                { status: 400 }
            );
        }

        const verificationToken = await prisma.verificationtoken.findFirst({
            where: {
                identifier: email,
                token: otp
            }
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Mã xác minh không chính xác." },
                { status: 400 }
            );
        }

        if (new Date() > verificationToken.expires) {
            await prisma.verificationtoken.delete({ where: { id: verificationToken.id } });
            return NextResponse.json(
                { error: "Mã xác minh đã hết hạn." },
                { status: 400 }
            );
        }

        // Tạo một Reset Token dài (hex) để chuyển sang trang reset-password
        // Token này sẽ dùng để định danh lượt reset này
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

        // Xóa OTP và lưu Reset Token mới
        await prisma.verificationtoken.delete({ where: { id: verificationToken.id } });

        await prisma.verificationtoken.create({
            data: {
                identifier: email,
                token: resetToken,
                expires: resetExpires
            }
        });

        return NextResponse.json(
            { resetToken },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Verify OTP error", error as Error, { context: "auth-verify-otp-api" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra." },
            { status: 500 }
        );
    }
}
