/**
 * LIKEFOOD - Admin Site Config API
 * Full CRUD for site settings
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";

// GET - Get all site config (admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await prisma.siteConfig.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return NextResponse.json(configs);
  } catch (error) {
    logger.error("Admin site config fetch error", error as Error, { context: "admin-site-config-api" });
    return NextResponse.json({ error: "Lỗi khi lấy cấu hình" }, { status: 500 });
  }
}

// POST - Create new config
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, type, category, description, isPublic } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key và value là bắt buộc" }, { status: 400 });
    }

    // Check for duplicate key
    const existing = await prisma.siteConfig.findUnique({
      where: { key },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.siteConfig.update({
        where: { key },
        data: {
          value: String(value),
          type: type || "text",
          category: category || "general",
          description: description || null,
          isPublic: isPublic !== false,
        },
      });
      return NextResponse.json(updated);
    }

    const config = await prisma.siteConfig.create({
      data: {
        id: Number(crypto.randomUUID()),
        key,
        value: String(value),
        type: type || "text",
        category: category || "general",
        description: description || null,
        isPublic: isPublic !== false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    logger.error("Admin site config create error", error as Error, { context: "admin-site-config-api" });
    return NextResponse.json({ error: "Lỗi khi tạo cấu hình" }, { status: 500 });
  }
}

// PUT - Update multiple configs at once (batch)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: "Danh sách cấu hình không hợp lệ" }, { status: 400 });
    }

    // Update each config
    await Promise.all(
      configs.map(async (config: { key: string; value: string }) => {
        return prisma.siteConfig.upsert({
          where: { key: config.key },
          update: { value: config.value },
          create: {
            id: Number(crypto.randomUUID()),
            key: config.key,
            value: config.value,
            type: "text",
            category: "general",
            isPublic: true,
            updatedAt: new Date(),
          },
        });
      })
    );

    return NextResponse.json({ message: "Cập nhật cấu hình thành công" });
  } catch (error) {
    logger.error("Admin site config update error", error as Error, { context: "admin-site-config-api" });
    return NextResponse.json({ error: "Lỗi khi cập nhật cấu hình" }, { status: 500 });
  }
}

// DELETE - Delete config
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key là bắt buộc" }, { status: 400 });
    }

    await prisma.siteConfig.delete({
      where: { key },
    });

    return NextResponse.json({ message: "Xóa cấu hình thành công" });
  } catch (error) {
    logger.error("Admin site config delete error", error as Error, { context: "admin-site-config-api" });
    return NextResponse.json({ error: "Lỗi khi xóa cấu hình" }, { status: 500 });
  }
}
