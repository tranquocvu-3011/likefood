"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Ticket, CheckCircle2, XCircle, Clock, Loader2, ArrowLeft,
    Copy, Check, Truck, Gift, Percent, Crown, Lock, Star, Zap, ShoppingBag
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

export default function VouchersClient() {
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
    const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null);

    const fetchVouchers = useCallback(async () => {
        try {
            setIsLoading(true);
            const url = sessionStatus === "authenticated"
                ? (activeTab === "all" ? "/api/user/vouchers" : `/api/user/vouchers?status=${activeTab}`)
                : "/api/vouchers";
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setVouchers(data.vouchers || data || []);
            }
        } catch (error) {
            logger.error("Failed to fetch vouchers", error as Error, { context: 'vouchers-page' });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, sessionStatus]);

    const fetchCheckInMilestones = useCallback(async () => {
        if (sessionStatus !== "authenticated") return;
        try {
            const res = await fetch("/api/user/checkin");
            if (!res.ok) return;
            const data = await res.json();
            setPoints(data.points || 0);
            setMilestones(data.milestones || []);
        } catch (error) {
            logger.warn("Failed to fetch check-in milestones", { error: error as Error, context: "vouchers-page" });
        }
    }, [sessionStatus]);

    useEffect(() => {
        fetchVouchers();
        if (sessionStatus === "authenticated") {
            fetchCheckInMilestones();
        }
    }, [sessionStatus, activeTab, fetchVouchers, fetchCheckInMilestones]);

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

    const handleClaimMilestone = async (milestonePoints: number) => {
        if (sessionStatus !== "authenticated") return;
        setClaimingMilestone(milestonePoints);
        try {
            const res = await fetch("/api/user/checkin/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ milestonePoints }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(
                    isVietnamese ? "Nhận voucher thành công!" : "Voucher claimed!",
                    {
                        description: isVietnamese
                            ? `Mã của bạn: ${data.code} — ${data.description}`
                            : `Your code: ${data.code} — ${data.descriptionEn}`,
                        duration: 6000,
                    }
                );
                fetchCheckInMilestones();
                fetchVouchers();
            } else {
                toast.error(data.error || (isVietnamese ? "Không thể nhận voucher" : "Failed to claim voucher"));
            }
        } catch {
            toast.error(isVietnamese ? "Lỗi kết nối máy chủ" : "Connection error");
        } finally {
            setClaimingMilestone(null);
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

    if (isLoading && sessionStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const maxPoints = milestones.length > 0 ? milestones[milestones.length - 1].points : 1000;
    const progressPct = Math.min((points / maxPoints) * 100, 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20 pt-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link href="/products" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-4 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold">{isVietnamese ? "Quay lại mua sắm" : "Back to Shopping"}</span>
                    </Link>
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                                {isVietnamese ? "Trung tâm Voucher" : "Voucher Center"}
                            </h1>
                            <p className="text-slate-400 text-sm font-medium mt-1">
                                {isVietnamese ? "Khám phá các ưu đãi và mã giảm giá tốt nhất" : "Explore best offers and discount codes"}
                            </p>
                        </div>
                        {sessionStatus === "authenticated" && (
                            <div className="hidden sm:flex items-center gap-2 bg-primary/5 rounded-2xl px-4 py-2">
                                <Star className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-primary">{points} {isVietnamese ? "Xu" : "Points"}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ═══════════════ MILESTONE SECTION (Only for Logged In) ═══════════════ */}
                {sessionStatus === "authenticated" && milestones.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-10"
                    >
                        {/* Milestone Header Card */}
                        <div className="relative overflow-hidden rounded-t-[2rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 px-6 sm:px-8 py-6">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
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
                                            {isVietnamese ? "Tích điểm mỗi ngày, nhận voucher" : "Earn points daily, get coupons"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">{points}</span>
                                        <span className="text-xs font-bold text-white/40 uppercase">{isVietnamese ? "Xu" : "Pts"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative mt-6">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 rounded-full relative"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </div>
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
                                            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                                                m.claimed ? `${colors.border} bg-emerald-50/30` : m.reached ? `${colors.border} bg-white shadow-xl` : "border-slate-100 bg-slate-50/80"
                                            }`}
                                        >
                                            <div className="p-4 sm:p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center ${isLocked ? "opacity-25 grayscale" : ""}`}>
                                                        <Icon className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="mb-1.5 font-black text-xl text-slate-800">
                                                    {m.points} <span className="text-xs font-bold text-slate-400">{isVietnamese ? "xu" : "pts"}</span>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                    {isVietnamese ? m.description : m.descriptionEn}
                                                </p>
                                                {m.reached && !m.claimed && (
                                                    <button
                                                        onClick={() => handleClaimMilestone(m.points)}
                                                        className={`mt-3 w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r ${colors.bg} text-white`}
                                                    >
                                                        {isVietnamese ? "Nhận ngay" : "Claim"}
                                                    </button>
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
                                    isActive ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-500 border-slate-200"
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
                        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
                            <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">{isVietnamese ? "Không có voucher nào" : "No vouchers found"}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vouchers.map((voucher, index) => {
                                const gradient = getCategoryGradient(voucher.category);
                                return (
                                    <motion.div
                                        key={voucher.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex h-[140px]"
                                    >
                                        <div className={`w-32 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white`}>
                                            <span className="text-3xl font-black">{formatDiscount(voucher)}</span>
                                            <span className="text-[10px] font-bold opacity-70 uppercase">{isVietnamese ? "Giảm giá" : "OFF"}</span>
                                        </div>
                                        <div className="w-0 border-l border-dashed border-slate-200 relative">
                                            <div className="absolute top-0 -left-[8px] w-4 h-4 bg-slate-50 rounded-full translate-y-[-50%]" />
                                            <div className="absolute bottom-0 -left-[8px] w-4 h-4 bg-slate-50 rounded-full translate-y-[50%]" />
                                        </div>
                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-base font-bold text-slate-800">{voucher.code}</h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getStatusStyle(voucher.status)}`}>
                                                        {getStatusText(voucher.status)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-400 mt-1">
                                                    {isVietnamese ? "HSD" : "Exp"}: {new Date(voucher.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {sessionStatus === "authenticated" ? (
                                                <button
                                                    onClick={() => handleCopyCode(voucher.code)}
                                                    className={`w-full py-2 rounded-xl text-xs font-bold ${copiedCode === voucher.code ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}
                                                >
                                                    {copiedCode === voucher.code ? (isVietnamese ? "Đã sao chép" : "Copied") : (isVietnamese ? "Sao chép mã" : "Copy code")}
                                                </button>
                                            ) : (
                                                <Link href={`/login?callbackUrl=/vouchers`} className="w-full">
                                                    <button className="w-full py-2 rounded-xl text-xs font-bold bg-primary text-white">
                                                        {isVietnamese ? "Đăng nhập để nhận" : "Login to claim"}
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
