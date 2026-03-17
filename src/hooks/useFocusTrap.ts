/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTORS =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(isActive: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);

    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];
        return Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((el) => !el.closest("[aria-hidden='true']"));
    }, []);

    useEffect(() => {
        if (!isActive) return;

        const focusable = getFocusableElements();
        if (focusable.length > 0) {
            // Focus the first element when modal opens
            focusable[0].focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const elements = getFocusableElements();
            if (elements.length === 0) return;

            const first = elements[0];
            const last = elements[elements.length - 1];

            if (e.key === "Tab") {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isActive, getFocusableElements]);

    return containerRef;
}
