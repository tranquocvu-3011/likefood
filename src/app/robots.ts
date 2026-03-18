/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { MetadataRoute } from "next";

function getBaseUrl() {
    const envUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_SEO_SITE_URL;

    try {
        return envUrl ? new URL(envUrl).origin : "https://likefood.app";
    } catch {
        return "https://likefood.app";
    }
}

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getBaseUrl();

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/api/",
                    "/cart",
                    "/checkout",
                    "/_next",
                    "/login",
                    "/register",
                    "/forgot-password",
                    "/reset-password",
                    "/verify-email",
                    "/profile/",
                    "/orders/",
                    "/order-success",
                    "/notifications",
                    "/wishlist",
                    "/products?search=",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
