"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartActions } from "@/contexts/CartContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Sub-components
import FeaturedHeader from "./featured/FeaturedHeader";
import FeaturedProductSlide from "./featured/FeaturedProductSlide";
import FeaturedProductPreview from "./featured/FeaturedProductPreview";
import type { FeaturedProduct } from "./featured/types";

interface FeaturedStickyShowcaseProps {
    products: FeaturedProduct[];
}

export default function FeaturedStickyShowcase({ products: initialProducts }: FeaturedStickyShowcaseProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const { addItem } = useCartActions();
    const [direction, setDirection] = useState(0);
    const [, setCursorDirection] = useState<'left' | 'right' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAddToCart = (product: FeaturedProduct) => {
        const hasDiscount = !!(product.basePrice && product.basePrice > product.price);
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            originalPrice: hasDiscount ? product.basePrice : undefined,
            salePrice: hasDiscount ? product.price : undefined,
            isOnSale: hasDiscount,
            image: product.image || undefined,
        });
        // toast handled by CartContext (auth check + success)
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const nextStep = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % initialProducts.length);
    }, [initialProducts.length]);

    const prevStep = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + initialProducts.length) % initialProducts.length);
    }, [initialProducts.length]);

    // Track mouse position ONLY in specific section
    useEffect(() => {
        if (isMobile) return;

        const section = containerRef.current?.closest('section');
        if (!section) return;

        const leftArrowSVG = `data:image/svg+xml;charset=utf8,${encodeURIComponent('<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="36" fill="rgba(0,0,0,0.35)"/><circle cx="48" cy="48" r="34" fill="rgba(255,255,255,0.15)"/><path d="M54 34L40 48L54 62" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>')}`;
        const rightArrowSVG = `data:image/svg+xml;charset=utf8,${encodeURIComponent('<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="36" fill="rgba(0,0,0,0.35)"/><circle cx="48" cy="48" r="34" fill="rgba(255,255,255,0.15)"/><path d="M42 34L56 48L42 62" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>')}`;

        const isMouseInSection = (e: MouseEvent): boolean => {
            const rect = section.getBoundingClientRect();
            return (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            );
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseInSection(e)) {
                document.body.style.cursor = 'default';
                setCursorDirection(null);
                return;
            }

            const middlePoint = window.innerWidth / 2;
            if (e.clientX < middlePoint) {
                setCursorDirection('left');
                document.body.style.cursor = `url("${leftArrowSVG}") 48 48, auto`;
            } else {
                setCursorDirection('right');
                document.body.style.cursor = `url("${rightArrowSVG}") 48 48, auto`;
            }
        };

        const handleMouseLeave = () => {
            document.body.style.cursor = 'default';
            setCursorDirection(null);
        };

        const handleClick = (e: MouseEvent) => {
            if (!isMouseInSection(e)) return;
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'A' ||
                target.closest('button') || target.closest('a') ||
                target.closest('[role="button"]')) {
                return;
            }

            const middlePoint = window.innerWidth / 2;
            if (e.clientX < middlePoint) {
                prevStep();
            } else {
                nextStep();
            }
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    section.addEventListener('mousemove', handleMouseMove);
                    section.addEventListener('mouseleave', handleMouseLeave);
                    section.addEventListener('click', handleClick);
                } else {
                    section.removeEventListener('mousemove', handleMouseMove);
                    section.removeEventListener('mouseleave', handleMouseLeave);
                    section.removeEventListener('click', handleClick);
                    document.body.style.cursor = 'default';
                    setCursorDirection(null);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(section);

        return () => {
            section.removeEventListener('mousemove', handleMouseMove);
            section.removeEventListener('mouseleave', handleMouseLeave);
            section.removeEventListener('click', handleClick);
            document.body.style.cursor = 'default';
            observer.disconnect();
        };
    }, [isMobile, prevStep, nextStep]);

    // ── Touch swipe support for mobile ──
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        touchStartX.current = null;
        touchStartY.current = null;

        // Only trigger if horizontal swipe is dominant and exceeds threshold
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0) {
                nextStep(); // Swipe left → next
            } else {
                prevStep(); // Swipe right → prev
            }
        }
    }, [nextStep, prevStep]);

    if (initialProducts.length === 0) return null;

    const prevIndex = (currentIndex - 1 + initialProducts.length) % initialProducts.length;
    const nextIndex = (currentIndex + 1) % initialProducts.length;

    return (
        <section
            ref={containerRef}
            className="relative w-screen flex flex-col overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #f9f7f4 30%, #fef3c7 50%, #f9f7f4 70%, #ecfdf5 100%)',
                minHeight: 'clamp(420px, 55vh, 600px)',
            }}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none">
                <div
                    className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,#065f46_1px,transparent_0)] [background-size:32px_32px]"
                />
            </div>

            {/* Gradient Orbs */}
            <motion.div
                className="absolute top-10 left-10 w-48 h-48 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none z-0"
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-10 right-10 w-56 h-56 bg-amber-400/8 rounded-full blur-3xl pointer-events-none z-0"
                animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <div className="relative z-10 w-full mx-auto flex flex-col h-full" style={{
                paddingTop: 'clamp(0.8rem, 1.5vw, 1.5rem)',
                paddingBottom: 'clamp(0.8rem, 1.5vw, 1.5rem)',
                paddingLeft: 'clamp(1rem, 2vw, 2rem)',
                paddingRight: 'clamp(1rem, 2vw, 2rem)',
                maxWidth: '100%'
            }}>
                <FeaturedHeader />

                <div className="relative flex flex-1 items-center" style={{ minHeight: 'clamp(220px,32vh,360px)' }}>
                    {/* Mobile arrows */}
                    <button
                        type="button"
                        onClick={prevStep}
                        aria-label="Previous featured product"
                        className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white/90 border border-slate-200 shadow-md text-slate-700 active:scale-95 transition"
                    >
                        <ChevronLeft className="w-5 h-5 mx-auto" />
                    </button>

                    <button
                        type="button"
                        onClick={nextStep}
                        aria-label="Next featured product"
                        className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white/90 border border-slate-200 shadow-md text-slate-700 active:scale-95 transition"
                    >
                        <ChevronRight className="w-5 h-5 mx-auto" />
                    </button>

                    {/* Previews */}
                    <AnimatePresence mode="popLayout" custom={direction}>
                        <FeaturedProductPreview
                            key={`left-${prevIndex}`}
                            side="left"
                            image={initialProducts[prevIndex]?.image || null}
                            onClick={prevStep}
                            direction={direction}
                        />
                    </AnimatePresence>

                    <AnimatePresence mode="popLayout" custom={direction}>
                        <FeaturedProductPreview
                            key={`right-${nextIndex}`}
                            side="right"
                            image={initialProducts[nextIndex]?.image || null}
                            onClick={nextStep}
                            direction={direction}
                        />
                    </AnimatePresence>

                    {/* Active Content */}
                    <div className="w-full h-full flex relative px-0">
                        <div className="w-full lg:max-w-[50%] mx-auto">
                            <AnimatePresence mode="wait" custom={direction}>
                                <FeaturedProductSlide
                                    key={currentIndex}
                                    product={initialProducts[currentIndex]}
                                    direction={direction}
                                    onAddToCart={handleAddToCart}
                                />
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
