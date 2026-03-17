/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Cache utility tests
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getCache, setCache, invalidateCache, invalidateCacheKey } from '@/lib/cache';

// Cache module uses in-memory fallback when Redis is not configured
// In test environment, Redis is not configured so all tests use in-memory store

describe('Cache Utils (in-memory fallback)', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await invalidateCache('test');
  });

  it('should return null for a missing key', async () => {
    const result = await getCache('nonexistent-key', 'test');
    expect(result).toBeNull();
  });

  it('should store and retrieve a value', async () => {
    await setCache('user-1', { name: 'Quoc Vu', email: 'test@example.com' }, { prefix: 'test', ttl: 60 });
    const result = await getCache<{ name: string; email: string }>('user-1', 'test');
    expect(result).toEqual({ name: 'Quoc Vu', email: 'test@example.com' });
  });

  it('should store different value types', async () => {
    await setCache('number', 42, { prefix: 'test', ttl: 60 });
    await setCache('array', [1, 2, 3], { prefix: 'test', ttl: 60 });
    await setCache('string', 'hello', { prefix: 'test', ttl: 60 });

    expect(await getCache('number', 'test')).toBe(42);
    expect(await getCache('array', 'test')).toEqual([1, 2, 3]);
    expect(await getCache('string', 'test')).toBe('hello');
  });

  it('should invalidate specific key', async () => {
    await setCache('key-a', 'value-a', { prefix: 'test', ttl: 60 });
    await setCache('key-b', 'value-b', { prefix: 'test', ttl: 60 });
    await invalidateCacheKey('key-a', 'test');

    expect(await getCache('key-a', 'test')).toBeNull();
    expect(await getCache('key-b', 'test')).toBe('value-b');
  });

  it('should invalidate all keys by prefix', async () => {
    await setCache('p1', 'val1', { prefix: 'test', ttl: 60 });
    await setCache('p2', 'val2', { prefix: 'test', ttl: 60 });
    await invalidateCache('test');

    expect(await getCache('p1', 'test')).toBeNull();
    expect(await getCache('p2', 'test')).toBeNull();
  });

  it('should return null for expired entries', async () => {
    // Set with extremely short TTL (0 seconds = immediate expire)
    await setCache('expired-key', 'expired-value', { prefix: 'test', ttl: 0 });
    // Wait a tick for time to pass
    await new Promise((resolve) => setTimeout(resolve, 10));
    const result = await getCache('expired-key', 'test');
    expect(result).toBeNull();
  });
});
