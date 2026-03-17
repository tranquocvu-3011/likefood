/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Rate Limiting with Upstash Redis
 * Protects API routes from abuse
 *
 * SETUP REQUIRED:
 * 1. Create Upstash Redis database (free tier): https://upstash.com
 * 2. Add to .env:
 *    UPSTASH_REDIS_REST_URL=your_url_here
 *    UPSTASH_REDIS_REST_TOKEN=your_token_here
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured =
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN;

// Enforce Redis in production - warn and allow fallback to memory
if (!isRedisConfigured && process.env.NODE_ENV === 'production') {
    console.error(
        '⛔ CRITICAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not set in production. ' +
        'Rate limiting will use in-memory fallback (NOT SUITABLE for production). ' +
        'This will fail in production build. Configure Upstash Redis or set up a local Redis instance.'
    );
}

// Warn in development only
if (!isRedisConfigured && process.env.NODE_ENV !== 'production') {
    console.warn(
        '⚠️ WARNING: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not set. ' +
        'Rate limiting will use in-memory fallback (not suitable for production).'
    );
}

// Initialize Redis client
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

// Fallback in-memory store for dev/local
const memoryStore = new Map<string, { count: number; reset: number }>();

/**
 * Login Rate Limiter
 * 5 attempts per 15 minutes
 */
export const loginRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit:login',
    })
    : null;

/**
 * Register Rate Limiter
 * 3 attempts per hour
 */
export const registerRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:register',
    })
    : null;

/**
 * Checkout/Order Rate Limiter
 * 10 orders per hour
 */
export const checkoutRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        analytics: true,
        prefix: 'ratelimit:checkout',
    })
    : null;

/**
 * General API Rate Limiter
 * 100 requests per minute
 */
export const apiRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api',
    })
    : null;

/**
 * OTP Verification Rate Limiter
 * 5 attempts per 15 minutes - prevents brute force attacks on 2FA
 */
export const otpRateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit:otp',
    })
    : null;

/**
 * Admin 2FA Verify Rate Limiter (stricter)
 * 3 attempts per 10 minutes - protect admin 2FA
 */
export const admin2FARateLimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '10 m'),
        analytics: true,
        prefix: 'ratelimit:admin2fa',
    })
    : null;

/**
 * Helper function to apply rate limiting
 * Returns success boolean and error response if limited
 */
export async function applyRateLimit(
    identifier: string,
    limiter: Ratelimit | null,
    config?: { windowMs: number; maxRequests: number }
): Promise<{ success: boolean; error?: Response }> {
    // If Redis configured, use Upstash
    if (limiter) {
        try {
            const { success, limit, remaining, reset } = await limiter.limit(identifier);

            if (!success) {
                const retryAfter = Math.ceil((reset - Date.now()) / 1000);
                return {
                    success: false,
                    error: createErrorResponse(retryAfter, limit, remaining, reset),
                };
            }
            return { success: true };
        } catch (error) {
            console.error('Redis rate limit failed, falling back to memory:', error);
        }
    }

    // Fallback to in-memory rate limiting (Dev/Local)
    const now = Date.now();
    const windowMs = config?.windowMs || 60 * 1000;
    const maxRequests = config?.maxRequests || 100;

    // Clean up memory store occasionally
    if (memoryStore.size > 1000) {
        for (const [key, val] of memoryStore.entries()) {
            if (val.reset < now) memoryStore.delete(key);
        }
    }

    const key = `${(limiter as unknown as { prefix?: string })?.prefix || 'memory'}:${identifier}`;
    const record = memoryStore.get(key);

    if (!record || record.reset < now) {
        memoryStore.set(key, { count: 1, reset: now + windowMs });
        return { success: true };
    }

    if (record.count >= maxRequests) {
        const retryAfter = Math.ceil((record.reset - now) / 1000);
        return {
            success: false,
            error: createErrorResponse(retryAfter, maxRequests, 0, record.reset),
        };
    }

    record.count++;
    return { success: true };
}

function createErrorResponse(retryAfter: number, limit: number, remaining: number, reset: number) {
    return new Response(
        JSON.stringify({
            error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
            retryAfter,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': new Date(reset).toISOString(),
            },
        }
    );
}

/**
 * Get identifier for rate limiting
 * Uses IP address or user ID
 */
export function getRateLimitIdentifier(request: Request, userId?: string | number): string {
    if (userId) return `user:${userId}`;
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] ?? realIp ?? 'unknown';
    return `ip:${ip}`;
}

export { redis };
