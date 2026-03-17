"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { useLanguage } from "@/lib/i18n/context";


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { language, t } = useLanguage();

    useEffect(() => {
        // Setup BroadcastChannel to listen for login events from other tabs
        const channel = new BroadcastChannel("likefood_auth_sync");

        channel.onmessage = (event) => {
            if (event.data?.type === "LOGIN_SUCCESS") {
                toast.success(t('auth.loginSuccess'));
                router.replace("/");
                // Optional: router.refresh() or window.location.reload() to ensure session is refreshed
                router.refresh();
            }
        };

        return () => {
            channel.close();
        };
    }, [router, language, t]);

    return (
        <SessionProvider>
            <WishlistProvider>
                {children}
            </WishlistProvider>
        </SessionProvider>
    );
}
