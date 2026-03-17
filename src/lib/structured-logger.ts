/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * OBS-001: Structured Logging System
 *
 * Replaces ad-hoc console.log with JSON structured logs.
 * Adds: correlation IDs, log levels, context, timestamps.
 *
 * Usage:
 *   import { structuredLogger } from "@/lib/structured-logger";
 *   structuredLogger.info("Order created", { orderId, userId });
 *   structuredLogger.error("Payment failed", error, { orderId });
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "security";
type LogMeta = Record<string, unknown>;

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    correlationId?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    meta?: LogMeta;
    service: string;
    environment: string;
}

const SERVICE_NAME = "likefood";
const ENV = process.env.NODE_ENV || "development";
const isProduction = ENV === "production";

// Simple correlation ID generator
let correlationSeq = 0;
export function generateCorrelationId(): string {
    return `${Date.now()}-${++correlationSeq}`;
}

function formatEntry(
    level: LogLevel,
    message: string,
    error?: Error | null,
    meta?: LogMeta
): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: SERVICE_NAME,
        environment: ENV,
    };

    if (meta?.context) {
        entry.context = meta.context as string;
        const { context, ...rest } = meta;
        if (Object.keys(rest).length > 0) {
            entry.meta = rest;
        }
    } else if (meta && Object.keys(meta).length > 0) {
        entry.meta = meta;
    }

    if (meta?.correlationId) {
        entry.correlationId = meta.correlationId as string;
    }

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            ...(isProduction ? {} : { stack: error.stack }),
        };
    }

    return entry;
}

function emit(entry: LogEntry): void {
    const output = isProduction
        ? JSON.stringify(entry)
        : `[${entry.level.toUpperCase()}] ${entry.message}${entry.error ? ` | ${entry.error.message}` : ""}${entry.meta ? ` | ${JSON.stringify(entry.meta)}` : ""}`;

    switch (entry.level) {
        case "error":
        case "security":
            console.error(output);
            break;
        case "warn":
            console.warn(output);
            break;
        case "debug":
            if (!isProduction) console.log(output);
            break;
        default:
            console.log(output);
    }
}

export const structuredLogger = {
    debug(message: string, meta?: LogMeta) {
        if (!isProduction) emit(formatEntry("debug", message, null, meta));
    },

    info(message: string, meta?: LogMeta) {
        emit(formatEntry("info", message, null, meta));
    },

    warn(message: string, meta?: LogMeta) {
        emit(formatEntry("warn", message, null, meta));
    },

    error(message: string, error?: Error | null, meta?: LogMeta) {
        emit(formatEntry("error", message, error, meta));
    },

    security(message: string, meta?: LogMeta) {
        emit(formatEntry("security", `[SECURITY] ${message}`, null, meta));
    },
};
