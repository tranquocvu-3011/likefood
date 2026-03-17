/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/generated/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10) || 20));
    const search = (searchParams.get("search") || "").trim();
    const role = (searchParams.get("role") || "all").trim();
    const skip = (page - 1) * limit;

    const where: Prisma.userWhereInput = {};
    const and: Prisma.userWhereInput[] = [];

    if (search) {
      and.push({
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
        ],
      });
    }

    if (role !== "all") {
      and.push({ role: role as Prisma.userWhereInput["role"] });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Admin users list error", error as Error, { context: "admin-users-get" });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    const allowedRoles = ["USER", "ADMIN"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (String(userId) === String(session.user.id) && role !== "ADMIN") {
      return NextResponse.json({ error: "Không thể hạ quyền chính bạn" }, { status: 400 });
    }

    if (role !== "ADMIN") {
      const [superAdminCount, targetUser] = await Promise.all([
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      ]);

      if (targetUser?.role === "ADMIN" && superAdminCount <= 1) {
        return NextResponse.json({ error: "Admin cuối cùng không thể bị hạ quyền" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "Account role updated",
          message: `Your account role has been updated to ${role}.`,
          link: "/profile",
          type: "system",
          isRead: false,
        },
      });
    } catch (auditError) {
      logger.warn("Failed to write audit notification for role change", {
        error: auditError as Error,
        targetUserId: userId,
      });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error("Admin update user role error", error as Error, { context: "admin-users-post" });
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
