"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ChevronDown, Clock } from "lucide-react";
import ImageWithFallback from "@/components/shared/ImageWithFallback";

interface SuggestionItem {
    id: number;
    name: string;
    slug?: string;
    category?: string;
    price?: number;
    image?: string;
}

interface SearchSuggestionsProps {
    query: string;
    suggestions: SuggestionItem[];
    isLoading: boolean;
    selectedIndex: number;
    trendingKeywords: string[];
    translations: any;
    searchHistory: string[];
    onClearHistory: () => void;
    onSuggestionClick: (slug: string | undefined, id: string) => void;
    onTrendingClick: (keyword: string) => void;
    onViewAllClick?: () => void;
}

export default function SearchSuggestions({
    query,
    suggestions,
    isLoading,
    selectedIndex,
    trendingKeywords,
    translations: t,
    searchHistory,
    onClearHistory,
    onSuggestionClick,
    onTrendingClick,
    onViewAllClick,
}: SearchSuggestionsProps) {
    
    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight})`, "gi");
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="text-primary font-black bg-primary/5 px-0.5 rounded-sm">{part}</span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    if (query.length < 1) {
        if (searchHistory.length === 0) return null;
        return (
            <div className="p-5">
                {/* Search history */}
                <div className="mb-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('shopPage.recentSearches')}</span>
                        </div>
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={onClearHistory}
                            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((h) => (
                            <button
                                key={h}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onTrendingClick(h)}
                                className="px-3 py-2 rounded-2xl text-[12px] font-semibold bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                🕐 {h}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-[3px] border-primary/10 border-t-primary rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {t("common.searching")}
                </span>
            </div>
        );
    }

    if (suggestions.length > 0) {
        return (
            <div className="py-2" onMouseDown={(e) => e.stopPropagation()}>
                <div className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                    <span>{t("common.suggestionsFor")} &quot;{query}&quot;</span>
                    <div className="h-px flex-1 bg-slate-100 ml-4" />
                </div>
                <div className="px-2 max-h-[clamp(300px,60vh,500px)] overflow-y-auto custom-scrollbar">
                    {suggestions.map((item, idx) => (
                        <button
                            key={item.id}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSuggestionClick(item.slug, String(item.id));
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSuggestionClick(item.slug, String(item.id));
                            }}
                            className={`w-full px-4 py-3 flex items-center gap-4 rounded-2xl transition-all text-left group ${
                                selectedIndex === idx ? "bg-primary/10 translate-x-1" : "hover:bg-primary/5"
                            }`}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/50 relative">
                                <ImageWithFallback
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="56px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                    {highlightText(item.name, query)}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] font-medium text-slate-400">{item.category}</span>
                                    <span className="text-slate-200">•</span>
                                    <span className="text-[12px] font-black text-primary">
                                        ${item.price?.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300 opacity-0 group-hover:opacity-100 transition-all mr-2" />
                        </button>
                    ))}
                </div>
                <div className="p-3 border-t border-slate-100">
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewAllClick?.();
                            window.location.href = `/products?search=${encodeURIComponent(query)}`;
                        }}
                        className={`block w-full px-4 py-3.5 text-[11px] font-black rounded-2xl text-center shadow-lg transition-all uppercase tracking-widest ${
                            selectedIndex === suggestions.length 
                                ? "bg-primary text-white scale-[1.02]" 
                                : "bg-slate-900 hover:bg-primary text-white"
                        }`}
                    >
                        {t("common.viewAllResults")} &quot;{query}&quot;
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-200" />
            </div>
            <div>
                <p className="text-[13px] font-black text-slate-900">{t("common.noProductFound")}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{t("common.tryOtherKeyword")}</p>
            </div>
        </div>
    );
}
