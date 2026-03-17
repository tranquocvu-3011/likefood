"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Quote, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";

interface ReviewSummaryAIProps {
    productId: number;
}

export default function ReviewSummaryAI({ productId }: ReviewSummaryAIProps) {
    const { t } = useLanguage();
    const [summary, setSummary] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/ai/summarize?productId=${productId}`);
                if (!res.ok) throw new Error("Failed to fetch summary");
                const data = await res.json();
                setSummary(data.summary);
            } catch (err) {
                console.error("Review Summary Error:", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            fetchSummary();
        }
    }, [productId]);

    if (isLoading) {
        return (
            <div className="p-8 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">{t("reviewSummary.analyzing")}</p>
            </div>
        );
    }

    if (error || !summary) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden group"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/30 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -ml-12 -mb-12" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-tighter text-sm">{t("reviewSummary.title")}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("reviewSummary.subtitle")}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <Quote className="w-8 h-8 text-primary opacity-50 shrink-0" />
                        <div className="text-slate-200 leading-relaxed font-medium">
                            {summary.split('\n').map((line, i) => (
                                <p key={i} className={line.startsWith('-') || line.startsWith('*') ? 'ml-4' : 'mb-2'}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t("reviewSummary.honest")}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t("reviewSummary.objective")}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
