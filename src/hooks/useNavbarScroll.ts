/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

"use client";

import { useState, useEffect } from "react";

const ENTER_COMPACT = 120;
const EXIT_COMPACT = 40;
const HIDE_THRESHOLD = 80;
const DIR_EPS = 15;

export function useNavbarScroll() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY || 0;

        const handleScroll = () => {
            const currentY = window.scrollY;
            const delta = currentY - lastY;
            lastY = currentY;

            setIsScrolled((prev) => {
                if (!prev && currentY > ENTER_COMPACT) return true;
                if (prev && currentY < EXIT_COMPACT) return false;
                return prev;
            });

            setIsHidden((prev) => {
                if (currentY < EXIT_COMPACT) return false;
                if (delta > DIR_EPS && currentY > HIDE_THRESHOLD) return true;
                if (delta < -DIR_EPS) return false;
                return prev;
            });
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return { isScrolled, isHidden };
}
