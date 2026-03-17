"use client";

/**
 * LIKEFOOD — SEO-004: Core Web Vitals Reporter
 *
 * Captures LCP, CLS, TTFB, INP and sends to analytics.
 * Note: FID was removed in web-vitals v4, replaced by INP.
 * Mount once in layout.tsx to track all pages.
 */

import { useEffect } from "react";

interface WebVitalMetric {
    name: string;
    value: number;
    id: string;
    delta: number;
    rating: "good" | "needs-improvement" | "poor";
}

function getRating(name: string, value: number): WebVitalMetric["rating"] {
    const thresholds: Record<string, [number, number]> = {
        LCP: [2500, 4000],
        CLS: [0.1, 0.25],
        INP: [200, 500],
        TTFB: [800, 1800],
    };

    const [good, poor] = thresholds[name] || [Infinity, Infinity];
    if (value <= good) return "good";
    if (value <= poor) return "needs-improvement";
    return "poor";
}

function sendToAnalytics(metric: WebVitalMetric) {
    // Send to Google Analytics 4 if available
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", metric.name, {
            event_category: "Web Vitals",
            event_label: metric.id,
            value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
            non_interaction: true,
        });
    }

    // Console log in development
    if (process.env.NODE_ENV === "development") {
        const color = metric.rating === "good" ? "green" : metric.rating === "poor" ? "red" : "orange";
        console.log(
            `%c[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
            `color: ${color}; font-weight: bold`
        );
    }
}

export function WebVitalsReporter() {
    useEffect(() => {
        // Dynamically import web-vitals to avoid SSR issues
        import("web-vitals")
            .then(({ onLCP, onCLS, onINP, onTTFB }) => {
                const handler = (metric: { name: string; value: number; id: string; delta: number }) => {
                    sendToAnalytics({
                        ...metric,
                        rating: getRating(metric.name, metric.value),
                    });
                };

                onLCP(handler);
                onCLS(handler);
                onINP(handler);
                onTTFB(handler);
            })
            .catch(() => {
                // web-vitals not available, silently skip
            });
    }, []);

    return null; // No visual output
}

export default WebVitalsReporter;
