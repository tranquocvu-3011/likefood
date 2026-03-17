/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/ratelimit";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
    newPassword: z.string()
        .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
        .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
        .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
        .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }

        // Rate limit password changes: 5 per hour per user
        const identifier = `user:${session.user.id}`;
        const rl = await applyRateLimit(identifier, null, { windowMs: 60 * 60 * 1000, maxRequests: 5 });
        if (!rl.success) {
            return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
        }

        const body = await req.json();
        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.flatten().fieldErrors;
            const firstMsg = Object.values(firstError).flat()[0] ?? "Dữ liệu không hợp lệ";
            return NextResponse.json(
                { error: firstMsg },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = parsed.data;

        // Lấy user từ DB
        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { id: true, password: true },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: "Tài khoản không hỗ trợ đổi mật khẩu (OAuth account)" },
                { status: 400 }
            );
        }

        // Verify mật khẩu hiện tại
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: "Mật khẩu hiện tại không đúng" },
                { status: 400 }
            );
        }

        // Kiểm tra mật khẩu mới không trùng cũ
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                { error: "Mật khẩu mới phải khác mật khẩu hiện tại" },
                { status: 400 }
            );
        }

        // Hash và lưu mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        logger.error("Change password error", error as Error, { context: "change-password" });
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
