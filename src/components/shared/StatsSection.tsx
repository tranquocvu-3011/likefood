"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion } from "framer-motion";
import { Users, Package, Star, Award } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface Stats {
    totalCustomers: number;
    totalOrders: number;
    avgRating: number;
    totalProducts: number;
}

interface StatCardProps {
    icon: React.ElementType;
    value: string;
    label: string;
    sublabel: string;
    gradient: string;
    textGradient: string;
    glowColor: string;
    index: number;
}

function StatCard({ icon: Icon, value, label, sublabel, gradient, textGradient, glowColor, index }: StatCardProps) {
    const [displayValue, setDisplayValue] = useState("0");
    const [hasAnimated, setHasAnimated] = useState(false);

    const animateValue = (end: string) => {
        if (hasAnimated) return;

        const numMatch = end.match(/[\d.]+/);
        if (!numMatch) {
            setDisplayValue(end);
            return;
        }

        const endNum = parseFloat(numMatch[0]);
        const duration = 1800;
        const steps = 50;
        const _increment = endNum / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;

            if (step >= steps) {
                setDisplayValue(end);
                clearInterval(timer);
                setHasAnimated(true);
            } else {
                // Easing: slow start, fast middle, slow end
                const progress = step / steps;
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                const easedValue = endNum * eased;

                if (end.includes("K+")) {
                    setDisplayValue(`${(easedValue / 1000).toFixed(1)}K+`);
                } else if (end.includes("/5")) {
                    setDisplayValue(`${easedValue.toFixed(1)}/5`);
                } else {
                    setDisplayValue(Math.floor(easedValue).toString());
                }
            }
        }, duration / steps);

        return () => clearInterval(timer);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-30px" }}
            onViewportEnter={() => animateValue(value)}
            transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
            }}
        >
            <motion.div
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative bg-white rounded-2xl p-5 md:p-6 border border-slate-100/80 group overflow-hidden cursor-default"
                style={{
                    boxShadow: `0 2px 16px -4px rgba(0,0,0,0.06), 0 8px 24px -8px ${glowColor}`
                }}
            >
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-t-2xl`} />

                {/* Hover glow overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.05] rounded-2xl transition-opacity duration-500 pointer-events-none`} />

                {/* Decorative circle */}
                <div
                    className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${gradient} opacity-[0.06] rounded-full blur-xl transition-all duration-500 group-hover:opacity-[0.12] group-hover:scale-125`}
                />

                {/* Icon */}
                <motion.div
                    whileHover={{ rotate: [0, -6, 6, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
                >
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow" />
                </motion.div>

                {/* Value with gradient text */}
                <div
                    className={`text-3xl md:text-4xl font-black mb-1 leading-none bg-gradient-to-r ${textGradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 origin-left`}
                >
                    {displayValue}
                </div>

                {/* Label */}
                <p className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mt-2">
                    {label}
                </p>

                {/* Sub-label */}
                <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 font-medium">{sublabel}</p>
            </motion.div>
        </motion.div>
    );
}

export default function StatsSection() {
    const [stats, setStats] = useState<Stats>({
        totalCustomers: 0,
        totalOrders: 0,
        avgRating: 5.0,
        totalProducts: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();
    const vi = language === "vi";

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch {
            logger.warn("Stats fetch failed, using defaults", { context: 'stats-section' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Format numbers for display
    const formatCustomers = (num: number) => {
        if (num >= 10000) return `${(num / 1000).toFixed(0)}K+`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
        return num.toString();
    };

    const formatOrders = (num: number) => {
        if (num >= 50000) return `${(num / 1000).toFixed(0)}K+`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
        return num.toString();
    };

    const statsData = [
        {
            icon: Users,
            value: formatCustomers(stats.totalCustomers),
            label: vi ? "Khách hàng" : "Customers",
            sublabel: vi ? "Tin tưởng sử dụng" : "Trusted users",
            gradient: "from-blue-500 to-cyan-400",
            textGradient: "from-blue-600 to-cyan-500",
            glowColor: "rgba(59,130,246,0.15)"
        },
        {
            icon: Package,
            value: formatOrders(stats.totalOrders),
            label: vi ? "Đơn hàng" : "Orders",
            sublabel: vi ? "Được xử lý thành công" : "Successfully processed",
            gradient: "from-violet-500 to-purple-400",
            textGradient: "from-violet-600 to-purple-500",
            glowColor: "rgba(139,92,246,0.15)"
        },
        {
            icon: Star,
            value: `${stats.avgRating.toFixed(1)}/5`,
            label: vi ? "Đánh giá" : "Rating",
            sublabel: vi ? "Trung bình từ khách hàng" : "Average from customers",
            gradient: "from-amber-400 to-orange-400",
            textGradient: "from-amber-500 to-orange-500",
            glowColor: "rgba(245,158,11,0.15)"
        },
        {
            icon: Award,
            value: stats.totalProducts > 0 ? stats.totalProducts.toString() : "—",
            label: vi ? "Sản phẩm" : "Products",
            sublabel: vi ? "Đang có sẵn trong kho" : "Available in stock",
            gradient: "from-emerald-500 to-green-400",
            textGradient: "from-emerald-600 to-green-500",
            glowColor: "rgba(16,185,129,0.15)"
        }
    ];

    if (isLoading) {
        return (
            <section className="py-8 md:py-11 bg-gradient-to-b from-white to-slate-50">
                <div className="page-container-wide">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-slate-100 rounded-2xl h-40 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-8 md:py-11 bg-gradient-to-b from-white via-slate-50/60 to-white overflow-hidden">
            {/* Background ambient glows — smaller */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-emerald-100/30 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-blue-100/25 rounded-full blur-3xl" />
            </div>

            <div className="relative page-container-wide">
                {/* Section Header — compact */}
                <div className="text-center mb-8 md:mb-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold mb-3"
                    >
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {vi ? "Thống kê thực tế" : "Real Statistics"}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight"
                    >
                        {vi ? "Con số" : "Impressive"}{" "}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            {vi ? "ấn tượng" : "Numbers"}
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="text-sm md:text-base text-slate-500 font-medium max-w-lg mx-auto"
                    >
                        {vi ? "Được hàng ngàn khách hàng tin tưởng trên khắp nước Mỹ" : "Trusted by thousands of customers across the United States"}
                    </motion.p>
                </div>

                {/* Stats Grid — constrained max-width for smaller cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto">
                    {statsData.map((stat, index) => (
                        <StatCard key={stat.label} {...stat} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
