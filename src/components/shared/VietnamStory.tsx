"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion, useScroll, useTransform } from "framer-motion";
import { Package, Truck, Home, Star, Shield, Zap } from "lucide-react";
import { useRef } from "react";
import { useLanguage } from "@/lib/i18n/context";

const stepsVi = [
    {
        icon: Package,
        badge: "Bước 1",
        title: "Tuyển chọn",
        description: "Trực tiếp khảo sát và lựa chọn từng sản phẩm từ các vùng đặc sản nổi tiếng nhất Việt Nam — Hội An, Huế, Tây Nguyên.",
        stat: "100+ nguồn hàng",
    },
    {
        icon: Truck,
        badge: "Bước 2",
        title: "Đóng gói",
        description: "Quy trình đóng gói tiêu chuẩn quốc tế, bảo quản lạnh nếu cần thiết — đảm bảo chất lượng nguyên vẹn suốt hành trình.",
        stat: "Chuẩn quốc tế",
    },
    {
        icon: Home,
        badge: "Bước 3",
        title: "Giao hàng",
        description: "Giao tận nhà bạn ở Mỹ chỉ trong 2–3 ngày. Theo dõi đơn hàng thời gian thực, nhận ngay khi còn tươi.",
        stat: "2–3 ngày tới tay",
    },
];

const stepsEn = [
    {
        icon: Package,
        badge: "Step 1",
        title: "Selection",
        description: "We personally survey and select each product from Vietnam's most famous specialty regions — Hoi An, Hue, Central Highlands.",
        stat: "100+ sources",
    },
    {
        icon: Truck,
        badge: "Step 2",
        title: "Packaging",
        description: "International standard packaging process, cold storage when necessary — ensuring quality remains intact throughout the journey.",
        stat: "Intl. standard",
    },
    {
        icon: Home,
        badge: "Step 3",
        title: "Delivery",
        description: "Delivered to your door in the US in just 2–3 days. Real-time order tracking, received while still fresh.",
        stat: "2–3 day delivery",
    },
];

const stepStyles = [
    {
        gradient: "from-blue-500 via-cyan-500 to-teal-400",
        glow: "shadow-blue-500/40",
        bg: "from-blue-50 to-cyan-50",
        border: "border-blue-100",
        accent: "text-blue-600",
        ring: "ring-blue-200",
        statIcon: Star,
    },
    {
        gradient: "from-violet-500 via-purple-500 to-pink-500",
        glow: "shadow-purple-500/40",
        bg: "from-violet-50 to-pink-50",
        border: "border-violet-100",
        accent: "text-violet-600",
        ring: "ring-violet-200",
        statIcon: Shield,
    },
    {
        gradient: "from-orange-500 via-rose-500 to-red-500",
        glow: "shadow-orange-500/40",
        bg: "from-orange-50 to-rose-50",
        border: "border-orange-100",
        accent: "text-orange-600",
        ring: "ring-orange-200",
        statIcon: Zap,
    },
];

// Use numeric coordinates in a 100x100 viewBox (equivalent to percentage values)
const floatingDots = [
    { cx: 10, cy: 20, r: 3, delay: 0 },
    { cx: 90, cy: 15, r: 5, delay: 0.5 },
    { cx: 5, cy: 70, r: 4, delay: 1 },
    { cx: 95, cy: 65, r: 3, delay: 1.5 },
    { cx: 50, cy: 5, r: 6, delay: 0.8 },
    { cx: 30, cy: 90, r: 4, delay: 0.3 },
    { cx: 70, cy: 85, r: 3, delay: 1.2 },
];

