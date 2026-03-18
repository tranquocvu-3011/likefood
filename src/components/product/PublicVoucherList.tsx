"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect } from "react";
import { Ticket, TicketIcon, Percent, Truck, Gift, Zap, Info, ArrowRight, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/context";
import { useSession } from "next-auth/react";

interface Voucher {
    id: number;
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
    startDate: string;
    endDate: string;
    category: string;
    status: string;
}

export default function PublicVoucherList() {
    const { isVietnamese, t } = useLanguage();
    const { status: sessionStatus } = useSession();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        async function fetchVouchers() {
            try {
                const res = await fetch("/api/vouchers");
                if (res.ok) {
                    const data = await res.json();
                    setVouchers(data || []);
                }
            } catch (err) {
                console.error("Failed to fetch public vouchers", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchVouchers();
    }, []);

    const filteredVouchers = vouchers.filter(v => {
        if (filter === "all") return true;
        return v.category === filter;
    });

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "shipping": return Truck;
            case "flash": return Zap;
            case "new": return Gift;
            default: return Percent;
        }
    };

    const getCategoryGradient = (cat: string) => {
        switch (cat) {
            case "shipping": return "from-sky-500 to-blue-600";
            case "flash": return "from-rose-500 to-red-600";
            case "new": return "from-emerald-500 to-teal-600";
            default: return "from-primary to-emerald-600";
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-slate-400 font-medium">{isVietnamese ? "Đang tải ưu đãi..." : "Loading offers..."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: "all", label: isVietnamese ? "Tất cả" : "All", icon: TicketIcon },
                    { id: "shipping", label: isVietnamese ? "Vận chuyển" : "Shipping", icon: Truck },
                    { id: "flash", label: isVietnamese ? "Flash Sale" : "Flash Sale", icon: Zap },
                    { id: "new", label: isVietnamese ? "Người mới" : "New User", icon: Gift },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = filter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${
                                isActive
                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
                {filteredVouchers.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                            {isVietnamese ? "Không tìm thấy voucher" : "No vouchers found"}
                        </h3>
                        <p className="text-slate-400 mt-2">
                            {isVietnamese ? "Hiện tại chưa có ưu đãi nào trong mục này." : "Currently no offers in this category."}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {filteredVouchers.map((voucher, idx) => {
                            const Icon = getCategoryIcon(voucher.category);
                            const gradient = getCategoryGradient(voucher.category);
                            return (
                                <motion.div
                                    key={voucher.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="flex">
                                        {/* Left Side: Value */}
                                        <div className={`w-28 sm:w-32 flex-shrink-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white relative`}>
                                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                                <Icon className="w-full h-full scale-150 rotate-12" />
                                            </div>
                                            <span className="text-2xl sm:text-3xl font-black">
                                                {voucher.discountType === "PERCENTAGE" ? `${voucher.discountValue}%` : `$${voucher.discountValue.toFixed(0)}`}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                                                {isVietnamese ? "Giảm giá" : "Discount"}
                                            </span>
                                        </div>

                                        {/* Dashed line */}
                                        <div className="w-0 border-l-2 border-dashed border-slate-100 relative">
                                            <div className="absolute -top-2 -left-[5px] w-2.5 h-2.5 bg-slate-50 rounded-full border border-slate-100" />
                                            <div className="absolute -bottom-2 -left-[5px] w-2.5 h-2.5 bg-slate-50 rounded-full border border-slate-100" />
                                        </div>

                                        {/* Right Side: Info */}
                                        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="text-base font-black text-slate-800 tracking-tight">{voucher.code}</h3>
                                                <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                    {isVietnamese ? "Công khai" : "Public"}
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 mb-3">
                                                {isVietnamese ? "Đơn tối thiểu" : "Min order"}: ${voucher.minOrderValue || 0}
                                                {voucher.maxDiscount && ` • ${isVietnamese ? "Giảm tối đa" : "Max"} $${voucher.maxDiscount}`}
                                            </p>
                                            
                                            <Link href={sessionStatus === "authenticated" ? "/profile/vouchers" : "/login?callbackUrl=/profile/vouchers"}>
                                                <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                                    {sessionStatus === "authenticated" ? (isVietnamese ? "Lưu vào ví" : "Add to Wallet") : (isVietnamese ? "Đăng nhập để nhận" : "Login to Claim")}
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
