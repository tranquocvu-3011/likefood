/**
 * LIKEFOOD - Admin Knowledge Base API
 * CRUD operations for AI Knowledge entries
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ─── GET: List knowledge entries ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (language) where.language = { in: [language, "both"] };
    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { keywords: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.aiKnowledge.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.aiKnowledge.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Knowledge GET error", error as Error, { context: "admin-knowledge-api" });
    return NextResponse.json({ error: "Failed to fetch knowledge" }, { status: 500 });
  }
}

// ─── POST: Create new knowledge entry ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, question, answer, keywords, language, priority } = body;

    if (!answer || !category) {
      return NextResponse.json({ error: "Category and answer are required" }, { status: 400 });
    }

    const item = await prisma.aiKnowledge.create({
      data: {
        category,
        question: question || null,
        answer,
        keywords: Array.isArray(keywords) ? keywords.join(",") : (keywords || null),
        language: language || "both",
        priority: priority ?? 5,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    logger.error("Knowledge POST error", error as Error, { context: "admin-knowledge-api" });
    return NextResponse.json({ error: "Failed to create knowledge" }, { status: 500 });
  }
}

// ─── PUT: Update knowledge entry ─────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (data.keywords && Array.isArray(data.keywords)) {
      data.keywords = data.keywords.join(",");
    }

    const item = await prisma.aiKnowledge.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    logger.error("Knowledge PUT error", error as Error, { context: "admin-knowledge-api" });
    return NextResponse.json({ error: "Failed to update knowledge" }, { status: 500 });
  }
}

// ─── DELETE: Delete knowledge entry ──────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.aiKnowledge.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Knowledge DELETE error", error as Error, { context: "admin-knowledge-api" });
    return NextResponse.json({ error: "Failed to delete knowledge" }, { status: 500 });
  }
}