export default function VietnamStory() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const { language } = useLanguage();
    const vi = language === "vi";
    const steps = vi ? stepsVi : stepsEn;

    const statsBottom = vi
        ? [
            { value: "100+", label: "Sản phẩm đặc sản" },
            { value: "2–3", label: "Ngày giao hàng" },
            { value: "10K+", label: "Khách hàng tin dùng" },
            { value: "100%", label: "Chính hãng" },
        ]
        : [
            { value: "100+", label: "Specialty products" },
            { value: "2–3", label: "Day delivery" },
            { value: "10K+", label: "Trusted customers" },
            { value: "100%", label: "Authentic" },
        ];

    return (
        <section ref={sectionRef} className="relative py-6 md:py-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
            {/* Light background glows */}
            <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[70%] bg-emerald-200/40 rounded-full blur-[140px]" />
                <div className="absolute top-[10%] right-[-10%] w-[50%] h-[60%] bg-violet-200/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] left-[20%] w-[60%] h-[50%] bg-blue-200/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-orange-200/30 rounded-full blur-[80px]" />
            </motion.div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(rgba(0,0,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.6) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Floating dots - Safe SVG with validated values */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {floatingDots.filter(dot => dot != null && dot.cx != null && dot.cy != null && dot.r != null).map((dot, i) => {
                    const cx = Number(dot.cx) || 0;
                    const cy = Number(dot.cy) || 0;
                    const r = Number(dot.r) || 1;
                    return (
                        <motion.circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="rgba(16,185,129,0.12)"
                            initial={{ cy }}
                            animate={{ cy: [cy - 2, cy + 2] }}
                            transition={{ duration: 3 + i * 0.5, repeat: Infinity, repeatType: "reverse", delay: dot.delay, ease: "easeInOut" }}
                        />
                    );
                })}
            </svg>

            <motion.div style={{ opacity }} className="w-full px-6 sm:px-10 lg:px-[8%] relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="text-center mb-10"
                >
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-block px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-700 mb-4"
                    >
                        🇻🇳 {vi ? "Hành trình của chúng tôi" : "Our Journey"}
                    </motion.span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-none tracking-tight mb-3">
                        {vi ? "Từ " : "From "}
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                {vi ? "Việt Nam" : "Vietnam"}
                            </span>
                            <motion.span
                                className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            />
                        </span>
                        {vi ? " đến " : " to "}
                        <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                            {vi ? "nhà bạn" : "your home"}
                        </span>
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
                        {vi
                            ? "Hành trình mang hương vị quê nhà đến tận tay bạn tại Hoa Kỳ"
                            : "The journey of bringing homeland flavors right to your doorstep in the USA"}
                    </p>
                </motion.div>

                {/* Steps grid — full width */}
                <div className="grid md:grid-cols-3 gap-4 lg:gap-6 relative">
                    {/* Animated connector line (desktop) */}
                    <div className="hidden md:block absolute top-[56px] left-[calc(16.66%+12px)] right-[calc(16.66%+12px)] h-px z-0">
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-300/50 via-purple-300/50 to-orange-300/50" />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"
                                initial={{ scaleX: 0, originX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
                            />
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 -ml-2 rounded-full bg-white blur-sm shadow-lg shadow-slate-300/80"
                                animate={{ x: ["0%", "100%"] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 2 }}
                            />
                        </div>
                    </div>

                    {steps.map((step, index) => {
                        const style = stepStyles[index];
                        return (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.25, 0, 1] }}
                                className="relative z-10"
                            >
                                <motion.div
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="relative group"
                                >
                                    {/* Step icon bubble */}
                                    <div className="flex justify-center mb-3">
                                        <div className="relative">
                                            <motion.div
                                                animate={{ scale: [1, 1.15, 1] }}
                                                transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
                                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${style.gradient} blur-md opacity-40`}
                                            />
                                            <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg ${style.glow}`}>
                                                <step.icon className="w-5 h-5 text-white" strokeWidth={2} />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                <span className="text-[8px] font-black text-slate-600">{index + 1}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className={`relative rounded-2xl border ${style.border} bg-white shadow-md group-hover:shadow-xl transition-all duration-500 overflow-hidden`}>
                                        <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-60`} />
                                        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                                        <div className={`h-0.5 w-full bg-gradient-to-r ${style.gradient}`} />

                                        <div className="relative p-4 lg:p-5">
                                            <span className={`inline-block text-[9px] font-black uppercase tracking-[0.2em] ${style.accent} mb-2 px-2 py-0.5 rounded-full bg-white border ${style.border}`}>
                                                {step.badge}
                                            </span>
                                            <h3 className="text-base lg:text-lg font-black text-slate-900 mb-2 leading-tight">
                                                {step.title}
                                            </h3>
                                            <p className="text-slate-500 text-xs leading-relaxed mb-3">
                                                {step.description}
                                            </p>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border ${style.border} shadow-sm`}>
                                                <style.statIcon className={`w-3 h-3 ${style.accent}`} />
                                                <span className={`text-[10px] font-black ${style.accent} uppercase tracking-wide`}>
                                                    {step.stat}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${style.gradient} opacity-[0.06]`} />
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom story block */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="mt-8"
                >
                    <div className="relative rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden px-6 py-6 lg:px-10 lg:py-8 text-center shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-blue-50/60 pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

                        <p className="relative text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                            {vi
                                ? <>Chúng tôi trực tiếp khảo sát và lựa chọn từng sản phẩm từ các vùng đất nổi tiếng với đặc sản.
                                    Mỗi món hàng được đóng gói cẩn thận và vận chuyển nhanh chóng,{" "}
                                    <span className="font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                        đảm bảo giữ nguyên hương vị Việt Nam
                                    </span>{" "}
                                    khi đến tay bạn ở Hoa Kỳ.</>
                                : <>We personally survey and select each product from regions famous for their specialties.
                                    Every item is carefully packaged and shipped quickly,{" "}
                                    <span className="font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                        ensuring authentic Vietnamese flavors are preserved
                                    </span>{" "}
                                    when they reach you in the USA.</>}
                        </p>

                        {/* Trust stats row */}
                        <div className="flex flex-wrap justify-center gap-6 mt-5">
                            {statsBottom.map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                                    className="text-center"
                                >
                                    <p className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-none mb-0.5">
                                        {stat.value}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        {stat.label}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
