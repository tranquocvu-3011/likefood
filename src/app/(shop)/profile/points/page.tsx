"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Points History Page - Premium Design with Hero & Earn Guide
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft, Loader2, Plus, Minus, Gift, Clock,
    CheckCircle2, Info, ChevronDown, ChevronUp,
    Sparkles, ShoppingCart, Star, Users, Zap
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface PointTransaction {
    id: number;
    amount: number;
    type: string;
    description?: string | null;
    orderId?: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function PointsHistoryPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
    const [currentPoints, setCurrentPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const { t, language } = useLanguage();
    const vi = language === "vi";

    const typeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
        EARN: { label: t("points.typeEarn"), color: "text-green-600", bgColor: "bg-green-50", icon: Plus },
        SPEND: { label: t("points.typeSpend"), color: "text-red-600", bgColor: "bg-red-50", icon: Minus },
        REFUND: { label: t("points.typeRefund"), color: "text-blue-600", bgColor: "bg-blue-50", icon: CheckCircle2 },
        EXPIRED: { label: t("points.typeExpired"), color: "text-slate-500", bgColor: "bg-slate-50", icon: Clock },
    };

    const filterOptions = [
        { value: "all", label: t("points.filterAll") },
        { value: "EARN", label: t("points.filterEarn") },
        { value: "SPEND", label: t("points.filterSpend") },
        { value: "REFUND", label: t("points.filterRefund") },
        { value: "EXPIRED", label: t("points.filterExpired") },
    ];

    const fetchTransactions = useCallback(async () => {
        try {
            setIsLoading(true);
            const url = `/api/user/points?page=1&limit=50${filter !== "all" ? `&type=${filter}` : ''}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
                setPagination(data.pagination);
                setCurrentPoints(data.currentPoints || 0);
            }
        } catch (error) {
            logger.error("Failed to fetch points", error as Error, { context: 'profile-points-page' });
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=" + window.location.pathname);
        }

        if (sessionStatus === "authenticated") {
            fetchTransactions();
        }
    }, [sessionStatus, router, filter, fetchTransactions]);

    const formatDate = (dateString: string) => {
        const locale = language === "vi" ? "vi-VN" : "en-US";
        return new Date(dateString).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getTypeConfig = (type: string) => {
        return typeConfig[type] || { label: type, color: "text-slate-600", bgColor: "bg-slate-50", icon: Info };
    };

    // Calculate totals
    const totalEarned = transactions
        .filter(t => t.type === "EARN")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = transactions
        .filter(t => t.type === "SPEND")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (sessionStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-300/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />

                <div className="relative page-container-wide py-6 lg:py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">{vi ? "Trang chủ" : "Home"}</Link>
                        <span>/</span>
                        <Link href="/profile" className="hover:text-white transition-colors">{vi ? "Tài khoản" : "Account"}</Link>
                        <span>/</span>
                        <span className="text-white font-bold">LIKEFOOD Xu</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <Link href="/profile" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                    {vi ? "Quay lại" : "Back"}
                                </Link>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2">
                                {t("points.title")}
                            </h1>
                            <p className="text-white/70 font-medium">
                                {t("points.subtitle")}
                            </p>
                        </div>

                        {/* Current Balance Highlight */}
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 min-w-[200px] text-center">
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{t("points.currentBalance")}</p>
                            <p className="text-4xl font-black text-white tracking-tighter">{currentPoints.toLocaleString()}</p>
                            <p className="text-white/60 text-xs font-bold mt-1">LIKEFOOD Xu</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Plus className="w-4 h-4 text-green-200" />
                                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("points.totalEarned")}</span>
                            </div>
                            <p className="text-2xl font-black text-green-200">+{totalEarned.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Minus className="w-4 h-4 text-red-200" />
                                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{t("points.totalSpent")}</span>
                            </div>
                            <p className="text-2xl font-black text-red-200">-{totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-container-wide mt-8">
                {/* How to Earn Section */}
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-100 p-6 md:p-8">
                    <h2 className="text-lg font-black uppercase tracking-tight text-amber-900 mb-5 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        {vi ? "Cách kiếm LIKEFOOD Xu" : "How to earn LIKEFOOD Xu"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: <ShoppingCart className="w-5 h-5 text-amber-600" />,
                                title: vi ? "Mua sắm" : "Shopping",
                                desc: vi ? "Nhận 1 xu cho mỗi $1 chi tiêu" : "Earn 1 xu per $1 spent",
                            },
                            {
                                icon: <Star className="w-5 h-5 text-amber-600" />,
                                title: vi ? "Đánh giá" : "Reviews",
                                desc: vi ? "Nhận 5 xu khi đánh giá sản phẩm" : "Get 5 xu per product review",
                            },
                            {
                                icon: <Users className="w-5 h-5 text-amber-600" />,
                                title: vi ? "Giới thiệu" : "Referrals",
                                desc: vi ? "Nhận 50 xu khi bạn bè mua hàng" : "Get 50 xu when friends order",
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-amber-100/50">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm">{item.title}</p>
                                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-3">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                                filter === option.value
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">{vi ? "Đang tải lịch sử..." : "Loading history..."}</p>
                    </div>
                )}

                {/* Transactions List */}
                {!isLoading && transactions.length === 0 ? (
                    <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100 bg-white overflow-hidden">
                        <CardContent className="p-20 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Gift className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                                {t("points.noTransactions")}
                            </h3>
                            <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto">
                                {vi
                                    ? "Mua sắm ngay để tích lũy LIKEFOOD Xu và đổi lấy ưu đãi hấp dẫn!"
                                    : "Start shopping to earn LIKEFOOD Xu and redeem exciting rewards!"}
                            </p>
                            <Link href="/products">
                                <button className="px-8 py-4 bg-amber-500 text-white rounded-full font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                                    {t("points.shopNow")}
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : !isLoading && (
                    <Card className="rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {transactions.map((transaction, index) => {
                                    const config = getTypeConfig(transaction.type);
                                    const isPositive = transaction.amount > 0;
                                    const isExpanded = expandedId === transaction.id;

                                    return (
                                        <motion.div
                                            key={transaction.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="p-4 md:p-5 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                                        <config.icon className={`w-6 h-6 ${config.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            {config.label}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {formatDate(transaction.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className={`text-xl font-black ${isPositive ? "text-green-600" : "text-red-600"}`}>
                                                        {isPositive ? "+" : ""}{transaction.amount}
                                                    </p>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {isExpanded && transaction.description && (
                                                <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                                                    <p className="text-sm text-slate-600">
                                                        {transaction.description}
                                                    </p>
                                                    {transaction.orderId && (
                                                        <Link
                                                            href={`/orders/${transaction.orderId}`}
                                                            className="inline-block mt-2 text-sm text-primary hover:underline font-bold"
                                                        >
                                                            {t("points.viewOrder")} →
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
