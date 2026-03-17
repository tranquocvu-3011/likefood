/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * API-002: Standardized Pagination Helper
 *
 * Provides consistent pagination format for all list endpoints:
 * { data: T[], meta: { page, limit, total, totalPages } }
 *
 * Usage:
 *   const result = await paginatedQuery(prisma.product, {
 *       where: { isDeleted: false },
 *       orderBy: { createdAt: "desc" },
 *   }, req);
 */

import { NextRequest } from "next/server";

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Extract pagination params from request URL
 */
export function getPaginationParams(req: NextRequest): { page: number; limit: number; skip: number } {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const rawLimit = parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
}

/**
 * Build pagination meta from count and params
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

/**
 * Create a paginated response object
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
    return {
        data,
        meta: buildPaginationMeta(total, page, limit),
    };
}

/**
 * Generic paginated query helper for Prisma models
 * Works with any Prisma model that supports findMany + count
 */
export async function paginatedQuery<T>(
    model: {
        findMany: (args: Record<string, unknown>) => Promise<T[]>;
        count: (args: { where?: Record<string, unknown> }) => Promise<number>;
    },
    queryArgs: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, unknown> | Record<string, unknown>[];
        include?: Record<string, unknown>;
        select?: Record<string, unknown>;
    },
    req: NextRequest
): Promise<PaginatedResponse<T>> {
    const { page, limit, skip } = getPaginationParams(req);

    const [data, total] = await Promise.all([
        model.findMany({
            ...queryArgs,
            skip,
            take: limit,
        }),
        model.count({ where: queryArgs.where }),
    ]);

    return paginatedResponse(data, total, page, limit);
}
