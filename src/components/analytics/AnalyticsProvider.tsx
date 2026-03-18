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
 * Tự động liên kết userId khi user đăng nhập.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { analytics } from "@/lib/analytics/sdk";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Track page view on route change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    analytics.trackPageView(url);
  }, [pathname]);

  // Sync userId with analytics SDK when session changes
  useEffect(() => {
    const currentUserId = session?.user?.id ? String(session.user.id) : undefined;

    if (currentUserId && currentUserId !== prevUserIdRef.current) {
      // User just logged in or session restored
      analytics.setUserId(Number(currentUserId));
      analytics.track("login", { method: "session" });
      prevUserIdRef.current = currentUserId;
    } else if (!currentUserId && prevUserIdRef.current) {
      // User logged out
      analytics.track("logout", {});
      analytics.clearUserId();
      prevUserIdRef.current = undefined;
    }
  }, [session]);

  return <>{children}</>;
}
