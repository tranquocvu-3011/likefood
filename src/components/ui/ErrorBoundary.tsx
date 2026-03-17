"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * UX-002: Enhanced Error Boundary Component
 *
 * Catches React rendering errors and displays user-friendly fallback.
 * Can be wrapped around any section of the app for granular error handling.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *       <MyComponent />
 *   </ErrorBoundary>
 */

import React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.props.onError?.(error, errorInfo);

        // Report to Sentry if available
        if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).Sentry) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).Sentry.captureException(error, { extra: errorInfo });
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        borderRadius: "12px",
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        margin: "1rem",
                    }}
                >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
                    <h3 style={{ color: "#dc2626", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                        Đã xảy ra lỗi
                    </h3>
                    <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1rem" }}>
                        Vui lòng tải lại trang hoặc thử lại sau.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            padding: "0.5rem 1.5rem",
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
