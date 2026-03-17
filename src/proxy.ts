/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const CSRF_SENSITIVE_PATHS = [
    "/api/orders",
    "/api/cart",
    "/api/cart/items",
    "/api/reviews",
    "/api/auth",
    "/api/admin",
    "/api/user",
];

const SUPER_ADMIN_ONLY_ROUTES = [
    "/api/admin/users",
    "/api/admin/users/",
];

const ADMIN_COOKIE_SECRET = process.env.ADMIN_2FA_SECRET || process.env.NEXTAUTH_SECRET;
const ADMIN_COOKIE_MAX_AGE = 10 * 60;

const enc = new TextEncoder();

function hexToBuffer(hex: string): ArrayBuffer {
    const pairs = hex.match(/.{1,2}/g) ?? [];
    const arr = new Uint8Array(pairs.map((b) => parseInt(b, 16)));
    return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

function bufferToHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

async function getHmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
    return globalThis.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        [usage]
    );
}

async function signAdminCookie(value: string): Promise<string> {
    if (!ADMIN_COOKIE_SECRET) throw new Error("Missing ADMIN_COOKIE_SECRET");
    const key = await getHmacKey(ADMIN_COOKIE_SECRET, "sign");
    const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(value));
    return `${value}.${bufferToHex(sig)}`;
}

async function verifyAdminCookie(signedValue: string): Promise<{ valid: boolean; value: string }> {
    try {
        if (!ADMIN_COOKIE_SECRET) return { valid: false, value: "" };
        const dotIdx = signedValue.lastIndexOf(".");
        if (dotIdx === -1) return { valid: false, value: "" };
        const value = signedValue.slice(0, dotIdx);
        const signature = signedValue.slice(dotIdx + 1);
        const key = await getHmacKey(ADMIN_COOKIE_SECRET, "verify");
        const valid = await globalThis.crypto.subtle.verify(
            "HMAC",
            key,
            hexToBuffer(signature),
            enc.encode(value)
        );
        return { valid, value: valid ? value : "" };
    } catch {
        return { valid: false, value: "" };
    }
}

