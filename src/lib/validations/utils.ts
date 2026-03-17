/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { ZodError } from 'zod';

/**
 * Validation utilities for API routes
 * Helps format Zod validation errors consistently
 */

/**
 * Format Zod validation errors into friendly error messages
 */
export function formatZodError(error: ZodError) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
        code: issue.code,
    }));
}

/**
 * Create a standard validation error response
 */
export function validationErrorResponse(error: ZodError) {
    return {
        error: 'Dữ liệu không hợp lệ',
        errors: formatZodError(error),
    };
}

// Export type
export type ValidationError = ReturnType<typeof formatZodError>[number];
