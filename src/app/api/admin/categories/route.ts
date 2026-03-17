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

function makeSlug(name: string) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
        return null;
    }
    return session;
}

// GET - List all categories from Category model (admin view with id included)
export async function GET() {
    try {
        const session = await requireAdmin();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const categories = await prisma.category.findMany({
            orderBy: [{ position: "asc" }, { name: "asc" }],
            include: {
                _count: { select: { products: true } },
            },
        });

        // Exclude "Khác" category from admin list (hidden everywhere)
        const filtered = categories.filter((c) => c.name !== "Khác" && c.slug !== "khac");

        return NextResponse.json(
            filtered.map((c) => ({
                id: c.id,
                name: c.name,
                nameEn: c.nameEn,
                slug: c.slug,
                description: c.description,
                descriptionEn: c.descriptionEn,
                imageUrl: c.imageUrl,
                parentId: c.parentId,
                position: c.position,
                isVisible: c.isVisible,
                isActive: c.isActive,
                productCount: c._count.products,
            }))
        );
    } catch (error) {
        logger.error("Admin category GET error", error as Error, { context: "admin-categories-api" });
        return NextResponse.json({ error: "Lỗi khi lấy danh mục" }, { status: 500 });
    }
}

// POST - Create new category in Category model
export async function POST(request: NextRequest) {
    try {
        const session = await requireAdmin();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { name, nameEn, description, descriptionEn, imageUrl, parentId, position } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
            return NextResponse.json({ error: "Tên danh mục không hợp lệ (tối đa 200 ký tự)" }, { status: 400 });
        }

        const trimmedName = name.trim();
        let slug = makeSlug(trimmedName);

        // Ensure slug uniqueness
        let suffix = 0;
        let candidateSlug = slug;
        while (await prisma.category.findUnique({ where: { slug: candidateSlug } })) {
            suffix += 1;
            candidateSlug = `${slug}-${suffix}`;
        }
        slug = candidateSlug;

        const category = await prisma.category.create({
            data: {
                name: trimmedName,
                nameEn: nameEn?.trim() || null,
                slug,
                description: description?.trim() || null,
                descriptionEn: descriptionEn?.trim() || null,
                imageUrl: imageUrl?.trim() || null,
                parentId: parentId || null,
                position: typeof position === "number" ? position : 0,
                isVisible: true,
                isActive: true,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        logger.error("Admin category POST error", error as Error, { context: "admin-categories-api" });
        return NextResponse.json({ error: "Lỗi khi tạo danh mục" }, { status: 500 });
    }
}

// PUT - Update category name/slug by id
export async function PUT(request: NextRequest) {
    try {
        const session = await requireAdmin();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, name, nameEn, description, descriptionEn, imageUrl, isActive, isVisible, position } = await request.json();

        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "id danh mục là bắt buộc" }, { status: 400 });
        }

        const existing = await prisma.category.findUnique({ where: { id: Number(id) } });
        if (!existing) return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });

        const updateData: Record<string, unknown> = {};

        if (name && typeof name === "string" && name.trim().length > 0) {
            const trimmedName = name.trim();
            updateData.name = trimmedName;
            // Regenerate slug only if name changed
            if (trimmedName !== existing.name) {
                const slug = makeSlug(trimmedName);
                let suffix = 0;
                let candidateSlug = slug;
                while (true) {
                    const conflict = await prisma.category.findUnique({ where: { slug: candidateSlug } });
                    if (!conflict || String(conflict.id) === String(id)) break;
                    suffix += 1;
                    candidateSlug = `${slug}-${suffix}`;
                }
                updateData.slug = candidateSlug;
            }
        }
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn?.trim() || null;
        if (nameEn !== undefined) updateData.nameEn = nameEn?.trim() || null;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;
        if (typeof isActive === "boolean") updateData.isActive = isActive;
        if (typeof isVisible === "boolean") updateData.isVisible = isVisible;
        if (typeof position === "number") updateData.position = position;

        const updated = await prisma.category.update({ where: { id: Number(id) }, data: updateData });
        return NextResponse.json(updated);
    } catch (error) {
        logger.error("Admin category PUT error", error as Error, { context: "admin-categories-api" });
        return NextResponse.json({ error: "Lỗi khi cập nhật danh mục" }, { status: 500 });
    }
}

// DELETE - Remove category by id (products with this categoryId will have it set to null via FK)
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAdmin();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "id là bắt buộc" }, { status: 400 });

        const existing = await prisma.category.findUnique({ where: { id: Number(id) }, include: { _count: { select: { products: true } } } });
        if (!existing) return NextResponse.json({ error: "Không tìm thấy danh mục" }, { status: 404 });

        if (existing._count.products > 0) {
            // Detach products (set categoryId to null) before deletion
            await prisma.product.updateMany({ where: { categoryId: Number(id) }, data: { categoryId: null } });
        }

        await prisma.category.delete({ where: { id: Number(id) } });
        return NextResponse.json({ message: `Đã xóa danh mục "${existing.name}"` });
    } catch (error) {
        logger.error("Admin category DELETE error", error as Error, { context: "admin-categories-api" });
        return NextResponse.json({ error: "Lỗi khi xóa danh mục" }, { status: 500 });
    }
}