function isCsrfSensitivePath(pathname: string) {
    return CSRF_SENSITIVE_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function isSuperAdminOnlyRoute(pathname: string) {
    return SUPER_ADMIN_ONLY_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

export default withAuth(
    async function middleware(req) {
        const token = req.nextauth.token;
        const isAdmin = token?.role === "ADMIN";
        const isSuperAdmin = token?.role === "ADMIN";
        const pathname = req.nextUrl.pathname;
        const method = req.method.toUpperCase();

        if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/verify")) {
            if (!isAdmin) {
                return NextResponse.redirect(new URL("/", req.url));
            }

            const adminAuthSession = req.cookies.get("admin_auth_session");
            const sessionValue = adminAuthSession?.value;

            if (!sessionValue) {
                return NextResponse.redirect(new URL("/admin/verify", req.url));
            }

            const verification = await verifyAdminCookie(sessionValue);
            if (!verification.valid || !verification.value.startsWith("verified:")) {
                return NextResponse.redirect(new URL("/admin/verify", req.url));
            }

            const [, timestampStr] = verification.value.split(":");
            const expiresAt = parseInt(timestampStr, 10);

            if (isNaN(expiresAt) || Date.now() > expiresAt) {
                const response = NextResponse.redirect(new URL("/admin/verify", req.url));
                response.cookies.delete("admin_auth_session");
                return response;
            }
        }

        if (pathname.startsWith("/api/admin/")) {
            if (!isAdmin) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const adminApiSession = req.cookies.get("admin_auth_session");
            const apiSessionValue = adminApiSession?.value;
            if (!apiSessionValue) {
                return NextResponse.json({ error: "Admin session required" }, { status: 401 });
            }
            const apiVerification = await verifyAdminCookie(apiSessionValue);
            if (!apiVerification.valid || !apiVerification.value.startsWith("verified:")) {
                return NextResponse.json({ error: "Admin session invalid" }, { status: 401 });
            }
            const [, apiTimestampStr] = apiVerification.value.split(":");
            const apiExpiresAt = parseInt(apiTimestampStr, 10);
            if (isNaN(apiExpiresAt) || Date.now() > apiExpiresAt) {
                return NextResponse.json({ error: "Admin session expired" }, { status: 401 });
            }
        }

        if (isSuperAdminOnlyRoute(pathname) && ["POST","PUT","PATCH","DELETE"].includes(method)) {
            if (!isSuperAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: Super Admin only" },
                    { status: 403 }
                );
            }
        }

        if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && isCsrfSensitivePath(pathname)) {
            const origin = req.headers.get("origin");
            const host = req.headers.get("host");

            if (origin && host) {
                try {
                    const url = new URL(origin);
                    const originHost = url.host;
                    const normalizedOriginHost = originHost.replace(/^https?:\/\//, '');
                    
                    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
                    const isSameOrigin = normalizedOriginHost === host || originHost === host;
                    
                    // Check nếu origin nằm trong danh sách ALLOWED_ORIGIN
                    const allowedOriginEnv = process.env.ALLOWED_ORIGIN || "";
                    const allowedOrigins = allowedOriginEnv.split(",").map(o => o.trim()).filter(Boolean);
                    const isAllowedOrigin = allowedOrigins.includes(origin);
                    
                    if (!isLocalhost && !isSameOrigin && !isAllowedOrigin) {
                        return new NextResponse(
                            JSON.stringify({ error: "Invalid origin" }),
                            { status: 403, headers: { "Content-Type": "application/json" } }
                        );
                    }
                } catch {
                    return new NextResponse(
                        JSON.stringify({ error: "Invalid origin" }),
                        { status: 403, headers: { "Content-Type": "application/json" } }
                    );
                }
            }
        }

        const response = NextResponse.next();

        const nonce = globalThis.crypto.randomUUID().replace(/-/g, "");
        response.headers.set("x-nonce", nonce);

        const requestId = globalThis.crypto.randomUUID();
        response.headers.set("x-request-id", requestId);

        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("Referrer-Policy", "origin-when-cross-origin");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()"
        );

        if (pathname.startsWith("/api/")) {
            const allowedOriginEnv = process.env.ALLOWED_ORIGIN;
            
            if (process.env.NODE_ENV === "production" && !allowedOriginEnv) {
                throw new Error("CRITICAL: ALLOWED_ORIGIN environment variable must be set in production!");
            }
            
            if (allowedOriginEnv) {
                // Hỗ trợ nhiều origin cách nhau bởi dấu phẩy
                const allowedOrigins = allowedOriginEnv.split(",").map(o => o.trim());
                const requestOrigin = req.headers.get("origin");
                
                if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
                    response.headers.set("Access-Control-Allow-Origin", requestOrigin);
                    response.headers.set("Vary", "Origin");
                } else if (allowedOrigins.length === 1) {
                    // Fallback: nếu chỉ có 1 origin thì set trực tiếp (backward compatible)
                    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
                }
            }
            response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.headers.set("Access-Control-Allow-Credentials", "true");
            response.headers.set("Access-Control-Max-Age", "86400");
        }

        if (process.env.NODE_ENV === "production") {
            response.headers.set(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload"
            );
            response.headers.set(
                "Content-Security-Policy",
                [
                    "default-src 'self'",
                    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`,
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "img-src 'self' data: https: blob:",
                    "font-src 'self' https://fonts.gstatic.com",
                    "connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.stripe.network https://www.google-analytics.com https://vitals.vercel-insights.com",
                    "frame-src https://js.stripe.com https://*.stripe.com https://www.google.com https://maps.google.com",
                    "frame-ancestors 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                ].join("; ")
            );
        } else {
            response.headers.set(
                "Content-Security-Policy",
                [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-hashes' https://www.googletagmanager.com https://www.google-analytics.com",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "img-src 'self' data: https: blob:",
                    "font-src 'self' https://fonts.gstatic.com",
                    "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com ws://localhost:* wss://localhost:*",
                    "frame-src 'self' https://www.google.com https://maps.google.com https://js.stripe.com https://*.stripe.com",
                    "frame-ancestors 'none'",
                ].join("; ")
            );
        }

        const isAdminApiPath = pathname.startsWith("/api/admin/");
        const isAdminUiPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/verify");
        if (isAdminUiPath || (isAdminApiPath && isAdmin)) {
            // Sliding window: 10 phút mỗi request
            // Absolute max: 2 giờ từ lần verify đầu tiên
            const ABSOLUTE_MAX_MS = 2 * 60 * 60 * 1000; // 2 hours hard limit

            // Check existing cookie for original verify time
            const existingSession = req.cookies.get("admin_auth_session");
            let originalVerifyTime = Date.now();

            if (existingSession?.value) {
                const existing = await verifyAdminCookie(existingSession.value);
                if (existing.valid && existing.value.startsWith("verified:")) {
                    const parts = existing.value.split(":");
                    // Format: verified:<slidingExpiry>:<originalVerifyTime>
                    if (parts.length >= 3) {
                        originalVerifyTime = parseInt(parts[2], 10);
                    }
                }
            }

            // Check absolute expiry
            if (Date.now() - originalVerifyTime > ABSOLUTE_MAX_MS) {
                // Absolute expiry exceeded — force re-verify
                const response = NextResponse.redirect(new URL("/admin/verify", req.url));
                response.cookies.delete("admin_auth_session");
                return response;
            }

            const expiresAt = Date.now() + 10 * 60 * 1000;
            const rawValue = `verified:${expiresAt}:${originalVerifyTime}`;
            const signedValue = await signAdminCookie(rawValue);
            
            response.cookies.set({
                name: "admin_auth_session",
                value: signedValue,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: ADMIN_COOKIE_MAX_AGE,
                path: "/",
            });
        }

        return response;
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;

                if (
                    pathname.startsWith("/profile") ||
                    pathname.startsWith("/orders") ||
                    (pathname.startsWith("/admin") && pathname !== "/admin/login")
                ) {
                    return !!token;
                }
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/profile/:path*",
        // Only protect API routes that need auth/security — NOT public data routes
        "/api/admin/:path*",
        "/api/user/:path*",
        "/api/orders/:path*",
        "/api/cart/:path*",
        "/api/auth/:path*",
        "/api/reviews/:path*",
        "/api/payments/:path*",
        "/api/webhooks/:path*",
        "/orders/:path*",
    ],
};
