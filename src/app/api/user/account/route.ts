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
import bcrypt from "bcryptjs";

// DELETE /api/user/account — Xóa tài khoản vĩnh viễn
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
        }

        const { password } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: { id: true, password: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
        }

        // Không cho xóa tài khoản ADMIN
        if (user.role === "ADMIN" || user.role === "ADMIN") {
            return NextResponse.json(
                { error: "Không thể xóa tài khoản quản trị viên" },
                { status: 403 }
            );
        }

        // Nếu là credentials account, verify mật khẩu
        if (user.password && password) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Mật khẩu không đúng" },
                    { status: 400 }
                );
            }
        } else if (user.password && !password) {
            return NextResponse.json(
                { error: "Vui lòng nhập mật khẩu để xác nhận" },
                { status: 400 }
            );
        }

        // Cascade delete: Xóa user (Prisma cascade xóa tất cả related records)
        await prisma.user.delete({
            where: { id: Number(session.user.id) },
        });

        return NextResponse.json({ message: "Tài khoản đã được xóa vĩnh viễn" });
    } catch (error) {
        logger.error("Delete account error", error as Error, { context: "user-account-api" });
        return NextResponse.json(
            { error: "Đã xảy ra lỗi. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
