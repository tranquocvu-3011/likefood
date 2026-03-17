"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface TurnstileWidgetProps {
    siteKey?: string;
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    theme?: "light" | "dark" | "auto";
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
    }
}

export default function TurnstileWidget({
    siteKey: siteKeyProp,
    onVerify, onError, onExpire, theme = "light"
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const renderedRef = useRef(false);

    // Stabilize callbacks to prevent re-renders from destroying the widget
    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;

    const siteKey = (siteKeyProp ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

    useEffect(() => {
        if (!siteKey) return;

        // Load Turnstile script if not already loaded
        if (!document.getElementById("turnstile-script")) {
            const script = document.createElement("script");
            script.id = "turnstile-script";
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.onload = () => setIsLoaded(true);
            document.head.appendChild(script);
        } else if (window.turnstile) {
            setIsLoaded(true);
        }
    }, [siteKey]);

    useEffect(() => {
        if (!isLoaded || !containerRef.current || !window.turnstile || !siteKey) return;
        // Prevent double-render
        if (renderedRef.current) return;
        renderedRef.current = true;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => onVerifyRef.current(token),
            "error-callback": () => onErrorRef.current?.(),
            "expired-callback": () => onExpireRef.current?.(),
        });

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                renderedRef.current = false;
            }
        };
    // Only re-render when script loads or siteKey/theme changes — NOT on callback changes
    }, [isLoaded, siteKey, theme]);

    if (!siteKey) return null;

    return (
        <div className="flex justify-center">
            <div ref={containerRef} />
        </div>
    );
}
