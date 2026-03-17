/**
 * LIKEFOOD - Admin Menu Management API
 * Full CRUD operations for menu items
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// GET - Get all menu items with children (admin view)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const menuItems = await prisma.menuItem.findMany({
      include: {
        children: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    logger.error("Admin menu fetch error", error as Error, { context: "admin-menu-api" });
    return NextResponse.json({ error: "Lỗi khi lấy menu" }, { status: 500 });
  }
}

// POST - Create new menu item
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, type, url, categoryId, productId, pageId, icon, parentId, position, isVisible, isActive } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Tên và loại menu là bắt buộc" }, { status: 400 });
    }

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
        isActive: isActive !== false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    logger.error("Admin menu create error", error as Error, { context: "admin-menu-api" });
    return NextResponse.json({ error: "Lỗi khi tạo menu" }, { status: 500 });
  }
}

// PUT - Update multiple menu items (reorder, toggle visibility)
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

    // Update each menu item
    await Promise.all(
      items.map(async (item: { id: string; position?: number; parentId?: string | null; isVisible?: boolean; isActive?: boolean; name?: string; url?: string }) => {
        const updateData: Record<string, unknown> = {};
        
        if (item.position !== undefined) updateData.position = item.position;
        if (item.parentId !== undefined) updateData.parentId = item.parentId;
        if (item.isVisible !== undefined) updateData.isVisible = item.isVisible;
        if (item.isActive !== undefined) updateData.isActive = item.isActive;
        if (item.name !== undefined) updateData.name = item.name;
        if (item.url !== undefined) updateData.url = item.url;

        return prisma.menuItem.update({
          where: { id: Number(item.id)},
          data: updateData,
        });
      })
    );

    return NextResponse.json({ message: "Cập nhật menu thành công" });
  } catch (error) {
    logger.error("Admin menu update error", error as Error, { context: "admin-menu-api" });
    return NextResponse.json({ error: "Lỗi khi cập nhật menu" }, { status: 500 });
  }
}

// DELETE - Delete menu item
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

    // Check if item has children - move children to root level
    const children = await prisma.menuItem.findMany({
      where: { parentId: Number(id) },
    });

    if (children.length > 0) {
      // Move children to root level (parentId = null)
      await prisma.menuItem.updateMany({
        where: { parentId: Number(id) },
        data: { parentId: null },
      });
    }

    await prisma.menuItem.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Xóa menu thành công" });
  } catch (error) {
    logger.error("Admin menu delete error", error as Error, { context: "admin-menu-api" });
    return NextResponse.json({ error: "Lỗi khi xóa menu" }, { status: 500 });
  }
}
