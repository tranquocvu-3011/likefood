"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useIdleDetector } from "@/hooks/useIdleDetector";
import IdleWarningModal from "@/components/auth/IdleWarningModal";

const WARNING_COUNTDOWN_SECONDS = 300; // 5 phút

export default function IdleSessionWrapper({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_SECONDS);

    const handleWarning = useCallback(() => {
        setShowWarning(true);
        setCountdown(WARNING_COUNTDOWN_SECONDS);
    }, []);

    const handleLogout = useCallback(() => {
        setShowWarning(false);
    }, []);

    const { resetTimers } = useIdleDetector({
        onWarning: handleWarning,
        onLogout: handleLogout,
    });

    const handleStayLoggedIn = useCallback(() => {
        setShowWarning(false);
        setCountdown(WARNING_COUNTDOWN_SECONDS);
        resetTimers();
    }, [resetTimers]);

    // Countdown when warning is shown
    useEffect(() => {
        if (!showWarning) return;
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showWarning, countdown]);

    // Only activate for logged-in users
    if (!session?.user) return <>{children}</>;

    return (
        <>
            {children}
            <IdleWarningModal
                isOpen={showWarning}
                onStayLoggedIn={handleStayLoggedIn}
                countdown={countdown}
            />
        </>
    );
}
