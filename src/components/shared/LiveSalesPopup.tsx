"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { useLanguage } from "@/lib/i18n/context";

interface SaleNotification {
    id: string | number;
    userName: string;
    location: string;
    productName: string;
    productImage?: string;
    timeAgo: string;
}

/** Khoảng thời gian giữa các lần hiện thông báo: ~10 phút (ms) */
const NOTIFICATION_INTERVAL_MS = 10 * 60 * 1000;
/** Độ lệch ngẫu nhiên ±1 phút để tránh quá đều */
const INTERVAL_JITTER_MS = 60 * 1000;

const SAMPLE_SALES_VI: SaleNotification[] = [
    { id: "1", userName: "Khách hàng", location: "California", productName: "Cá Lóc Khô Đồng Tháp", timeAgo: "2 phút trước" },
    { id: "2", userName: "Khách hàng", location: "Texas", productName: "Tôm Khô Cà Mau", timeAgo: "5 phút trước" },
    { id: "3", userName: "Khách hàng", location: "Washington", productName: "Mực Khô Câu Phú Quốc", timeAgo: "8 phút trước" },
    { id: "4", userName: "Khách hàng", location: "Florida", productName: "Xoài Sấy Dẻo Cam Ranh", timeAgo: "12 phút trước" },
    { id: "5", userName: "Khách hàng", location: "New York", productName: "Nước Mắm Phú Quốc", timeAgo: "15 phút trước" },
];

const SAMPLE_SALES_EN: SaleNotification[] = [
    { id: "1", userName: "Customer", location: "California", productName: "Dong Thap Dried Snakehead Fish", timeAgo: "2 minutes ago" },
    { id: "2", userName: "Customer", location: "Texas", productName: "Ca Mau Dried Shrimp", timeAgo: "5 minutes ago" },
    { id: "3", userName: "Customer", location: "Washington", productName: "Phu Quoc Hook-Caught Dried Squid", timeAgo: "8 minutes ago" },
    { id: "4", userName: "Customer", location: "Florida", productName: "Cam Ranh Dried Mango", timeAgo: "12 minutes ago" },
    { id: "5", userName: "Customer", location: "New York", productName: "Phu Quoc Fish Sauce", timeAgo: "15 minutes ago" },
];

export default function LiveSalesPopup() {
    const { isChatOpen } = useChatOpen();
    const { t, language } = useLanguage();
    const [currentSale, setCurrentSale] = useState<SaleNotification | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');

    const sampleSales = language === "en" ? SAMPLE_SALES_EN : SAMPLE_SALES_VI;

    useEffect(() => {
        if (isAdminRoute || isChatOpen) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const getNextDelay = () =>
            NOTIFICATION_INTERVAL_MS + (Math.random() * 2 - 1) * INTERVAL_JITTER_MS;

        const showRandomSale = () => {
            const randomIndex = Math.floor(Math.random() * sampleSales.length);
            setCurrentSale(sampleSales[randomIndex]);
            setIsVisible(true);

            setTimeout(() => {
                setIsVisible(false);
                timerRef.current = setTimeout(showRandomSale, getNextDelay());
            }, 6000);
        };

        timerRef.current = setTimeout(showRandomSale, getNextDelay());
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isAdminRoute, isChatOpen, sampleSales]);

    if (isAdminRoute) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && !isChatOpen && currentSale && (
                <motion.div
                    initial={{ opacity: 0, x: -50, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    className="fixed bottom-6 left-6 z-[1000] max-w-[320px] w-full"
                >
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-4 relative overflow-hidden group">
                        {/* Status bar */}
                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary to-emerald-500 w-full" />

                        {/* Product Image / Icon */}
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                            {currentSale.productImage ? (
                                <Image
                                    src={currentSale.productImage}
                                    alt={currentSale.productName}
                                    width={56}
                                    height={56}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-primary" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t("liveSales.newOrder")}</span>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            </div>
                            <p className="text-[13px] leading-tight text-slate-900 font-bold mb-0.5">
                                {currentSale.userName} <span className="font-medium text-slate-500 text-[11px]">({currentSale.location})</span>
                            </p>
                            <p className="text-[12px] text-slate-600 line-clamp-1 italic font-medium">
                                {t("liveSales.bought")} &quot;{currentSale.productName}&quot;
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{currentSale.timeAgo}</span>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-300 hover:text-slate-500"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Sparkle effect on hover */}
                        <div className="absolute -inset-x-full inset-y-0 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
