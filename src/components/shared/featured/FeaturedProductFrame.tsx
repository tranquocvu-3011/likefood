"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion } from "framer-motion";

interface FeaturedProductFrameProps {
    children: React.ReactNode;
    isCenter?: boolean;
}

export default function FeaturedProductFrame({ children, isCenter = false }: FeaturedProductFrameProps) {
    return (
        <div
            className="relative w-full aspect-square flex items-center justify-center group overflow-hidden"
            data-center={isCenter}
            style={{
                borderRadius: '1.5rem',
                willChange: 'transform' // Performance optimization
            }}
        >
            {/* Outer Frame - Decorative Border */}
            <motion.div
                className="absolute inset-0 rounded-3xl border-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1))',
                    borderImage: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(245, 158, 11, 0.4), rgba(16, 185, 129, 0.4)) 1',
                    borderRadius: '1.5rem',
                    borderColor: 'rgba(16, 185, 129, 0.3)'
                }}
                animate={{
                    opacity: [0.6, 0.8, 0.6],
                    scale: [1, 1.02, 1]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Multiple Glow Layers - Optimized Blurs */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 via-amber-500/15 to-primary/20 rounded-3xl blur-2xl"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ willChange: 'opacity, transform' }}
            />

            <motion.div
                className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl opacity-40"
                animate={{
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ willChange: 'opacity' }}
            />

            {/* Animated Border Glow */}
            <motion.div
                className="absolute inset-0 rounded-3xl border-4 border-white/90 shadow-xl"
                style={{ borderRadius: '1.5rem' }}
                animate={{
                    boxShadow: [
                        '0 0 15px rgba(255, 255, 255, 0.3), 0 0 30px rgba(16, 185, 129, 0.1)',
                        '0 0 25px rgba(255, 255, 255, 0.5), 0 0 50px rgba(16, 185, 129, 0.2)',
                        '0 0 15px rgba(255, 255, 255, 0.3), 0 0 30px rgba(16, 185, 129, 0.1)'
                    ]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Inner Shadow Frame */}
            <div
                className="absolute inset-2 rounded-2xl pointer-events-none"
                style={{
                    borderRadius: '1.5rem',
                    boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.2), inset 0 -4px 20px rgba(255, 255, 255, 0.4)'
                }}
            />

            {children}

            {/* Optimized Shimmer Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 rounded-3xl pointer-events-none"
                animate={{
                    x: ['-150%', '150%']
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 4,
                    ease: "easeInOut"
                }}
                style={{ borderRadius: '1.5rem', willChange: 'transform' }}
            />
        </div>
    );
}
