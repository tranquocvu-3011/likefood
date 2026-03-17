"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Ticket, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft,
    Copy, Check, Truck, Gift, Percent, Crown, Lock, Star, Zap
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

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
    status: "available" | "used" | "expired";
    claimedAt: string;
    usedAt: string | null;
}

interface VoucherMilestone {
    points: number;
    code: string;
    discountType: string;
    discountValue: number;
    maxDiscount: number;
    category: string;
    description: string;
    descriptionEn: string;
    reached: boolean;
    claimed: boolean;
}

const getTabs = (vi: boolean) => [
    { id: "all", label: vi ? "Tất cả" : "All", icon: Ticket },
    { id: "available", label: vi ? "Có thể dùng" : "Available", icon: CheckCircle2 },
    { id: "used", label: vi ? "Đã dùng" : "Used", icon: XCircle },
    { id: "expired", label: vi ? "Hết hạn" : "Expired", icon: Clock },
];

const MILESTONE_COLORS = [
    { bg: "from-sky-500 to-blue-600", light: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", ring: "ring-sky-500/20", shadow: "shadow-sky-200/50" },
    { bg: "from-emerald-500 to-green-600", light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", ring: "ring-emerald-500/20", shadow: "shadow-emerald-200/50" },
    { bg: "from-violet-500 to-purple-600", light: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", ring: "ring-violet-500/20", shadow: "shadow-violet-200/50" },
    { bg: "from-amber-500 to-orange-600", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", ring: "ring-amber-500/20", shadow: "shadow-amber-200/50" },
];

export default function VoucherWalletPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { isVietnamese } = useLanguage();
    const tabs = getTabs(isVietnamese);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [points, setPoints] = useState(0);
    const [milestones, setMilestones] = useState<VoucherMilestone[]>([]);

    const fetchVouchers = useCallback(async () => {
        try {
            setIsLoading(true);
            const url = activeTab === "all"
                ? "/api/user/vouchers"
                : `/api/user/vouchers?status=${activeTab}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setVouchers(data.vouchers || []);
            }
        } catch (error) {
            logger.error("Failed to fetch vouchers", error as Error, { context: 'profile-vouchers-page' });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    const fetchCheckInMilestones = useCallback(async () => {
        try {
            const res = await fetch("/api/user/checkin");
            if (!res.ok) return;
            const data = await res.json();
            setPoints(data.points || 0);
            setMilestones(data.milestones || []);
        } catch (error) {
            logger.warn("Failed to fetch check-in milestones", { error: error as Error, context: "profile-vouchers-page" });
        }
    }, []);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=/profile/vouchers");
            return;
        }
        if (sessionStatus === "authenticated") {
            fetchVouchers();
            fetchCheckInMilestones();
        }
    }, [sessionStatus, activeTab, router, fetchVouchers, fetchCheckInMilestones]);

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success(isVietnamese ? `Đã sao chép mã ${code}!` : `Copied code ${code}!`);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {
            toast.error(isVietnamese ? "Không thể sao chép mã" : "Unable to copy code");
        }
    };

    const formatDiscount = (v: Voucher) => v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : `$${v.discountValue.toFixed(0)}`;

    const getCategoryGradient = (cat: string) => {
        switch (cat) {
            case "shipping": return "from-sky-500 to-blue-600";
            case "flash": return "from-rose-500 to-red-600";
            case "new": return "from-emerald-500 to-teal-600";
            case "checkin": return "from-violet-500 to-purple-600";
            default: return "from-primary to-emerald-600";
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "available": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "used": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
            case "expired": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "available": return isVietnamese ? "Có thể dùng" : "Available";
            case "used": return isVietnamese ? "Đã dùng" : "Used";
            case "expired": return isVietnamese ? "Hết hạn" : "Expired";
            default: return status;
        }
    };

    const getMilestoneIcon = (m: VoucherMilestone) => {
        if (m.category === "shipping") return Truck;
        if (m.points >= 1000) return Crown;
        return Percent;
    };

    if (sessionStatus === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const maxPoints = milestones.length > 0 ? milestones[milestones.length - 1].points : 1000;
    const progressPct = Math.min((points / maxPoints) * 100, 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link href="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-4 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold">{isVietnamese ? "Quay lại Profile" : "Back to Profile"}</span>
                    </Link>
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                                {isVietnamese ? "Ví Voucher" : "Voucher Wallet"}
                            </h1>
                            <p className="text-slate-400 text-sm font-medium mt-1">
                                {isVietnamese ? "Quản lý và sử dụng mã giảm giá của bạn" : "Manage and use your discount codes"}
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 bg-primary/5 rounded-2xl px-4 py-2">
                            <Star className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-primary">{points} {isVietnamese ? "Xu" : "Points"}</span>
                        </div>
                    </div>
                </motion.div>

                {/* ═══════════════ MILESTONE SECTION ═══════════════ */}
                {milestones.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-10"
                    >
                        {/* Milestone Header Card */}
                        <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 px-6 sm:px-8 py-6">
                            {/* Ambient light effects */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                            <div className="absolute top-4 right-32 w-2 h-2 bg-emerald-400/60 rounded-full animate-pulse" />
                            <div className="absolute bottom-6 right-16 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                        <Gift className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">
                                            {isVietnamese ? "Mốc thưởng Check-in" : "Check-in Rewards"}
                                        </h2>
                                        <p className="text-xs text-white/40 font-medium">
                                            {isVietnamese ? "Tích điểm mỗi ngày, nhận voucher miễn phí" : "Earn points daily, get free vouchers"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">{points}</span>
                                        <span className="text-xs font-bold text-white/40 uppercase">{isVietnamese ? "Xu" : "Pts"}</span>
                                    </div>
                                    <p className="text-[10px] text-white/30 font-medium mt-0.5">
                                        {isVietnamese ? `Cần ${maxPoints - points} xu nữa` : `${maxPoints - points} more to max`}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative mt-6">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 rounded-full relative"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full" />
                                    </motion.div>
                                </div>

                                {/* Progress Labels */}
                                <div className="flex justify-between mt-2">
                                    {milestones.map((m) => (
                                        <span key={m.code} className={`text-[10px] font-bold transition-colors ${m.reached ? "text-emerald-400" : "text-white/25"}`}>
                                            {m.points}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Milestone Cards Grid */}
                        <div className="bg-white rounded-b-[2rem] shadow-2xl shadow-slate-200/50 p-4 sm:p-6 border border-slate-100 border-t-0">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {milestones.map((m, index) => {
                                    const Icon = getMilestoneIcon(m);
                                    const colors = MILESTONE_COLORS[index % MILESTONE_COLORS.length];
                                    const isLocked = !m.reached;

                                    return (
                                        <motion.div
                                            key={m.code}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 + index * 0.08, duration: 0.4 }}
                                            whileHover={!isLocked ? { y: -3, transition: { duration: 0.2 } } : {}}
                                            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                                                m.claimed
                                                    ? `${colors.border} bg-gradient-to-br from-white ${colors.light}/30 shadow-lg ${colors.shadow}`
                                                    : m.reached
                                                        ? `${colors.border} bg-white shadow-md hover:shadow-xl ${colors.shadow} cursor-pointer`
                                                        : "border-slate-100 bg-slate-50/80"
                                            }`}
                                        >
                                            {/* Top Accent */}
                                            <div className={`h-1 bg-gradient-to-r ${colors.bg} ${isLocked ? "opacity-20" : "opacity-100"}`} />

                                            <div className="p-4 sm:p-5">
                                                {/* Icon + Status Row */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center transition-all duration-300 ${
                                                        isLocked ? "opacity-25 grayscale" : `shadow-md ${colors.shadow}`
                                                    }`}>
                                                        <Icon className="w-5 h-5 text-white" />
                                                    </div>

                                                    {m.claimed ? (
                                                        <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-lg">
                                                            <Check className="w-3 h-3" strokeWidth={3} />
                                                            <span className="text-[9px] font-bold uppercase">{isVietnamese ? "Đã nhận" : "Got it"}</span>
                                                        </div>
                                                    ) : isLocked ? (
                                                        <div className="flex items-center gap-1 text-slate-300 bg-slate-100 px-2 py-0.5 rounded-lg">
                                                            <Lock className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase">{isVietnamese ? "Khóa" : "Locked"}</span>
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center gap-1 ${colors.light} ${colors.text} px-2 py-0.5 rounded-lg`}>
                                                            <Zap className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase">{isVietnamese ? "Sẵn sàng" : "Ready"}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Points */}
                                                <div className="mb-1.5">
                                                    <span className={`text-2xl sm:text-[1.75rem] font-black tracking-tight leading-none ${
                                                        isLocked ? "text-slate-300" : "text-slate-800"
                                                    }`}>
                                                        {m.points}
                                                    </span>
                                                    <span className={`text-xs font-bold ml-1 ${isLocked ? "text-slate-300" : "text-slate-400"}`}>
                                                        {isVietnamese ? "xu" : "pts"}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className={`text-xs font-semibold leading-relaxed ${
                                                    isLocked ? "text-slate-400" : "text-slate-500"
                                                }`}>
                                                    {isVietnamese ? m.description : m.descriptionEn}
                                                </p>

                                                {/* Progress mini bar for locked */}
                                                {isLocked && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {points}/{m.points}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {Math.round((points / m.points) * 100)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min((points / m.points) * 100, 100)}%` }}
                                                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════ VOUCHER TABS ═══════════════ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${
                                    isActive
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </motion.div>

                {/* ═══════════════ VOUCHERS LIST ═══════════════ */}
                <AnimatePresence mode="wait">
                    {vouchers.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden"
                        >
                            <div className="py-20 px-8 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Ticket className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    {isVietnamese ? "Chưa có voucher nào" : "No vouchers yet"}
                                </h3>
                                <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto">
                                    {activeTab === "available"
                                        ? (isVietnamese ? "Bạn chưa có voucher nào có thể sử dụng" : "You don't have any available vouchers")
                                        : activeTab === "used"
                                            ? (isVietnamese ? "Bạn chưa sử dụng voucher nào" : "You haven't used any vouchers yet")
                                            : activeTab === "expired"
                                                ? (isVietnamese ? "Không có voucher nào hết hạn" : "No expired vouchers")
                                                : (isVietnamese ? "Hãy kiểm tra Voucher Center để nhận ưu đãi" : "Check Voucher Center for deals")}
                                </p>
                                <Link href="/vouchers">
                                    <button className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                                        {isVietnamese ? "Xem Voucher Center" : "View Voucher Center"}
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {vouchers.map((voucher, index) => {
                                const gradient = getCategoryGradient(voucher.category);
                                return (
                                    <motion.div
                                        key={voucher.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={`group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden ${
                                            voucher.status !== "available" ? "opacity-70" : ""
                                        }`}
                                    >
                                        <div className="flex">
                                            {/* Left Discount Badge */}
                                            <div className={`w-28 sm:w-32 flex-shrink-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
                                                <div className="absolute inset-0 opacity-20">
                                                    <div className="absolute top-2 left-2 w-12 h-12 border border-white/30 rounded-full" />
                                                    <div className="absolute bottom-2 right-2 w-8 h-8 border border-white/20 rounded-full" />
                                                </div>
                                                <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-sm relative">
                                                    {formatDiscount(voucher)}
                                                </span>
                                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-0.5 relative">
                                                    {voucher.discountType === "PERCENTAGE" ? (isVietnamese ? "Giảm giá" : "Off") : (isVietnamese ? "Giảm" : "Off")}
                                                </span>
                                            </div>

                                            {/* Dashed divider */}
                                            <div className="w-0 border-l-2 border-dashed border-slate-100 relative">
                                                <div className="absolute -top-3 -left-[7px] w-3.5 h-3.5 bg-gradient-to-b from-slate-50 to-white rounded-full border border-slate-100" />
                                                <div className="absolute -bottom-3 -left-[7px] w-3.5 h-3.5 bg-gradient-to-t from-slate-50 to-white rounded-full border border-slate-100" />
                                            </div>

                                            {/* Right Content */}
                                            <div className="flex-1 p-4 sm:p-5">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-base font-bold text-slate-800 tracking-tight">{voucher.code}</h3>
                                                        {voucher.maxDiscount && (
                                                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                                {isVietnamese ? "Tối đa" : "Up to"} ${voucher.maxDiscount.toFixed(0)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getStatusStyle(voucher.status)}`}>
                                                        {voucher.status === "available" && <CheckCircle2 className="w-3 h-3" />}
                                                        {voucher.status === "used" && <XCircle className="w-3 h-3" />}
                                                        {voucher.status === "expired" && <Clock className="w-3 h-3" />}
                                                        {getStatusText(voucher.status)}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 mb-3">
                                                    {voucher.minOrderValue ? (
                                                        <p className="text-[11px] font-medium text-slate-400">
                                                            {isVietnamese ? "Đơn tối thiểu" : "Min order"}: ${voucher.minOrderValue.toFixed(0)}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-[11px] font-medium text-slate-400">
                                                        {isVietnamese ? "HSD" : "Exp"}: {new Date(voucher.endDate).toLocaleDateString(isVietnamese ? "vi-VN" : "en-US")}
                                                    </p>
                                                </div>

                                                {voucher.status === "available" && (
                                                    <button
                                                        onClick={() => handleCopyCode(voucher.code)}
                                                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                            copiedCode === voucher.code
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.97]"
                                                        }`}
                                                    >
                                                        {copiedCode === voucher.code ? (
                                                            <><Check className="w-3.5 h-3.5" /> {isVietnamese ? "Đã sao chép!" : "Copied!"}</>
                                                        ) : (
                                                            <><Copy className="w-3.5 h-3.5" /> {isVietnamese ? "Sao chép mã" : "Copy code"}</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
