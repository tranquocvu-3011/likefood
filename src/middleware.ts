/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Next.js Middleware — Route Protection & Security
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/profile",
  "/orders",
  "/wishlist",
  "/notifications",
  "/checkout",
];

// Admin routes require ADMIN role
const ADMIN_ROUTES = ["/admin"];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  "/api/admin",
  "/api/user",
];

// Public routes — never redirect these
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
  "/api/chat",
  "/api/products",
  "/api/search",
  "/api/reviews/public",
  "/api/n8n",
  "/api/webhooks",
  "/api/ai/chat",
  "/api/ai/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes, static files, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") || // static files
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ── Admin Routes ──
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    // Allow admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // ── Protected API Routes ──
  if (PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    // Admin API routes require ADMIN role
    if (pathname.startsWith("/api/admin") && token.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // ── Protected Pages ──
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Security Headers for all responses ──
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Cross-Origin-Resource-Policy",
    "same-site"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.png
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|images/|uploads/|sanpham/|categories/|donggoi/|og-image\\.png|manifest\\.json|sw\\.js|icon-192\\.png|icon-512\\.png).*)",
  ],
};
