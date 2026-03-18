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
import { logger } from "@/lib/logger";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { applyRateLimit } from "@/lib/ratelimit";

const AVATAR_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function isAllowedAvatarBuffer(buffer: Buffer): boolean {
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
    // WEBP: RIFF + WEBP marker
    if (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) return true;
    return false;
}

// POST upload avatar
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: per-user, 20 uploads/minute (tránh "Quá nhiều yêu cầu" khi thử nhiều lần)
    const identifier = `avatar:${session.user.id}`;
    const rl = await applyRateLimit(identifier, null, { windowMs: 60000, maxRequests: 20 });
    if (!rl.success) return rl.error!;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
        }

        // Validate extension whitelist
        const extFromName = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!AVATAR_EXTENSIONS.has(extFromName)) {
            return NextResponse.json({ error: "Chỉ chấp nhận: jpg, jpeg, png, gif, webp" }, { status: 400 });
        }

        // Validate magic bytes (actual file content)
        const headerBytes = await file.slice(0, 16).arrayBuffer();
        const headerBuffer = Buffer.from(headerBytes);
        if (!isAllowedAvatarBuffer(headerBuffer)) {
            logger.security("Blocked avatar upload: magic bytes mismatch", {
                userId: Number(session.user.id),
                fileName: file.name,
                declaredType: file.type,
                magicHex: headerBuffer.toString("hex").slice(0, 16),
            });
            return NextResponse.json({ error: "File không hợp lệ. Nội dung file không khớp định dạng ảnh." }, { status: 400 });
        }

        // Store as a file URL (safe for session/JWT; avoids huge base64 in cookies)
        const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
        await mkdir(uploadDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = extFromName || "jpg";
        const fileName = `${session.user.id}-${randomUUID()}.${ext}`;
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const avatarUrl = `/api/uploads/avatars/${fileName}`;

        // Update user image
        const user = await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: { avatarUrl, image: avatarUrl },
            select: {
                id: true,
                image: true,
                avatarUrl: true,
            },
        });

        return NextResponse.json({ image: user.avatarUrl || user.image, avatarUrl: user.avatarUrl });
    } catch (error) {
        logger.error("Avatar upload error", error as Error, {
            context: "avatar-upload",
            userId: String(Number(session?.user?.id))
        });
        return NextResponse.json({
            error: "Failed to upload avatar",
            details: error instanceof Error ? error.message : "Unknown error",
            stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

// DELETE avatar
export async function DELETE() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: { image: null, avatarUrl: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Avatar delete error", error as Error, {
            context: "avatar-delete",
            userId: String(Number(session?.user?.id))
        });
        return NextResponse.json({
            error: "Failed to delete avatar",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
