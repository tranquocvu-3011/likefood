"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import dynamic from "next/dynamic";

export const ChatWidgetClient = dynamic(() => import("@/components/chat/ChatWidget"), {
    ssr: false,
});

export const RecentlyViewedClient = dynamic(() => import("@/components/product/RecentlyViewed"), {
    ssr: false,
});
