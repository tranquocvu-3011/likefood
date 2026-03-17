"use client";

/**
 * DynamicFavicon — Reads favicon URL from public settings API
 * If admin sets `site_favicon` in settings, this overrides the default /icon-512.png
 */

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/settings", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const faviconUrl = data.SITE_FAVICON || data.site_favicon;
        if (faviconUrl && typeof faviconUrl === "string" && faviconUrl.trim()) {
          // Update existing link[rel=icon] or create one
          let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = faviconUrl.trim();

          // Also update apple-touch-icon
          let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
          if (!appleLink) {
            appleLink = document.createElement("link");
            appleLink.rel = "apple-touch-icon";
            document.head.appendChild(appleLink);
          }
          appleLink.href = faviconUrl.trim();
        }
      })
      .catch(() => {
        // Silent fail — keep default favicon
      });

    return () => controller.abort();
  }, []);

  return null;
}
