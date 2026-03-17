/**
 * LIKEFOOD - Admin Dynamic Pages API
 * Full CRUD for dynamic pages (About, FAQ, Policies, etc.)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { z } from "zod";

const pageCreateSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
  content: z.string().default(""),
  excerpt: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  template: z.string().default("default"),
  type: z.string().default("custom"),
  isPublished: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  order: z.number().int().default(0),
});

// GET - Get all pages or single page (admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const page = await prisma.dynamicPage.findUnique({
        where: { id: Number(id) },
      });

      if (!page) {
        return NextResponse.json({ error: "Không tìm thấy trang" }, { status: 404 });
      }

      return NextResponse.json(page);
    }

    const pages = await prisma.dynamicPage.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(pages);
  } catch (error) {
    logger.error("Admin dynamic pages fetch error", error as Error, { context: "admin-pages-api" });
    return NextResponse.json({ error: "Lỗi khi lấy trang" }, { status: 500 });
  }
}

// POST - Create new page
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pageCreateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parsed.data;

    // Check for duplicate slug
    const existing = await prisma.dynamicPage.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }

    // Let Prisma autoincrement handle the ID (removed broken Number(crypto.randomUUID()))
    const page = await prisma.dynamicPage.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        image: data.image || null,
        template: data.template,
        type: data.type,
        isPublished: data.isPublished,
        isDefault: data.isDefault,
        order: data.order,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    logger.error("Admin dynamic page create error", error as Error, { context: "admin-pages-api" });
    return NextResponse.json({ error: "Lỗi khi tạo trang" }, { status: 500 });
  }
}

// PUT - Update page
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, slug, content, excerpt, metaTitle, metaDescription, image, template, type, isPublished, isDefault, order } = body;

    if (!id) {
      return NextResponse.json({ error: "ID là bắt buộc" }, { status: 400 });
    }

    // Check for duplicate slug (excluding current page)
    if (slug) {
      const existing = await prisma.dynamicPage.findFirst({
        where: { slug, NOT: { id } },
      });

      if (existing) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (image !== undefined) updateData.image = image;
    if (template !== undefined) updateData.template = template;
    if (type !== undefined) updateData.type = type;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (order !== undefined) updateData.order = order;

    const page = await prisma.dynamicPage.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json(page);
  } catch (error) {
    logger.error("Admin dynamic page update error", error as Error, { context: "admin-pages-api" });
    return NextResponse.json({ error: "Lỗi khi cập nhật trang" }, { status: 500 });
  }
}

// DELETE - Delete page
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

    await prisma.dynamicPage.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Xóa trang thành công" });
  } catch (error) {
    logger.error("Admin dynamic page delete error", error as Error, { context: "admin-pages-api" });
    return NextResponse.json({ error: "Lỗi khi xóa trang" }, { status: 500 });
  }
}
