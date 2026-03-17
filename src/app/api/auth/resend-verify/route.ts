/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendVerificationEmail } from "@/lib/mail";
import { isValidEmailFormat } from "@/lib/validation";
import { loginRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, loginRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Vui lòng cung cấp email." },
                { status: 400 }
            );
        }

        if (!isValidEmailFormat(email)) {
            return NextResponse.json(
                { error: "Định dạng email không hợp lệ." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Anti-enumeration: Luôn báo thành công nếu user không tồn tại hoặc đã verify
            return NextResponse.json(
                { message: "Nếu email tồn tại, một link xác thực mới đã được gửi." },
                { status: 200 }
            );
        }

        if (user.emailVerified) {
            return NextResponse.json(
                { alreadyVerified: true, message: "Tài khoản của bạn đã được xác thực trước đó." },
                { status: 200 }
            );
        }

        // Tạo mã OTP 6 ký tự (Chữ in hoa và số)
        const generateOTP = () => {
            const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let result = "";
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        const otp = generateOTP();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

        // Xóa các token cũ của email này
        await prisma.verificationtoken.deleteMany({ where: { identifier: email } });

        await prisma.verificationtoken.create({
            data: { identifier: email, token: otp, expires }
        });

        // Gửi email xác thực thật
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify-email?token=${otp}`;
        const emailResult = await sendVerificationEmail(email, otp, "VERIFY", undefined, verifyUrl);

        if (!emailResult.success) {
            logger.error("[MAIL] Failed to send verification email", new Error(String(emailResult.error)), { context: "auth-resend-verify" });
            return NextResponse.json(
                { error: "Không thể gửi email. Vui lòng kiểm tra cấu hình SMTP." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Mã xác thực mới đã được gửi đến email của bạn." },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Resend verification error", error as Error, { context: "auth-resend-verify-api" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra." },
            { status: 500 }
        );
    }
}
