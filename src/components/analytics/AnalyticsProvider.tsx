"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Tích hợp Frontend Analytics SDK vào website.
 * Tự động track page view khi chuyển trang.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics/sdk";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    analytics.trackPageView(url);
  }, [pathname]);

  return <>{children}</>;
}
