/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Admin Authorization Helper
 * Centralized admin role checking utilities
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Session } from "next-auth";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

interface AuthResult {
  authorized: boolean;
  error?: NextResponse;
  session?: Session;
  role?: UserRole;
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { authorized: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { authorized: true, session };
}

/**
 * Check if user has admin role (ADMIN or SUPER_ADMIN)
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.authorized || !auth.session) return { authorized: false, error: auth.error };

  const role = (auth.session.user.role as UserRole) || "USER";
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }) 
    };
  }
  return { authorized: true, session: auth.session, role };
}

/**
 * Check if user has super admin role
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.role) return { authorized: false, error: auth.error };

  if (auth.role !== "SUPER_ADMIN") {
    return { 
      authorized: false, 
      error: NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 }) 
    };
  }
  return { authorized: true, session: auth.session, role: auth.role };
}

/**
 * Helper to check if a role is admin-level
 */
export function isAdminRole(role?: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Get user role from session
 */
export function getUserRole(session: { user: { role?: string } }): UserRole {
  return (session.user.role as UserRole) || "USER";
}
