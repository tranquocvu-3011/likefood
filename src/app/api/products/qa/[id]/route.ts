/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// PUT - Admin trả lời câu hỏi
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { answer } = await req.json();

        const qa = await prisma.productqa.update({
            where: { id: Number(id) },
            data: { answer: answer?.trim() || null },
            include: {
                user: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        return NextResponse.json(qa);
    } catch (error) {
        logger.error("Q&A answer error", error as Error, { context: "products-qa-id-api" });
        return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
    }
}

// DELETE - Xóa câu hỏi (admin hoặc chủ câu hỏi)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const qa = await prisma.productqa.findUnique({ where: { id: Number(id) } });
        if (!qa) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Only admin or question owner can delete
        if (session.user.role !== "ADMIN" && qa.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.productqa.delete({ where: { id: Number(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Q&A delete error", error as Error, { context: "products-qa-id-api" });
        return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
    }
}
