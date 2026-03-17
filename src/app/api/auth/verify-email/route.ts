/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registerRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Mã xác thực không hợp lệ.", code: "INVALID_TOKEN" },
                { status: 400 }
            );
        }

        // Tìm token trong database
        const verificationToken = await prisma.verificationtoken.findUnique({
            where: { token }
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Link xác thực không tồn tại hoặc đã được sử dụng.", code: "TOKEN_NOT_FOUND" },
                { status: 400 }
            );
        }

        // Kiểm tra hết hạn
        if (new Date() > verificationToken.expires) {
            // Xóa token hết hạn
            await prisma.verificationtoken.delete({
                where: { id: verificationToken.id }
            });

            return NextResponse.json(
                { error: "Link xác thực đã hết hạn.", code: "TOKEN_EXPIRED" },
                { status: 400 }
            );
        }

        // Cập nhật trạng thái User
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() }
        });

        // Xóa token sau khi dùng
        await prisma.verificationtoken.delete({
            where: { id: verificationToken.id }
        });

        return NextResponse.json(
            { message: "Xác thực thành công!" },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Verification error", error as Error, { context: "verify-email" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra trong quá trình xác thực.", code: "SERVER_ERROR" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        // Using registerRateLimit (3 attempts / 1 hour) for OTP guess protection
        const rateResult = await applyRateLimit(identifier, registerRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Vui lòng cung cấp đầy đủ email và mã xác thực." },
                { status: 400 }
            );
        }

        // Tìm token trong database
        const verificationToken = await prisma.verificationtoken.findFirst({
            where: {
                identifier: email,
                token: otp
            }
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Mã xác thực không đúng." },
                { status: 400 }
            );
        }

        // Kiểm tra hết hạn
        if (new Date() > verificationToken.expires) {
            await prisma.verificationtoken.delete({
                where: { id: verificationToken.id }
            });

            return NextResponse.json(
                { error: "Mã xác thực đã hết hạn." },
                { status: 400 }
            );
        }

        // Cập nhật trạng thái User
        await prisma.user.update({
            where: { email },
            data: { emailVerified: new Date() }
        });

        // Xóa token sau khi dùng
        await prisma.verificationtoken.delete({
            where: { id: verificationToken.id }
        });

        return NextResponse.json(
            { message: "Xác thực email thành công!" },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Verification POST error", error as Error, { context: "verify-email-post" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra." },
            { status: 500 }
        );
    }
}
