/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * SEC-003: CSRF Protection for API Mutations
 *
 * Uses double-submit cookie pattern:
 * 1. Server sets a CSRF token in a cookie
 * 2. Client reads the cookie and sends it in X-CSRF-Token header
 * 3. Server verifies header matches cookie
 *
 * This works because:
 * - An attacker cannot read cookies from another domain
 * - An attacker cannot set custom headers in cross-origin requests
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
    const array = new Uint8Array(TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Set CSRF token cookie (call this in page loaders or API endpoints)
 */
export async function setCSRFCookie(): Promise<string> {
    const token = generateToken();
    const cookieStore = await cookies();
    cookieStore.set(CSRF_COOKIE, token, {
        httpOnly: false, // Client JS needs to read this
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hour
    });
    return token;
}

/**
 * Verify CSRF token from request.
 * Returns error response if invalid, null if valid.
 */
export async function verifyCSRF(request: NextRequest): Promise<NextResponse | null> {
    // Skip for:
    // - GET, HEAD, OPTIONS (safe methods)
    // - Webhook endpoints (use their own signature verification)
    const method = request.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
        return null;
    }

    const headerToken = request.headers.get(CSRF_HEADER);
    const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;

    if (!headerToken || !cookieToken) {
        return NextResponse.json(
            { error: "Missing CSRF token. Please refresh the page and try again." },
            { status: 403 }
        );
    }

    if (headerToken !== cookieToken) {
        return NextResponse.json(
            { error: "Invalid CSRF token. Please refresh the page and try again." },
            { status: 403 }
        );
    }

    return null; // Valid
}

/**
 * Client-side helper: get CSRF token from cookie
 * Use this in your fetch calls: headers: { 'X-CSRF-Token': getCSRFToken() }
 */
export function getCSRFTokenScript(): string {
    return `
    function getCSRFToken() {
        const match = document.cookie.match(new RegExp('(^| )${CSRF_COOKIE}=([^;]+)'));
        return match ? match[2] : '';
    }
    `;
}
