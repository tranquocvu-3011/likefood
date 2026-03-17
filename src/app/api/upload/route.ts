/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { logger } from "@/lib/logger";

// Allowed file signatures (magic bytes) for image types
const ALLOWED_MAGIC_BYTES: { signature: number[]; ext: string }[] = [
    { signature: [0xFF, 0xD8, 0xFF], ext: "jpg" },           // JPEG
    { signature: [0x89, 0x50, 0x4E, 0x47], ext: "png" },     // PNG
    { signature: [0x47, 0x49, 0x46, 0x38], ext: "gif" },     // GIF
];

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);

function isAllowedImageBuffer(buffer: Buffer): boolean {
    // Check standard magic bytes (JPEG, PNG, GIF)
    for (const { signature } of ALLOWED_MAGIC_BYTES) {
        if (signature.every((byte, i) => buffer[i] === byte)) {
            return true;
        }
    }
    // WEBP: RIFF header (bytes 0-3) + "WEBP" marker (bytes 8-11)
    const isWebp =
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (isWebp) return true;
    // AVIF: ftyp box — bytes 4-7 must be 'ftyp', bytes 8-11 must be 'avif' or 'mif1' or 'heic'
    const ftypMarker = buffer.slice(4, 8).toString("ascii");
    const brandMarker = buffer.slice(8, 12).toString("ascii");
    const isAvif = ftypMarker === "ftyp" && ["avif", "mif1", "heic"].includes(brandMarker);
    if (isAvif) return true;
    return false;
}

function getSafeExtension(originalName: string): string | null {
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
    return ALLOWED_EXTENSIONS.has(ext) ? ext : null;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    let files: File[] = [];

    if (!session || (session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        files = formData.getAll("file") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // Validate files
        for (const file of files) {
            // Validate declared MIME type
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ 
                    error: "File must be an image",
                    fileName: file.name
                }, { status: 400 });
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ 
                    error: "File size must be less than 10MB",
                    fileName: file.name,
                    fileSize: file.size
                }, { status: 400 });
            }

            // Validate extension whitelist
            const ext = getSafeExtension(file.name);
            if (!ext) {
                return NextResponse.json({
                    error: "Định dạng file không được hỗ trợ. Chỉ chấp nhận: jpg, jpeg, png, gif, webp, avif",
                    fileName: file.name,
                }, { status: 400 });
            }

            // Validate actual file content via magic bytes
            const headerBytes = await file.slice(0, 16).arrayBuffer();
            const headerBuffer = Buffer.from(headerBytes);
            if (!isAllowedImageBuffer(headerBuffer)) {
                logger.security("Blocked upload: file magic bytes mismatch", {
                    userId: Number(session.user.id),
                    fileName: file.name,
                    declaredType: file.type,
                    magicHex: headerBuffer.toString("hex").slice(0, 16),
                });
                return NextResponse.json({
                    error: "File không hợp lệ. Nội dung file không khớp với định dạng ảnh.",
                    fileName: file.name,
                }, { status: 400 });
            }
        }

        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure upload directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // Directory might already exist
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Use safe extension (already validated above)
            const ext = getSafeExtension(file.name) ?? "jpg";
            const fileName = `${randomUUID()}.${ext}`;
            const path = join(uploadDir, fileName);

            await writeFile(path, buffer);
            uploadedUrls.push(`/uploads/${fileName}`);
        }

        return NextResponse.json({
            urls: uploadedUrls,
            message: "Upload thành công"
        });

    } catch (error) {
        logger.error("File upload error", error as Error, { 
            context: "file-upload",
            userId: String(Number(session?.user?.id)),
            fileCount: files?.length || 0
        });
        return NextResponse.json({
            error: "Failed to upload file",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

