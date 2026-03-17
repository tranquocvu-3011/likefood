/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * SEC-006: API Route Input Validation Wrapper
 *
 * Provides a standardized wrapper to apply Zod validation to API routes.
 * Eliminates need to manually validate in every route handler.
 *
 * Usage:
 *   import { withValidation } from "@/lib/api-validation";
 *   import { z } from "zod";
 *
 *   const bodySchema = z.object({ name: z.string().min(1), price: z.number().min(0) });
 *
 *   export const POST = withValidation({ body: bodySchema }, async (req, { body }) => {
 *       // body is fully typed and validated
 *       return NextResponse.json({ success: true });
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

interface ValidatedData {
    body?: unknown;
    query?: Record<string, string>;
    params?: unknown;
}

/**
 * Wrap API route handler with automatic Zod validation
 */
export function withValidation<T extends ValidatedData>(
    schemas: ValidationSchemas,
    handler: (req: NextRequest, data: T, ctx?: unknown) => Promise<NextResponse>
) {
    return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
        try {
            const data: ValidatedData = {};

            // Validate request body (for POST/PUT/PATCH)
            if (schemas.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
                try {
                    const rawBody = await req.json();
                    data.body = schemas.body.parse(rawBody);
                } catch (error) {
                    if (error instanceof ZodError) {
                        return NextResponse.json(
                            {
                                error: "Dữ liệu không hợp lệ",
                                code: "VALIDATION_ERROR",
                                details: error.issues.map((i) => ({
                                    field: i.path.join("."),
                                    message: i.message,
                                    code: i.code,
                                })),
                            },
                            { status: 400 }
                        );
                    }
                    return NextResponse.json(
                        { error: "Dữ liệu request không hợp lệ", code: "BAD_REQUEST" },
                        { status: 400 }
                    );
                }
            }

            // Validate query parameters
            if (schemas.query) {
                const url = new URL(req.url);
                const queryParams: Record<string, string> = {};
                url.searchParams.forEach((value, key) => {
                    queryParams[key] = value;
                });

                try {
                    data.query = schemas.query.parse(queryParams) as Record<string, string>;
                } catch (error) {
                    if (error instanceof ZodError) {
                        return NextResponse.json(
                            {
                                error: "Query parameters không hợp lệ",
                                code: "VALIDATION_ERROR",
                                details: error.issues.map((i) => ({
                                    field: i.path.join("."),
                                    message: i.message,
                                    code: i.code,
                                })),
                            },
                            { status: 400 }
                        );
                    }
                    throw error;
                }
            }

            return await handler(req, data as T, ctx);
        } catch (error) {
            console.error("[API Validation Error]", error);
            const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
            return NextResponse.json({ error: message, code: "INTERNAL_ERROR" }, { status: 500 });
        }
    };
}
