/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

/**
 * Fetches autocomplete hints from /api/products/search-hints  
 * with 300ms debounce. Only fires when `enabled` is true AND
 * query length >= 2.
 */
export function useSearchHints(query: string, enabled: boolean) {
    const [suggestions, setSuggestions] = useState<Array<{
        id: number;
        name: string;
        slug?: string;
        category?: string;
        price?: number;
        image?: string;
    }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHints = useCallback(async (q: string) => {
        if (q.length < 2) { setSuggestions([]); return; }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/products/search-hints?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.hints || []);
            }
        } catch (err) {
            logger.warn("Autocomplete error", { context: "useSearchHints", error: err as Error });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        const timer = setTimeout(() => fetchHints(query), 300);
        return () => clearTimeout(timer);
    }, [query, enabled, fetchHints]);

    const reset = useCallback(() => setSuggestions([]), []);

    return { suggestions, isLoading, reset };
}
