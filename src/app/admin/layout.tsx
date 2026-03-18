/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
            "max-snippet": 0,
            "max-image-preview": "none",
            "max-video-preview": 0,
        },
    },
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side auth check
    const session = await getServerSession(authOptions);
    
    // If not logged in: let AdminLayoutClient handle the login/verify bypass pages
    // If logged in but not admin, redirect to home
    if (session && session.user?.role !== "ADMIN") {
        redirect("/");
    }
    
    // Pass to client component for 2FA check and page rendering
    // AdminLayoutClient handles bypass for /admin/login and /admin/verify
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
