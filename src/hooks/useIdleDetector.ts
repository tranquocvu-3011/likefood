"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 phút
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Cảnh báo trước 5 phút

type IdleDetectorOptions = {
    onWarning: () => void;
    onLogout: () => void;
    idleTimeoutMs?: number;
    warningBeforeMs?: number;
};

export function useIdleDetector({
    onWarning,
    onLogout,
    idleTimeoutMs = IDLE_TIMEOUT_MS,
    warningBeforeMs = WARNING_BEFORE_MS,
}: IdleDetectorOptions) {
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isWarningShownRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    }, []);

    const resetTimers = useCallback(() => {
        clearTimers();
        isWarningShownRef.current = false;

        // Set warning timer
        warningTimerRef.current = setTimeout(() => {
            isWarningShownRef.current = true;
            onWarning();

            // Set logout timer after warning
            logoutTimerRef.current = setTimeout(() => {
                onLogout();
                signOut({ callbackUrl: "/login?message=Phiên đăng nhập đã hết hạn do không hoạt động" });
            }, warningBeforeMs);
        }, idleTimeoutMs - warningBeforeMs);
    }, [clearTimers, onWarning, onLogout, idleTimeoutMs, warningBeforeMs]);

    const handleActivity = useCallback(() => {
        // Only reset if we haven't shown the warning yet
        if (!isWarningShownRef.current) {
            resetTimers();
        }
    }, [resetTimers]);

    useEffect(() => {
        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        resetTimers();

        return () => {
            clearTimers();
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [handleActivity, resetTimers, clearTimers]);

    return { resetTimers, clearTimers };
}
