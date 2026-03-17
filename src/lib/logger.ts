/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Centralized error logging utility.
 * Automatically captures errors to Sentry in production when SENTRY_DSN is set.
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LogContext = Record<string, unknown> & {
    userId?: string;
    requestId?: string;
};

class Logger {
    private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...context,
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            }),
        };

        // Console logging
        if (level === 'error') {
            console.error(`[${timestamp}] [${level.toUpperCase()}]`, message, logEntry);
        } else if (level === 'warn') {
            console.warn(`[${timestamp}] [${level.toUpperCase()}]`, message, logEntry);
        } else {
            console.log(`[${timestamp}] [${level.toUpperCase()}]`, message, logEntry);
        }
    }

    info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    error(message: string, error?: Error, context?: LogContext) {
        this.log('error', message, context, error);

        // Capture to Sentry in production
        if (process.env.SENTRY_DSN) {
            Sentry.withScope((scope) => {
                if (context?.userId) scope.setUser({ id: context.userId as string });
                if (context) scope.setExtras(context as Record<string, unknown>);
                scope.setTag('logger', 'true');
                if (error) {
                    Sentry.captureException(error);
                } else {
                    Sentry.captureMessage(message, 'error');
                }
            });
        }
    }

    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === 'development') {
            this.log('debug', message, context);
        }
    }

    /**
     * Log security events specifically
     */
    security(message: string, details: Record<string, unknown>) {
        this.log('warn', `[SECURITY] ${message}`, {
            ...details,
            securityEvent: true,
        });
    }

    /**
     * Log API request/response
     */
    api(method: string, path: string, statusCode: number, duration?: number) {
        this.log(statusCode >= 400 ? 'warn' : 'info', `${method} ${path}`, {
            httpStatus: statusCode,
            duration: duration ? `${duration}ms` : undefined,
        });
    }
}

export const logger = new Logger();
