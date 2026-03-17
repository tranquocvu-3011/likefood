/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// PATCH /api/auth/2fa/toggle — Bật/tắt 2FA cho tài khoản
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }

        const { enabled, otp } = await req.json();

        if (!enabled && (session.user.role === "ADMIN" || session.user.role === "ADMIN")) {
            return NextResponse.json({ error: "Quản trị viên bắt buộc phải sử dụng xác thực 2 lớp." }, { status: 403 });
        }

        if (enabled) {
            if (!otp) {
                return NextResponse.json({ error: "Vui lòng cung cấp mã OTP." }, { status: 400 });
            }

            const token = await prisma.twofactortoken.findFirst({
                where: {
                    userId: Number(session.user.id),
                    token: otp,
                    expires: { gte: new Date() },
                },
            });

            if (!token) {
                return NextResponse.json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn." }, { status: 400 });
            }

            // Xóa token đã dùng
            await prisma.twofactortoken.delete({ where: { id: token.id } });
        }

        await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: { twoFactorEnabled: Boolean(enabled) },
        });

        return NextResponse.json({
            message: enabled ? "Đã bật xác thực 2 bước" : "Đã tắt xác thực 2 bước",
            twoFactorEnabled: Boolean(enabled),
        });
    } catch (error) {
        logger.error("2FA toggle error", error as Error, { context: "auth-2fa-toggle-api" });
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}

// GET /api/auth/2fa/toggle — Lấy trạng thái 2FA
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { twoFactorEnabled: true },
        });

        return NextResponse.json({ twoFactorEnabled: user?.twoFactorEnabled ?? false });
    } catch (error) {
        logger.error("2FA get error", error as Error, { context: "auth-2fa-toggle-api" });
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}
