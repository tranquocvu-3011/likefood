"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion } from "framer-motion";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import FeaturedProductFrame from "./FeaturedProductFrame";

interface FeaturedProductPreviewProps {
    image: string | null;
    onClick: () => void;
    side: 'left' | 'right';
    direction: number;
}

const previewVariants = {
    enter: (params: { side: 'left' | 'right'; direction: number }) => {
        const { direction } = params;
        // NEXT (dir=1): everything enters from RIGHT (+x)
        // PREV (dir=-1): everything enters from LEFT (-x)
        return {
            opacity: 0,
            x: direction > 0 ? 80 : -80,
            scale: 0.85,
        };
    },
    center: {
        opacity: 1,
        x: 0,
        scale: 1,
    },
    exit: (params: { side: 'left' | 'right'; direction: number }) => {
        const { direction } = params;
        // NEXT (dir=1): everything exits to LEFT (-x)
        // PREV (dir=-1): everything exits to RIGHT (+x)
        return {
            opacity: 0,
            x: direction > 0 ? -80 : 80,
            scale: 0.85,
        };
    },
};

export default function FeaturedProductPreview({ image, onClick, side, direction }: FeaturedProductPreviewProps) {
    return (
        <motion.div
            key={`preview-${side}-${image}`}
            custom={{ side, direction }}
            variants={previewVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
                type: "tween",
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.3 },
            }}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-0"
            style={{
                width: 'clamp(160px, 22vw, 250px)',
                left: side === 'left' ? '6%' : 'auto',
                right: side === 'right' ? '6%' : 'auto',
                willChange: 'transform, opacity',
            }}
        >
            <div className="w-full cursor-pointer opacity-100" onClick={onClick}>
                <FeaturedProductFrame>
                    {/* Product Image */}
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            rotate: [0, 1.5, -1.5, 0]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: [0.4, 0, 0.6, 1]
                        }}
                        className="relative w-full h-full flex items-center justify-center z-10"
                        style={{ willChange: 'transform' }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.08 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            className="relative w-full h-full overflow-hidden shadow-2xl"
                            style={{
                                borderRadius: '1.5rem',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(16, 185, 129, 0.1)'
                            }}
                        >
                            <ImageWithFallback
                                src={image}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                    </motion.div>
                </FeaturedProductFrame>
            </div>
        </motion.div>
    );
}
