"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    ArrowLeft, Clock, CheckCircle2, X, Loader2, 
    RefreshCw, AlertCircle, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface OrderItem {
    id: number;
    quantity: number;
    product: {
        name: string;
        image?: string | null;
    };
}

interface Order {
    id: number;
    status: string;
    total: number;
    createdAt: string;
    orderItems: OrderItem[];
}

interface RefundRequest {
    id: number;
    orderId: number;
    orderItemId?: string | null;
    reason: string;
    amount: number;
    status: string;
    adminNote?: string | null;
    refundMethod?: string | null;
    bankAccount?: string | null;
    bankName?: string | null;
    createdAt: string;
    updatedAt: string;
    order: Order;
}

const getStatusConfig = (vi: boolean) => ({
    PENDING: { label: vi ? "Đang chờ" : "Pending", color: "bg-orange-500", icon: Clock },
    APPROVED: { label: vi ? "Đã duyệt" : "Approved", color: "bg-blue-500", icon: CheckCircle2 },
    REJECTED: { label: vi ? "Từ chối" : "Rejected", color: "bg-red-500", icon: X },
    PROCESSING: { label: vi ? "Đang xử lý" : "Processing", color: "bg-purple-500", icon: RefreshCw },
    COMPLETED: { label: vi ? "Hoàn thành" : "Completed", color: "bg-green-500", icon: CheckCircle2 },
    CANCELLED: { label: vi ? "Đã hủy" : "Cancelled", color: "bg-slate-500", icon: X },
});

export default function RefundsPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { isVietnamese, language } = useLanguage();
    const vi = language === "vi";
    const statusConfig = getStatusConfig(vi);
    const [refunds, setRefunds] = useState<RefundRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const fetchRefunds = useCallback(async () => {
        try {
            setIsLoading(true);
            const url = filter === "all" 
                ? "/api/user/refunds" 
                : `/api/user/refunds?status=${filter}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRefunds(data.refunds || []);
            }
        } catch (error) {
            logger.error("Failed to fetch refunds", error as Error, { context: 'profile-refunds-page' });
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=" + window.location.pathname);
        }

        if (sessionStatus === "authenticated") {
            fetchRefunds();
        }
    }, [sessionStatus, router, filter, fetchRefunds]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(vi ? "vi-VN" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getStatusForRefund = (status: string) => {
        return statusConfig[status] || { label: status, color: "bg-slate-500", icon: Clock };
    };

    if (sessionStatus === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

                <div className="relative page-container-wide py-6 lg:py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">{vi ? "Trang chủ" : "Home"}</Link>
                        <span>/</span>
                        <Link href="/profile" className="hover:text-white transition-colors">{vi ? "Tài khoản" : "Account"}</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{vi ? "Hoàn tiền" : "Refunds"}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-white" />
                        </div>
                        <Link href="/profile" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            {vi ? "Quay lại" : "Back"}
                        </Link>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2">
                        {vi ? "Yêu cầu hoàn tiền" : "Refund Requests"}
                    </h1>
                    <p className="text-white/70 font-medium">
                        {vi ? "Theo dõi và quản lý tất cả yêu cầu hoàn tiền của bạn" : "Track and manage all your refund requests"}
                    </p>
                </div>
            </div>

            <div className="page-container-wide mt-8">

                {/* Filters */}
                <div className="mb-8 flex flex-wrap gap-3">
                    {[
                        { value: "all", label: isVietnamese ? "Tất cả" : "All" },
                        { value: "PENDING", label: isVietnamese ? "Đang chờ" : "Pending" },
                        { value: "APPROVED", label: isVietnamese ? "Đã duyệt" : "Approved" },
                        { value: "PROCESSING", label: isVietnamese ? "Đang xử lý" : "Processing" },
                        { value: "COMPLETED", label: isVietnamese ? "Hoàn thành" : "Completed" },
                        { value: "REJECTED", label: isVietnamese ? "Từ chối" : "Rejected" },
                    ].map((option) => (
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

                {/* Refunds List */}
                {refunds.length === 0 ? (
                    <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100 bg-white overflow-hidden">
                        <CardContent className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <RefreshCw className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                                {vi ? "Chưa có yêu cầu hoàn tiền" : "No refund requests"}
                            </h3>
                            <p className="text-slate-400 font-medium mb-8">
                                {vi ? "Các yêu cầu hoàn tiền của bạn sẽ xuất hiện tại đây" : "Your refund requests will appear here"}
                            </p>
                            <Link href="/profile/orders">
                                <button className="px-8 py-4 bg-primary text-white rounded-full font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
                                    {vi ? "Xem đơn hàng" : "View orders"}
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {refunds.map((refund) => {
                            const status = getStatusForRefund(refund.status);
                            
                            return (
                                <Card 
                                    key={refund.id} 
                                    className="rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-2xl transition-all overflow-hidden bg-white"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full ${status.color} flex items-center justify-center`}>
                                                    <status.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {vi ? "Yêu cầu hoàn tiền" : "Refund request"} #{String(refund.id).toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {vi ? "Đơn hàng" : "Order"} #{String(refund.order.id).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${status.color} text-white`}>
                                                {status.label}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        {vi ? "Số tiền" : "Amount"}
                                                    </p>
                                                    <p className="font-bold text-primary text-lg">
                                                        ${refund.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        {vi ? "Ngày yêu cầu" : "Request date"}
                                                    </p>
                                                    <p className="font-medium text-slate-700">
                                                        {formatDate(refund.createdAt)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        {vi ? "Phương thức" : "Method"}
                                                    </p>
                                                    <p className="font-medium text-slate-700">
                                                        {refund.refundMethod === "ORIGINAL" ? (vi ? "Hoàn về thanh toán ban đầu" : "Refund to original payment") : (vi ? "Chuyển khoản ngân hàng" : "Bank transfer")}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        {vi ? "Lý do" : "Reason"}
                                                    </p>
                                                    <p className="font-medium text-slate-700 line-clamp-1">
                                                        {refund.reason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {refund.adminNote && (
                                            <div className="bg-blue-50 rounded-2xl p-4 mb-4 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">
                                                        {vi ? "Phản hồi từ admin" : "Admin response"}
                                                    </p>
                                                    <p className="text-sm text-blue-800">
                                                        {refund.adminNote}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <Link href={`/profile/orders/${refund.orderId}`}>
                                            <button className="w-full py-3 bg-slate-100 text-slate-700 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                                {vi ? "Xem chi tiết đơn hàng" : "View order details"}
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
