/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Prefetch utility for Next.js App Router
 * Helps prefetch routes programmatically for better performance
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";
// import type { AppRouterInstance } from "next/navigation";

/**
 * Hook to prefetch a route on hover
 */
export function usePrefetchOnHover(href: string, enabled: boolean = true) {
    const router = useRouter();

    const handleMouseEnter = useCallback(() => {
        if (enabled && href) {
            router.prefetch(href);
        }
    }, [href, enabled, router]);

    return handleMouseEnter;
}

/**
 * Prefetch multiple routes
 */
export function prefetchRoutes(routes: string[], router: { prefetch: (url: string) => void }) {
    routes.forEach((route) => {
        router.prefetch(route);
    });
}

/**
 * Prefetch common routes on app load
 */
export function prefetchCommonRoutes(router: { prefetch: (url: string) => void }) {
    const commonRoutes = [
        "/products",
        "/cart",
        "/checkout",
        "/profile",
        "/orders",
        "/wishlist",
        "/vouchers",
    ];

    // Prefetch in background after a delay
    setTimeout(() => {
        prefetchRoutes(commonRoutes, router);
    }, 2000);
}
