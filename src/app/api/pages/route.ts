/**
 * LIKEFOOD - Dynamic Pages API (Public)
 * Get published dynamic pages
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
// GET - Get all published pages or single page by slug
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const page = await prisma.dynamicPage.findUnique({
        where: { slug, isPublished: true },
      });

      if (!page) {
        return NextResponse.json({ error: "Không tìm thấy trang" }, { status: 404 });
      }

      return NextResponse.json(page);
    }

    // Get all published pages
    const pages = await prisma.dynamicPage.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        template: true,
        type: true,
        image: true,
        createdAt: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(pages);
  } catch (error) {
    logger.error("Dynamic pages fetch error", error as Error, { context: "pages-api" });
    return NextResponse.json({ error: "Lỗi khi lấy trang" }, { status: 500 });
  }
}
