/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isStrongPassword } from "@/lib/validation";
import { loginRateLimit, getRateLimitIdentifier, applyRateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const identifier = getRateLimitIdentifier(req);
        const rateResult = await applyRateLimit(identifier, loginRateLimit);
        if (!rateResult.success && rateResult.error) {
            return rateResult.error;
        }

        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Vui lòng cung cấp đầy đủ thông tin." },
                { status: 400 }
            );
        }

        // Đảm bảo mật khẩu mới cũng tuân thủ tiêu chuẩn mạnh giống lúc đăng ký
        if (!isStrongPassword(password)) {
            return NextResponse.json(
                { error: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt." },
                { status: 400 }
            );
        }

        // Tìm token reset password (Ở đây reuse cùng model VerificationToken)
        const passwordResetToken = await prisma.verificationtoken.findUnique({
            where: { token }
        });

        if (!passwordResetToken) {
            return NextResponse.json(
                { error: "Mã xác thực không hợp lệ hoặc đã được sử dụng." },
                { status: 400 }
            );
        }

        // Kiểm tra hết hạn
        if (new Date() > passwordResetToken.expires) {
            await prisma.verificationtoken.delete({ where: { id: passwordResetToken.id } });
            return NextResponse.json(
                { error: "Link đặt lại mật khẩu đã hết hạn." },
                { status: 400 }
            );
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 12);

        // Cập nhật mật khẩu cho User
        await prisma.user.update({
            where: { email: passwordResetToken.identifier },
            data: { password: hashedPassword }
        });

        // Xóa token sau khi dùng
        await prisma.verificationtoken.delete({
            where: { id: passwordResetToken.id }
        });

        return NextResponse.json(
            { message: "Đặt lại mật khẩu thành công!" },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Reset password error", error as Error, { context: "reset-password" });
        return NextResponse.json(
            { error: "Đã có lỗi xảy ra." },
            { status: 500 }
        );
    }
}
