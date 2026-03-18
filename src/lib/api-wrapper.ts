/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * API Route Wrapper Utilities
 * 
 * Provides composable middleware pattern for API routes:
 * - withAuth: Require authentication
 * - withAdmin: Require admin role
 * - withRateLimit: Apply rate limiting
 * - withValidation: Validate request body with Zod
 * - withErrorHandler: Centralized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyRateLimit, getRateLimitIdentifier, apiRateLimit } from "@/lib/ratelimit";
import type { ZodSchema, ZodError } from "zod";

/** Extended request with parsed body and session */
export interface ApiContext {
  session: {
    user: {
      id: number;
      email: string;
      role: string;
      name?: string;
      image?: string | null;
    };
  };
  body?: unknown;
}

type ApiHandler = (
  req: NextRequest,
  ctx: ApiContext,
  params?: Record<string, string>
) => Promise<NextResponse | Response>;

/**
 * Centralized error handler wrapper
 * Catches all errors and returns consistent JSON responses
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, ctx, params) => {
    try {
      return await handler(req, ctx, params);
    } catch (error) {
      console.error(`[API_ERROR] ${req.method} ${req.url}:`, error);

      if (error instanceof Error) {
        // Zod validation error
        if ("issues" in error) {
          const zodError = error as ZodError;
          return NextResponse.json(
            {
              error: "Dữ liệu không hợp lệ",
              details: zodError.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
              })),
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: error.message || "Lỗi hệ thống" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Đã xảy ra lỗi không xác định" },
        { status: 500 }
      );
    }
  };
}

/**
 * Require authenticated user
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return withErrorHandler(async (req, ctx, params) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để tiếp tục" },
        { status: 401 }
      );
    }

    ctx.session = session as ApiContext["session"];
    return handler(req, ctx, params);
  });
}

/**
 * Require admin role
 */
export function withAdmin(handler: ApiHandler): ApiHandler {
  return withAuth(async (req, ctx, params) => {
    if (ctx.session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }
    return handler(req, ctx, params);
  });
}

/**
 * Apply rate limiting
 */
export function withRateLimit(
  handler: ApiHandler,
  options?: { windowMs?: number; maxRequests?: number }
): ApiHandler {
  return withErrorHandler(async (req, ctx, params) => {
    const identifier = getRateLimitIdentifier(
      req,
      ctx.session?.user?.id?.toString()
    );
    const result = await applyRateLimit(identifier, apiRateLimit, {
      windowMs: options?.windowMs || 60_000,
      maxRequests: options?.maxRequests || 100,
    });

    if (!result.success && result.error) {
      return result.error;
    }

    return handler(req, ctx, params);
  });
}

/**
 * Validate request body with Zod schema
 */
export function withValidation<T>(
  handler: (
    req: NextRequest,
    ctx: ApiContext & { body: T },
    params?: Record<string, string>
  ) => Promise<NextResponse | Response>,
  schema: ZodSchema<T>
): ApiHandler {
  return withErrorHandler(async (req, ctx, params) => {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body không hợp lệ (JSON)" },
        { status: 400 }
      );
    }

    const result = schema.safeParse(rawBody);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          details: result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const extendedCtx = ctx as ApiContext & { body: T };
    extendedCtx.body = result.data;
    return handler(req, extendedCtx, params);
  });
}

/**
 * Compose multiple middleware wrappers
 * Usage: compose(withAuth, withRateLimit)(handler)
 */
export function compose(
  ...wrappers: ((handler: ApiHandler) => ApiHandler)[]
): (handler: ApiHandler) => ApiHandler {
  return (handler) => {
    return wrappers.reduceRight((acc, wrapper) => wrapper(acc), handler);
  };
}
