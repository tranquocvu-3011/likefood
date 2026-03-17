/**
 * LIKEFOOD - API Error Response Utilities
 * Standardized error responses for all API routes
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode = 
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "SERVICE_UNAVAILABLE";

export interface ApiError {
  error: string;
  code: ErrorCode;
  details?: Record<string, string[]>;
  timestamp: string;
}

function getStatusCode(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    ALREADY_EXISTS: 409,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
    BAD_REQUEST: 400,
    CONFLICT: 409,
    SERVICE_UNAVAILABLE: 503,
  };
  return statusMap[code] || 500;
}

/**
 * Create a standardized API error response
 */
export function apiError(
  message: string,
  code: ErrorCode = "BAD_REQUEST",
  details?: Record<string, string[]>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status: getStatusCode(code) }
  );
}

/**
 * Create a validation error response from Zod
 */
export function validationError(error: ZodError): NextResponse<ApiError> {
  const issues = error.issues.reduce((acc, issue) => {
    const path = issue.path.join(".");
    if (!acc[path]) acc[path] = [];
    acc[path].push(issue.message);
    return acc;
  }, {} as Record<string, string[]>);

  return apiError("Validation failed", "VALIDATION_ERROR", issues);
}

/**
 * Create an unauthorized error response
 */
export function unauthorized(message = "Unauthorized"): NextResponse<ApiError> {
  return apiError(message, "UNAUTHORIZED");
}

/**
 * Create a forbidden error response
 */
export function forbidden(message = "Forbidden"): NextResponse<ApiError> {
  return apiError(message, "FORBIDDEN");
}

/**
 * Create a not found error response
 */
export function notFound(message = "Resource not found"): NextResponse<ApiError> {
  return apiError(message, "NOT_FOUND");
}

/**
 * Create a bad request error response
 */
export function badRequest(message = "Bad request"): NextResponse<ApiError> {
  return apiError(message, "BAD_REQUEST");
}

/**
 * Create an internal error response (without exposing details in production)
 */
export function internalError(
  message = "Internal server error",
  includeDetails = false
): NextResponse<ApiError> {
  const errorMessage = process.env.NODE_ENV === "production" && !includeDetails
    ? "Internal server error"
    : message;
  
  return apiError(errorMessage, "INTERNAL_ERROR");
}

/**
 * Create a rate limited error response
 */
export function rateLimited(message = "Too many requests"): NextResponse<ApiError> {
  return apiError(message, "RATE_LIMITED");
}

/**
 * Create an already exists error response
 */
export function alreadyExists(message = "Resource already exists"): NextResponse<ApiError> {
  return apiError(message, "ALREADY_EXISTS");
}

/**
 * Create a conflict error response
 */
export function conflict(message = "Conflict"): NextResponse<ApiError> {
  return apiError(message, "CONFLICT");
}
