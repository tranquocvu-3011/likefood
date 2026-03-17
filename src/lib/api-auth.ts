/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * API Auth Helpers - Standardized authentication/authorization for API routes
 * Use these in all protected API routes to ensure consistency
 */

type UserRole = "USER" | "ADMIN" | "ADMIN";

/**
 * Require user to be authenticated
 * Returns session if valid, otherwise returns 401 response
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Vui lòng đăng nhập để tiếp tục" },
            { status: 401 }
        );
    }
    
    return session;
}

/**
 * Require specific role(s)
 * Returns session if user has any of the specified roles
 */
export async function requireRole(...roles: UserRole[]) {
    const session = await requireAuth();
    
    // If requireAuth returned NextResponse (error), return it
    if (session instanceof NextResponse) {
        return session;
    }
    
    const userRole = session.user.role as UserRole;
    
    if (!roles.includes(userRole)) {
        return NextResponse.json(
            { error: "Bạn không có quyền thực hiện hành động này" },
            { status: 403 }
        );
    }
    
    return session;
}

/**
 * Require admin role (ADMIN or ADMIN)
 */
export async function requireAdmin() {
    return requireRole("ADMIN");
}

/**
 * Require super admin role only
 */
export async function requireSuperAdmin() {
    return requireRole("ADMIN");
}

/**
 * Helper to check if request is from admin (for optional admin checks)
 */
export async function isAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return false;
    
    const role = session.user.role as string;
    return role === "ADMIN" || role === "ADMIN";
}

/**
 * Helper to get current user ID or return error
 */
export async function getCurrentUserId(): Promise<string | NextResponse> {
    const session = await requireAuth();
    
    if (session instanceof NextResponse) {
        return session;
    }
    
    return String(session.user.id);
}
