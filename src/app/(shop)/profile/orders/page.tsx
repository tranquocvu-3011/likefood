"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Orders Page - Premium Design with Hero Section & Stats
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
    Clock, Truck, CheckCircle2, X, Eye, Loader2,
    Package, ArrowLeft, BarChart3, ShoppingBag, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import { formatPrice } from "@/lib/currency";

interface Order {
    id: number;
    status: string;
    total: number;
    createdAt: string;
    items: {
        id: number;
        quantity: number;
        product: {
            id: number;
            slug?: string | null;
            name: string;
            image?: string | null;
        };
    }[];
}

export default function OrdersPage() {
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const { isVietnamese } = useLanguage();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const url = filter === "all"
                ? "/api/user/orders"
                : `/api/user/orders?status=${filter}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            logger.error("Failed to fetch orders", error as Error, { context: 'profile-orders-page' });
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=" + window.location.pathname);
        }

        if (sessionStatus === "authenticated") {
            fetchOrders();
        }
    }, [sessionStatus, filter, router, fetchOrders]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = orders.length;
        const pending = orders.filter(o => o.status === "PENDING").length;
        const shipping = orders.filter(o => o.status === "SHIPPING").length;
        const completed = orders.filter(o => o.status === "COMPLETED").length;
        const totalSpent = orders.filter(o => o.status === "COMPLETED").reduce((sum, o) => sum + o.total, 0);
        return { total, pending, shipping, completed, totalSpent };
    }, [orders]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Clock className="w-4 h-4" />;
            case "SHIPPING":
                return <Truck className="w-4 h-4" />;
            case "COMPLETED":
                return <CheckCircle2 className="w-4 h-4" />;
            case "CANCELLED":
                return <X className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-orange-50 text-orange-600 border-orange-100";
            case "SHIPPING":
                return "bg-blue-50 text-blue-600 border-blue-100";
            case "COMPLETED":
                return "bg-green-50 text-green-600 border-green-100";
            case "CANCELLED":
                return "bg-red-50 text-red-600 border-red-100";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "PENDING":
                return isVietnamese ? "Đang chờ" : "Pending";
            case "SHIPPING":
                return isVietnamese ? "Đang giao" : "Shipping";
            case "COMPLETED":
                return isVietnamese ? "Hoàn thành" : "Completed";
            case "CANCELLED":
                return isVietnamese ? "Đã hủy" : "Cancelled";
            default:
                return status;
        }
    };

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
            <div className="relative overflow-hidden bg-gradient-to-r from-primary/90 via-primary to-teal-500">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

                <div className="relative page-container-wide py-6 lg:py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">{isVietnamese ? "Trang chủ" : "Home"}</Link>
                        <span>/</span>
                        <Link href="/profile" className="hover:text-white transition-colors">{isVietnamese ? "Tài khoản" : "Account"}</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{isVietnamese ? "Đơn hàng" : "Orders"}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <Link href="/profile" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                    {isVietnamese ? "Quay lại" : "Back"}
                                </Link>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-2">
                                {isVietnamese ? "Đơn hàng của tôi" : "My orders"}
                            </h1>
                            <p className="text-white/70 font-medium">
                                {isVietnamese ? "Theo dõi và quản lý tất cả đơn hàng của bạn" : "Track and manage all your orders"}
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                        {[
                            { label: isVietnamese ? "Tổng đơn" : "Total", value: stats.total, icon: <BarChart3 className="w-4 h-4" />, color: "bg-white/10" },
                            { label: isVietnamese ? "Đang chờ" : "Pending", value: stats.pending, icon: <Clock className="w-4 h-4" />, color: "bg-orange-500/20" },
                            { label: isVietnamese ? "Đang giao" : "Shipping", value: stats.shipping, icon: <Truck className="w-4 h-4" />, color: "bg-blue-500/20" },
                            { label: isVietnamese ? "Hoàn thành" : "Completed", value: stats.completed, icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-green-500/20" },
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.color} backdrop-blur-sm rounded-2xl p-4 text-white border border-white/10`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {stat.icon}
                                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="page-container-wide mt-8">
                {/* Filters */}
                <div className="mb-8 flex flex-wrap gap-3">
                    {[
                        { value: "all", label: isVietnamese ? "Tất cả" : "All" },
                        { value: "PENDING", label: isVietnamese ? "Đang chờ" : "Pending" },
                        { value: "SHIPPING", label: isVietnamese ? "Đang giao" : "Shipping" },
                        { value: "COMPLETED", label: isVietnamese ? "Hoàn thành" : "Completed" },
                        { value: "CANCELLED", label: isVietnamese ? "Đã hủy" : "Cancelled" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${filter === option.value
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
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">{isVietnamese ? "Đang tải đơn hàng..." : "Loading orders..."}</p>
                    </div>
                )}

                {/* Orders List */}
                {!isLoading && orders.length === 0 ? (
                    <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100 bg-white overflow-hidden">
                        <CardContent className="p-20 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                                {isVietnamese ? "Chưa có đơn hàng nào" : "No orders yet"}
                            </h3>
                            <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto">
                                {isVietnamese
                                    ? "Khám phá hàng ngàn đặc sản Việt Nam và đặt đơn hàng đầu tiên của bạn ngay hôm nay!"
                                    : "Explore thousands of Vietnamese specialty products and place your first order today!"}
                            </p>
                            <Link href="/products">
                                <button className="px-8 py-4 bg-primary text-white rounded-full font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                    {isVietnamese ? "Mua sắm ngay" : "Shop now"}
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : !isLoading && (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-2xl transition-all overflow-hidden bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                                            {isVietnamese ? "Mã đơn hàng" : "Order ID"}
                                                        </p>
                                                        <p className="text-lg font-black text-slate-900">
                                                            #{String(order.id).toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        {getStatusText(order.status)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(order.createdAt).toLocaleDateString(isVietnamese ? "vi-VN" : "en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Package className="w-3.5 h-3.5" />
                                                        {order.items.length} {isVietnamese ? "sản phẩm" : "items"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {order.items.slice(0, 4).map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 relative"
                                                        >
                                                            {item.product.image ? (
                                                                <Image
                                                                    src={item.product.image}
                                                                    alt={item.product.name}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="56px"
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400">
                                                                    {item.product.name[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {order.items.length > 4 && (
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-100 shadow-inner">
                                                            +{order.items.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                                        {isVietnamese ? "Tổng tiền" : "Total"}
                                                    </p>
                                                    <p className="text-2xl font-black text-primary">
                                                        {formatPrice(order.total)}
                                                    </p>
                                                </div>
                                                <Link href={`/orders/${order.id}`}>
                                                    <button className="px-6 py-3 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20">
                                                        <Eye className="w-4 h-4" />
                                                        {isVietnamese ? "Xem chi tiết" : "View details"}
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Summary at bottom */}
                        {stats.completed > 0 && (
                            <div className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    <span className="text-sm font-bold text-emerald-800">
                                        {isVietnamese
                                            ? `Tổng chi tiêu: ${formatPrice(stats.totalSpent)} qua ${stats.completed} đơn hoàn thành`
                                            : `Total spent: ${formatPrice(stats.totalSpent)} across ${stats.completed} completed orders`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
