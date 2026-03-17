/**
 * LIKEFOOD - Admin Homepage Sections API
 * Full CRUD for homepage sections
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// GET - Get all homepage sections (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sections = await prisma.homepageSection.findMany({
      orderBy: { position: "asc" },
    });

    return NextResponse.json(sections);
  } catch (error) {
    logger.error("Admin homepage sections fetch error", error as Error, { context: "admin-homepage-sections-api" });
    return NextResponse.json({ error: "Lỗi khi lấy sections" }, { status: 500 });
  }
}

// POST - Create new homepage section
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, title, subtitle, description, config, type, isActive, position, limit, startAt, endAt } = body;

    if (!key) {
      return NextResponse.json({ error: "Key là bắt buộc" }, { status: 400 });
    }

    // Check for duplicate key
    const existing = await prisma.homepageSection.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json({ error: "Key đã tồn tại" }, { status: 409 });
    }

    const section = await prisma.homepageSection.create({
      data: {
        id: Number(crypto.randomUUID()),
        key,
        title: title || null,
        subtitle: subtitle || null,
        description: description || null,
        config: config || null,
        type: type || "grid",
        isActive: isActive !== false,
        position: position || 0,
        limit: limit || 10,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    logger.error("Admin homepage section create error", error as Error, { context: "admin-homepage-sections-api" });
    return NextResponse.json({ error: "Lỗi khi tạo section" }, { status: 500 });
  }
}

// PUT - Update multiple sections (reorder, toggle)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Danh sách items không hợp lệ" }, { status: 400 });
    }

    await Promise.all(
      items.map(async (item: { id: string; position?: number; isActive?: boolean; title?: string; subtitle?: string; description?: string; config?: unknown; limit?: number }) => {
        const updateData: Record<string, unknown> = {};
        
        if (item.position !== undefined) updateData.position = item.position;
        if (item.isActive !== undefined) updateData.isActive = item.isActive;
        if (item.title !== undefined) updateData.title = item.title;
        if (item.subtitle !== undefined) updateData.subtitle = item.subtitle;
        if (item.description !== undefined) updateData.description = item.description;
        if (item.config !== undefined) updateData.config = item.config;
        if (item.limit !== undefined) updateData.limit = item.limit;

        return prisma.homepageSection.update({
          where: { id: Number(item.id)},
          data: updateData,
        });
      })
    );

    return NextResponse.json({ message: "Cập nhật thành công" });
  } catch (error) {
    logger.error("Admin homepage sections update error", error as Error, { context: "admin-homepage-sections-api" });
    return NextResponse.json({ error: "Lỗi khi cập nhật" }, { status: 500 });
  }
}

// DELETE - Delete homepage section
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });
    }

    await prisma.homepageSection.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Xóa section thành công" });
  } catch (error) {
    logger.error("Admin homepage section delete error", error as Error, { context: "admin-homepage-sections-api" });
    return NextResponse.json({ error: "Lỗi khi xóa" }, { status: 500 });
  }
}
