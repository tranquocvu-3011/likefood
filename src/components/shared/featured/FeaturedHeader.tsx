"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";

export default function FeaturedHeader() {
    const { t } = useLanguage();
    return (
        <motion.div
            className="text-center mb-[clamp(0.9rem,1.8vw,1.5rem)]"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.div
                className="inline-block border-b-2 border-slate-900 relative"
                style={{ paddingBottom: 'clamp(0.15rem,0.24vw,0.225rem)', marginBottom: 'clamp(0.3rem,0.6vw,0.6rem)' }}
                initial={{ width: 0 }}
                whileInView={{ width: '60px' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
            />
            <motion.h2
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-black uppercase tracking-tighter text-slate-900 leading-[0.9] relative"
                style={{ fontSize: 'clamp(0.75rem,2.1vw,1.8rem)' }}
            >
                <span className="relative z-10">{t('shop.featuredProducts')}</span>
                <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 via-amber-500/20 to-primary/20 blur-xl"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.h2>
        </motion.div>
    );
}
