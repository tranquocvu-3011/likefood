"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion } from "framer-motion";
import { Shield, Truck, RotateCcw, Lock, Headphones, Award } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { FREE_SHIPPING_THRESHOLD_USD } from "@/lib/commerce";
import { formatPrice } from "@/lib/currency";

export default function WhyChooseUs() {
    const { t, language } = useLanguage();

    const reasons = [
        {
            icon: Award,
            title: t('home.whyChooseUsAuthentic'),
            description: t('home.whyChooseUsAuthenticDesc'),
            gradient: "from-amber-400 to-orange-500",
            glow: "rgba(251,146,60,0.20)",
        },
        {
            icon: Truck,
            title: t('home.whyChooseUsFreeShipping'),
            description: language === "vi" 
                ? `Đơn hàng trên ${formatPrice(FREE_SHIPPING_THRESHOLD_USD)} giao miễn phí toàn quốc` 
                : `Free nationwide shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD_USD)}`,
            gradient: "from-blue-500 to-cyan-400",
            glow: "rgba(59,130,246,0.20)",
        },
        {
            icon: Shield,
            title: t('home.whyChooseUsFastDelivery'),
            description: t('home.whyChooseUsFastDeliveryDesc'),
            gradient: "from-emerald-500 to-green-400",
            glow: "rgba(16,185,129,0.20)",
        },
        {
            icon: Lock,
            title: t('home.whyChooseUsSecurePayment'),
            description: t('home.whyChooseUsSecurePaymentDesc'),
            gradient: "from-violet-500 to-purple-400",
            glow: "rgba(139,92,246,0.20)",
        },
        {
            icon: RotateCcw,
            title: t('home.whyChooseUsReturns'),
            description: t('home.whyChooseUsReturnsDesc'),
            gradient: "from-rose-500 to-pink-400",
            glow: "rgba(244,63,94,0.20)",
        },
        {
            icon: Headphones,
            title: t('home.whyChooseUsSupport'),
            description: t('home.whyChooseUsSupportDesc'),
            gradient: "from-indigo-500 to-blue-400",
            glow: "rgba(99,102,241,0.20)",
        },
    ];

    return (
        <section className="relative py-7 md:py-10 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/60 overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/3 w-[600px] h-[400px] bg-amber-50/60 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-[500px] h-[350px] bg-emerald-50/50 rounded-full blur-3xl" />
            </div>

            <div className="relative page-container-wide">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-3"
                    >
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        {t('home.ourPromise')}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl md:text-3xl xl:text-4xl font-black text-slate-900 mb-3 leading-tight"
                    >
                        {t("home.whyChooseUs")}{" "}
                        <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                            LIKEFOOD
                        </span>?
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto"
                    >
                        {language === "vi"
                            ? "Cam kết mang đến trải nghiệm mua sắm tốt nhất cho bạn"
                            : "Committed to providing you the best shopping experience"}
                    </motion.p>
                </div>

                {/* Reasons Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {reasons.map((reason, index) => (
                        <motion.div
                            key={reason.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{
                                duration: 0.7,
                                delay: index * 0.1,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                        >
                            <motion.div
                                whileHover={{ y: -10, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="relative h-full bg-white rounded-2xl p-5 md:p-6 border border-slate-100 group overflow-hidden cursor-default"
                                style={{
                                    boxShadow: `0 4px 24px -4px rgba(0,0,0,0.07), 0 12px 40px -8px ${reason.glow}`,
                                }}
                            >
                                {/* Top accent bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${reason.gradient} rounded-t-3xl`} />

                                {/* Hover glow overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${reason.gradient} opacity-0 group-hover:opacity-[0.06] rounded-3xl transition-opacity duration-500 pointer-events-none`} />

                                {/* Decorative circle */}
                                <div
                                    className={`absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br ${reason.gradient} opacity-[0.07] rounded-full blur-xl transition-all duration-500 group-hover:opacity-[0.14] group-hover:scale-125`}
                                />

                                {/* Icon */}
                                <motion.div
                                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${reason.gradient} flex items-center justify-center mb-4 shadow-lg`}
                                >
                                    <reason.icon className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow" />
                                </motion.div>

                                {/* Title */}
                                <h3 className="text-base md:text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors duration-300">
                                    {reason.title}
                                </h3>

                                {/* Description */}
                                <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                                    {reason.description}
                                </p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
