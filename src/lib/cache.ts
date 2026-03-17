/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Caching utilities for API responses
 * Uses in-memory cache when Redis is not configured (dev/low-traffic)
 * Uses Upstash Redis when configured (production)
 */

import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured =
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client for caching
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

// In-memory fallback cache (used when Redis is not configured)
interface MemoryCacheEntry<T> {
    data: T;
    expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheEntry<unknown>>();

// Evict expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of memoryCache.entries()) {
            if (v.expiresAt <= now) memoryCache.delete(k);
        }
    }, 5 * 60 * 1000);
}

/**
 * Cache options
 */
export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    prefix?: string; // Cache key prefix
}

/**
 * Default cache TTLs
 */
export const CACHE_TTL = {
    PRODUCTS_LIST: 5 * 60, // 5 minutes
    PRODUCT_DETAIL: 10 * 60, // 10 minutes
    CATEGORIES: 15 * 60, // 15 minutes
    BRANDS: 15 * 60, // 15 minutes
    SETTINGS: 30 * 60, // 30 minutes
    FLASH_SALES: 2 * 60, // 2 minutes
};

/**
 * Get cache key
 */
function getCacheKey(prefix: string, key: string): string {
    return `${prefix || 'cache'}:${key}`;
}

/**
 * Get data from cache
 */
export async function getCache<T>(key: string, prefix = 'api'): Promise<T | null> {
    try {
        const fullKey = getCacheKey(prefix, key);
        if (redis) {
            const data = await redis.get<T>(fullKey);
            return data;
        }
        // In-memory fallback
        const entry = memoryCache.get(fullKey) as MemoryCacheEntry<T> | undefined;
        if (entry && entry.expiresAt > Date.now()) {
            return entry.data;
        }
        memoryCache.delete(fullKey);
        return null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}

/**
 * Set data to cache
 */
export async function setCache<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
): Promise<void> {
    try {
        const { ttl = 300, prefix = 'api' } = options;
        const fullKey = getCacheKey(prefix, key);
        if (redis) {
            await redis.set(fullKey, data, { ex: ttl });
        } else {
            // In-memory fallback
            memoryCache.set(fullKey, { data, expiresAt: Date.now() + ttl * 1000 });
        }
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

/**
 * Invalidate cache by prefix
 */
export async function invalidateCache(prefix: string): Promise<void> {
    try {
        if (redis) {
            const keys = await redis.keys(`${prefix}:*`);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } else {
            // In-memory fallback
            for (const k of memoryCache.keys()) {
                if (k.startsWith(`${prefix}:`)) memoryCache.delete(k);
            }
        }
    } catch (error) {
        console.error('Cache invalidate error:', error);
    }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCacheKey(key: string, prefix = 'api'): Promise<void> {
    try {
        const fullKey = getCacheKey(prefix, key);
        if (redis) {
            await redis.del(fullKey);
        } else {
            memoryCache.delete(fullKey);
        }
    } catch (error) {
        console.error('Cache invalidate key error:', error);
    }
}
