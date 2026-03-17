/**
 * LIKEFOOD - Homepage Sections API (Public)
 * Get active homepage sections
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
// GET - Get all active homepage sections (public)
export async function GET() {
  try {
    const now = new Date();
    
    const sections = await prisma.homepageSection.findMany({
      where: {
        isActive: true,
        OR: [
          { startAt: null },
          { startAt: { lte: now } },
        ],
      },
      orderBy: { position: "asc" },
    });

    // Filter out sections that have ended
    const activeSections = sections.filter(
      (section) => !section.endAt || new Date(section.endAt) > now
    );

    return NextResponse.json(activeSections);
  } catch (error) {
    logger.error("Homepage sections fetch error", error as Error, { context: "homepage-sections-api" });
    return NextResponse.json({ error: "Lỗi khi lấy sections" }, { status: 500 });
  }
}
