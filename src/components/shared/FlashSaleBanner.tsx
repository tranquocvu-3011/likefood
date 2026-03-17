"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

export default function FlashSaleBanner() {
    const { t, isVietnamese } = useLanguage();
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    const shopT = (key: string, viText: string, enText: string) => {
        const value = t(`shop.${key}`);
        return value === `shop.${key}` || value.includes(".") ? (isVietnamese ? viText : enText) : value;
    };

    const flashT = (key: string, viText: string, enText: string) => {
        const value = t(`flashSale.${key}`);
        return value === `flashSale.${key}` || value.includes(".") ? (isVietnamese ? viText : enText) : value;
    };

    useEffect(() => {
        const DURATION = 24 * 60 * 60 * 1000;
        let timer: NodeJS.Timeout | undefined;
        let isCleanupCalled = false;

        const startFallbackTimer = () => {
            // Prevent multiple timer starts
            if (timer) return;
            
            const calculateTimeLeft = (endTime: number) => {
                const now = Date.now();
                const diff = endTime - now;

                if (diff <= 0) {
                    const newEndTime = Date.now() + DURATION;
                    localStorage.setItem("flash_sale_end_time", newEndTime.toString());
                    return calculateTimeLeft(newEndTime);
                }

                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);

                return { hours: h, minutes: m, seconds: s };
            };

            const storedEndTime = localStorage.getItem("flash_sale_end_time");
            let endTime: number;

            if (!storedEndTime) {
                endTime = Date.now() + DURATION;
                localStorage.setItem("flash_sale_end_time", endTime.toString());
            } else {
                endTime = parseInt(storedEndTime, 10);
            }

            setTimeLeft(calculateTimeLeft(endTime));

            timer = setInterval(() => {
                const currentEndTime = parseInt(localStorage.getItem("flash_sale_end_time") || "0", 10);
                setTimeLeft(calculateTimeLeft(currentEndTime));
            }, 1000);
        };

        const fetchFlashSale = async () => {
            if (isCleanupCalled) return;
            
            try {
                const res = await fetch("/api/products/flash-sale");
                if (res.ok && !isCleanupCalled) {
                    const data = await res.json();
                    if (data.countdown) {
                        const endTime = new Date(data.countdown).getTime();

                        const calculateTimeLeft = () => {
                            const now = Date.now();
                            const diff = endTime - now;

                            if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };

                            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                            const m = Math.floor((diff / 1000 / 60) % 60);
                            const s = Math.floor((diff / 1000) % 60);

                            return { hours: h, minutes: m, seconds: s };
                        };

                        setTimeLeft(calculateTimeLeft());

                        // Clear any existing timer before creating new one
                        if (timer) clearInterval(timer);
                        timer = setInterval(() => {
                            setTimeLeft(calculateTimeLeft());
                        }, 1000);
                        return;
                    }
                }
            } catch (error) {
                console.error("Failed to sync flash sale banner:", error);
            }

            // Only start fallback if not cleaned up
            if (!isCleanupCalled) {
                startFallbackTimer();
            }
        };

        fetchFlashSale();

        return () => {
            isCleanupCalled = true;
            if (timer) clearInterval(timer);
        };
    }, []);

    const formatNum = (num: number) => num.toString().padStart(2, '0');

    if (!timeLeft) return null;


    return (
        <section className="bg-rose-50 overflow-hidden relative group py-6 md:py-8 border-b border-rose-100">
            {/* Subtle Luxury Glow Effects */}
            <div className="absolute top-0 right-[-10%] w-[50%] h-[100%] bg-gradient-to-br from-rose-300/30 via-pink-200/30 to-transparent blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.1, 1],
                        x: ['-20%', '20%']
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/2 left-0 w-full h-[200%] bg-[radial-gradient(circle,rgba(225,29,72,0.05)_0%,transparent_70%)]"
                />
            </div>

            <div className="w-full mx-auto px-4 md:px-6 lg:px-[8%] relative z-10 max-w-[1400px]">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                    {/* Badge & Title */}
                    <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                    "0 0 10px rgba(225,29,72,0.1)",
                                    "0 0 20px rgba(225,29,72,0.2)",
                                    "0 0 10px rgba(225,29,72,0.1)"
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="bg-white p-3 md:p-4 rounded-2xl md:rounded-2xl border border-rose-100 shadow-xl shadow-rose-100 flex-shrink-0"
                        >
                            <Zap className="w-6 h-6 md:w-8 md:h-8 text-rose-500 fill-current" />
                        </motion.div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] md:text-xs font-black px-3 py-1 rounded-sm uppercase tracking-[0.2em] flex-shrink-0">{shopT("exclusive", "Độc quyền", "Exclusive")}</span>
                                <h3 className="text-slate-900 font-extrabold text-2xl md:text-3xl tracking-widest truncate">
                                    FLASH <span className="text-rose-600 font-black hidden sm:inline">SALE</span>
                                </h3>
                            </div>
                            <p className="text-slate-600 text-xs md:text-sm font-medium tracking-wide line-clamp-1">{shopT("flashSalePromo", "Ưu đãi chớp nhoáng mỗi ngày", "Daily flash deals")}</p>
                        </div>
                    </div>

                    {/* Countdown & CTA */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto mt-4 lg:mt-0">
                        <div className="flex-1 lg:flex-none flex items-center justify-center gap-4 md:gap-6 bg-white/80 backdrop-blur-md rounded-2xl p-4 px-6 md:p-5 md:px-10 border border-rose-100 shadow-xl shadow-rose-50">
                            <div className="flex flex-col items-center">
                                <span className="text-slate-900 font-black text-4xl md:text-5xl tabular-nums leading-none tracking-widest">{formatNum(timeLeft.hours)}</span>
                                <span className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-2">{flashT("hrs", "GIỜ", "HRS")}</span>
                            </div>
                            <span className="text-rose-300 font-black text-3xl md:text-4xl mb-5 md:mb-6 relative -top-1">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-slate-900 font-black text-4xl md:text-5xl tabular-nums leading-none tracking-widest">{formatNum(timeLeft.minutes)}</span>
                                <span className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-2">{flashT("min", "PHÚT", "MIN")}</span>
                            </div>
                            <span className="text-rose-300 font-black text-3xl md:text-4xl mb-5 md:mb-6 relative -top-1">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-slate-900 font-black text-4xl md:text-5xl tabular-nums leading-none tracking-widest">{formatNum(timeLeft.seconds)}</span>
                                <span className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-2">{flashT("sec", "GIÂY", "SEC")}</span>
                            </div>
                        </div>

                        <Link href="/flash-sale" className="flex-shrink-0 w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(225, 29, 72, 0.3)" }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-slate-900 text-white p-4 md:px-8 md:py-4 rounded-2xl shadow-lg shadow-slate-900/20 font-bold flex items-center justify-center gap-2 md:gap-3 transition-colors text-xs md:text-sm uppercase tracking-[0.2em]"
                            >
                                <span>{shopT("viewDeals", "Xem ưu đãi", "View deals")}</span>
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
