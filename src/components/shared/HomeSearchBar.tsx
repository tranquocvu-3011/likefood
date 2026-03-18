"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from "@/lib/i18n/context";

const POPULAR_SEARCHES_VI = [
    "Cá khô",
    "Tôm khô",
    "Mực khô",
    "Trái cây sấy",
    "Mứt tết",
    "Gia vị Việt"
];

const POPULAR_SEARCHES_EN = [
    "Dried fish",
    "Dried shrimp",
    "Dried squid",
    "Dried fruits",
    "Tet jam",
    "Vietnamese spices"
];

type SearchHint = { id: string; name: string; slug?: string; category?: string; price?: number; image?: string | null };

export default function HomeSearchBar() {
    const router = useRouter();
    const { isVietnamese } = useLanguage();
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchHint[]>([]);
    const debouncedQuery = useDebounce(query, 300);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Click outside handler - đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
                setSuggestions([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside, { passive: true });

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        try {
            const res = await fetch(`/api/products/search-hints?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.hints || []);
            }
        } catch {
            // Silent fail
            setSuggestions([]);
        }
    }, []);

    // Fetch suggestions when user types (defer to avoid sync state in effect)
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            if (debouncedQuery.length >= 1) {
                fetchSuggestions(debouncedQuery);
            } else {
                setSuggestions([]);
            }
        });

        return () => cancelAnimationFrame(raf);
    }, [debouncedQuery, fetchSuggestions]);

    // Handle click vào suggestion → đi đến trang chi tiết sản phẩm
    const handleSuggestionClick = (suggestion: SearchHint) => {
        if (suggestion.slug) {
            // Navigate đến trang chi tiết sản phẩm
            router.push(`/products/${suggestion.slug}`);
        } else {
            // Fallback: search theo tên
            handleSearch(suggestion.name);
        }
        // Đóng dropdown
        setTimeout(() => {
            setQuery("");
            setIsFocused(false);
            setSuggestions([]);
        }, 100);
    };

    // Handle search từ khóa → đi đến trang danh sách sản phẩm
    const handleSearch = (searchQuery: string) => {
        if (searchQuery.trim()) {
            const encodedQuery = encodeURIComponent(searchQuery.trim());
            router.push(`/products?search=${encodedQuery}`);
            setTimeout(() => {
                setQuery("");
                setIsFocused(false);
                setSuggestions([]);
            }, 100);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const popularSearches = isVietnamese ? POPULAR_SEARCHES_VI : POPULAR_SEARCHES_EN;

    return (
        <div ref={searchContainerRef} className="relative max-w-3xl mx-auto mt-0 z-20 px-4 py-4 md:py-5">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <form onSubmit={handleSubmit} className="relative">
                    {/* Search Input */}
                    <div className={`relative bg-white rounded-full shadow-2xl transition-all duration-500 border-[3px] ${isFocused
                        ? 'border-emerald-400 ring-4 ring-emerald-500/20 shadow-[0_15px_60px_-15px_rgba(16,185,129,0.4)]'
                        : 'border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.2)] hover:border-emerald-100'
                        }`}>
                        <Search className={`absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 md:w-5.5 md:h-5.5 transition-colors duration-300 ${isFocused ? 'text-emerald-600' : 'text-slate-400'}`} />

                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                                // Delay blur để click vào suggestions có thể xử lý trước
                                setTimeout(() => setIsFocused(false), 150);
                            }}
                            placeholder={isVietnamese ? "Tìm cá khô, tôm khô, đặc sản Việt Nam..." : "Search dried fish, dried shrimp, Vietnamese specialties..."}
                            className="w-full pl-12 md:pl-14 pr-24 md:pr-36 py-3.5 md:py-4 rounded-full text-sm md:text-base font-semibold outline-none placeholder:text-slate-400 bg-transparent text-slate-800"
                        />

                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="absolute right-28 md:right-40 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        )}

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02, boxShadow: "0 15px 30px -5px rgba(16, 185, 129, 0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full font-bold text-sm md:text-base transition-all shadow-lg flex items-center gap-1.5"
                        >
                            <span className="hidden leading-none sm:inline">{isVietnamese ? "Khám phá" : "Explore"}</span>
                            <span className="sm:hidden leading-none">{isVietnamese ? "Tìm" : "Go"}</span>
                        </motion.button>
                    </div>


                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                        {isFocused && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                            >
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSuggestionClick(suggestion);
                                        }}
                                        className="w-full px-6 py-4 text-left hover:bg-emerald-50 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-0 group"
                                    >
                                        <Search className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-lg text-slate-700 group-hover:text-emerald-700 block truncate">{suggestion.name}</span>
                                            {suggestion.category && (
                                                <span className="text-xs text-slate-400">{suggestion.category}</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Popular Searches */}
                {!isFocused && !query && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6"
                    >
                        <div className="flex items-center justify-center gap-2 mb-3 md:mb-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <span className="text-base text-slate-600 font-bold uppercase tracking-wider">{isVietnamese ? "Mọi người hay tìm:" : "People often search:"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:justify-center md:gap-4 lg:gap-5 max-w-md md:max-w-none mx-auto">
                            {popularSearches.map((search) => (
                                <button
                                    key={search}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSearch(search);
                                    }}
                                    className="px-3 py-2 bg-white/80 hover:bg-emerald-600 hover:text-white text-sm md:text-base font-semibold text-slate-700 rounded-full border border-slate-200 hover:border-emerald-600 transition-all hover:scale-105 shadow-sm hover:shadow-emerald-200/50"
                                >
                                    {search}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div >
    );
}
