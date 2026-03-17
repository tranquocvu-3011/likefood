/**
 * LIKEFOOD - Menu Items API
 * API for managing navigation menu items
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// GET - Get all menu items (public)
export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isVisible: true },
      include: {
        children: {
          where: { isVisible: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    logger.error("Menu fetch error", error as Error, { context: "menu-api" });
    return NextResponse.json({ error: "Lỗi khi lấy menu" }, { status: 500 });
  }
}

// POST - Create new menu item (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, type, url, categoryId, productId, pageId, icon, parentId, position, isVisible } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Tên và loại menu là bắt buộc" }, { status: 400 });
    }

    // Generate slug if not provided
    const menuSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check for duplicate slug
    const existing = await prisma.menuItem.findUnique({
      where: { slug: menuSlug },
    });

    if (existing) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        id: Number(crypto.randomUUID()),
        name,
        slug: menuSlug,
        type,
        url: url || null,
        categoryId: categoryId || null,
        productId: productId || null,
        pageId: pageId || null,
        icon: icon || null,
        parentId: parentId || null,
        position: position || 0,
        isVisible: isVisible !== false,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    logger.error("Menu create error", error as Error, { context: "menu-api" });
    return NextResponse.json({ error: "Lỗi khi tạo menu" }, { status: 500 });
  }
}

// PUT - Update multiple menu items (reorder, admin only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Danh sách menu items không hợp lệ" }, { status: 400 });
    }

    // Update each menu item's position
    await Promise.all(
      items.map(async (item: { id: string; position: number; parentId?: string | null; isVisible?: boolean }) => {
        return prisma.menuItem.update({
          where: { id: Number(item.id)},
          data: {
            position: item.position,
            parentId: item.parentId ? Number(item.parentId) : null,
            isVisible: item.isVisible !== undefined ? item.isVisible : undefined,
          },
        });
      })
    );

    return NextResponse.json({ message: "Cập nhật menu thành công" });
  } catch (error) {
    logger.error("Menu update error", error as Error, { context: "menu-api" });
    return NextResponse.json({ error: "Lỗi khi cập nhật menu" }, { status: 500 });
  }
}

// DELETE - Delete menu item (admin only)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID menu là bắt buộc" }, { status: 400 });
    }

    // Check if item has children
    const children = await prisma.menuItem.count({
      where: { parentId: Number(id) },
    });

    if (children > 0) {
      return NextResponse.json(
        { error: "Không thể xóa menu có menu con. Hãy xóa menu con trước." },
        { status: 400 }
      );
    }

    await prisma.menuItem.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Xóa menu thành công" });
  } catch (error) {
    logger.error("Menu delete error", error as Error, { context: "menu-api" });
    return NextResponse.json({ error: "Lỗi khi xóa menu" }, { status: 500 });
  }
}
