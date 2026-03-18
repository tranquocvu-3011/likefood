"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

import AdminSidebar from "@/components/shared/AdminSidebar";
import AdminBreadcrumbs from "@/components/shared/AdminBreadcrumbs";
import { CommandPalette, useCommandPalette } from "@/components/admin/CommandPalette";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const RENEW_DEBOUNCE_MS = 5 * 60 * 1000; // Renew cookie every 5 minutes of activity

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [is2FAVerified, setIs2FAVerified] = useState<boolean | null>(null);
    const [isChecking2FA, setIsChecking2FA] = useState(true);
    const { open, setOpen } = useCommandPalette();
    
    // Activity tracking refs
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastRenewRef = useRef<number>(Date.now());
    const hasCheckedRef = useRef(false);

    const isBypassPage = useMemo(() => 
        pathname === "/admin/login" || pathname === "/admin/verify", 
        [pathname]
    );

    // Check 2FA session ONCE on mount only
    useEffect(() => {
        if (isBypassPage) {
            setIsChecking2FA(false);
            return;
        }

        // Only check once per component lifecycle (tab open)
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        const check2FASession = async () => {
            try {
                const response = await fetch("/api/auth/admin-verify", {
                    method: "GET",
                    credentials: "include",
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setIs2FAVerified(data.verified);
                } else if (response.status === 401) {
                    // Not authenticated at all → redirect to admin login
                    setIs2FAVerified(false);
                    router.push("/admin/login");
                    return;
                } else {
                    setIs2FAVerified(false);
                }
            } catch {
                setIs2FAVerified(false);
            } finally {
                setIsChecking2FA(false);
            }
        };

        check2FASession();
    }, [isBypassPage, router]);

    // Redirect to verify page if not verified (but authenticated)
    useEffect(() => {
        if (isChecking2FA) return;
        
        if (!isBypassPage && is2FAVerified === false) {
            router.push("/admin/verify");
        }
    }, [is2FAVerified, isChecking2FA, router, isBypassPage]);

    // Renew cookie on activity (debounced)
    const renewCookie = useCallback(async () => {
        const now = Date.now();
        // Only renew if at least 5 minutes since last renew
        if (now - lastRenewRef.current < RENEW_DEBOUNCE_MS) return;
        
        lastRenewRef.current = now;

        try {
            const response = await fetch("/api/auth/admin-verify", {
                method: "PATCH",
                credentials: "include",
            });
            
            if (response.ok) {
                const data = await response.json();
                if (!data.renewed) {
                    // Cookie expired or invalid, redirect to verify
                    setIs2FAVerified(false);
                    router.push("/admin/verify");
                }
            }
        } catch {
            // Silent fail on renew - will be caught by inactivity timeout
        }
    }, [router]);

    // Reset inactivity timer on user activity
    const resetInactivityTimer = useCallback(() => {
        // Clear existing timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Set new 30 min timer
        inactivityTimerRef.current = setTimeout(() => {
            // 30 min inactivity - force re-verify
            setIs2FAVerified(false);
            hasCheckedRef.current = false;
            router.push("/admin/verify");
        }, INACTIVITY_TIMEOUT_MS);

        // Also renew the server cookie (debounced)
        renewCookie();
    }, [renewCookie, router]);

    // Set up activity listeners
    useEffect(() => {
        if (isBypassPage || !is2FAVerified) return;

        const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
        
        // Throttle event handler to avoid excessive calls
        let throttleTimer: NodeJS.Timeout | null = null;
        const throttledReset = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                throttleTimer = null;
                resetInactivityTimer();
            }, 1000); // Throttle to max once per second
        };

        events.forEach(event => {
            window.addEventListener(event, throttledReset, { passive: true });
        });

        // Start initial timer
        resetInactivityTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, throttledReset);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            if (throttleTimer) {
                clearTimeout(throttleTimer);
            }
        };
    }, [isBypassPage, is2FAVerified, resetInactivityTimer]);

    if (isBypassPage) return <>{children}</>;

    if (isChecking2FA) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0A0A0B] gap-4">
                <div className="w-10 h-10 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                <p className="font-semibold text-zinc-500 uppercase tracking-widest text-xs">Verifying...</p>
            </div>
        );
    }

    if (is2FAVerified === false) {
        return null; // Will redirect to /admin/verify
    }

    return (
        <div className="flex min-h-screen bg-[#0A0A0B]">
            <AdminSidebar />
            <main className="flex-1 lg:ml-56 p-4 lg:p-6 transition-all duration-200 text-zinc-100">
                <div className="max-w-[1600px] mx-auto">
                    <AdminBreadcrumbs />
                    {children}
                </div>
            </main>
            <CommandPalette open={open} onOpenChange={setOpen} />
        </div>
    );
}
