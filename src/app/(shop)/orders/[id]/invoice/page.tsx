"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        id: number;
        name: string;
        image?: string | null;
    };
}

interface Order {
    id: number;
    status: string;
    total: number;
    subtotal?: number;
    shippingFee?: number;
    discount?: number;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    shippingZipCode?: string | null;
    shippingPhone?: string | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    createdAt: string;
    items: OrderItem[];
}

export default function InvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { t, language } = useLanguage();
    const locale = language === "vi" ? "vi-VN" : "en-US";

    const fetchOrder = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/user/orders/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            } else {
                router.push("/profile/orders");
            }
        } catch (error) {
            logger.error("Failed to fetch order", error as Error, { context: 'order-invoice-page' });
            router.push("/profile/orders");
        } finally {
            setIsLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login?callbackUrl=" + window.location.pathname);
            return;
        }
        if (sessionStatus === "authenticated" && params.id) {
            fetchOrder();
        }
    }, [sessionStatus, params.id, router, fetchOrder]);

    const handlePrint = () => {
        window.print();
    };

    if (sessionStatus === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) return null;

    const isPaid = order.paymentStatus === "PAID" || order.status === "DELIVERED" || order.status === "SHIPPED";

    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
            <div className="max-w-3xl mx-auto px-4">

                {/* Screen-only toolbar */}
                <div className="print:hidden mb-6 flex items-center justify-between">
                    <Link
                        href={`/orders/${params.id}`}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("invoice.backToOrder")}
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-colors shadow"
                    >
                        <Download className="w-4 h-4" />
                        {t("invoice.printPdf")}
                    </button>
                </div>

                {/* Invoice Card */}
                <div className="bg-white shadow-2xl print:shadow-none relative overflow-hidden" style={{ borderRadius: "1rem" }}>

                    {/* PAID stamp */}
                    {isPaid && (
                        <div className="absolute top-8 right-8 rotate-[-15deg] z-10 print:block">
                            <div className="border-4 border-emerald-500 rounded-lg px-4 py-1.5">
                                <span className="text-2xl font-black tracking-widest text-emerald-500 uppercase opacity-80">PAID</span>
                            </div>
                        </div>
                    )}

                    {/* Top accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

                    {/* Invoice Header */}
                    <div className="px-8 pt-7 pb-6 border-b border-slate-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">LIKE</h1>
                                    <h1 className="text-3xl font-black uppercase tracking-tighter text-emerald-600">FOOD</h1>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t("invoice.tagline")}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{t("invoice.invoiceLabel")}</p>
                                <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                                    #{String(order.id).toUpperCase()}
                                </p>
                                <p className="text-xs text-slate-400 mt-1.5 font-medium">
                                    {new Date(order.createdAt).toLocaleDateString(locale, {
                                        year: "numeric", month: "long", day: "numeric",
                                    })}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(order.createdAt).toLocaleTimeString(locale, {
                                        hour: "2-digit", minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Shipping Info */}
                    <div className="px-8 py-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 bg-slate-50/50">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{t("invoice.customer")}</p>
                            <p className="font-black text-slate-900 text-sm">{session?.user?.name || t("invoice.defaultCustomer")}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{session?.user?.email}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{t("invoice.shipTo")}</p>
                            {order.shippingAddress ? (
                                <>
                                    <p className="font-bold text-slate-900 text-sm leading-relaxed">
                                        {order.shippingAddress}
                                        {order.shippingCity && `, ${order.shippingCity}`}
                                        {order.shippingZipCode && ` ${order.shippingZipCode}`}
                                    </p>
                                    {order.shippingPhone && (
                                        <p className="text-xs text-slate-500 mt-0.5">{order.shippingPhone}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-slate-400 italic">{t("invoice.noAddress")}</p>
                            )}
                        </div>
                    </div>

                    {/* Payment method badge */}
                    {order.paymentMethod && (
                        <div className="px-8 py-3 border-b border-slate-100 flex items-center gap-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t("invoice.payment")}</p>
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                                {order.paymentMethod}
                            </span>
                            {isPaid && (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                                    {t("invoice.paid")}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="px-8 py-5">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left pb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{t("invoice.productCol")}</th>
                                    <th className="text-center pb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 w-16">{t("invoice.qtyCol")}</th>
                                    <th className="text-right pb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 w-28">{t("invoice.priceCol")}</th>
                                    <th className="text-right pb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 w-28">{t("invoice.totalCol")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        className={`border-b border-slate-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                                    >
                                        <td className="py-3">
                                            <p className="font-bold text-slate-900 text-sm leading-tight">{item.product.name}</p>
                                        </td>
                                        <td className="py-3 text-center text-slate-500 font-bold text-sm">{item.quantity}</td>
                                        <td className="py-3 text-right text-slate-500 font-medium text-sm">{formatPrice(item.price)}</td>
                                        <td className="py-3 text-right font-black text-slate-900 text-sm">{formatPrice(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="px-8 pb-7 border-t border-dashed border-slate-200 pt-5">
                        <div className="max-w-xs ml-auto space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span className="font-bold">{t("invoice.subtotal")}</span>
                                <span className="font-black text-slate-700">{formatPrice(order.subtotal ?? order.total)}</span>
                            </div>
                            {order.shippingFee && order.shippingFee > 0 && (
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span className="font-bold">{t("invoice.shipping")}</span>
                                    <span className="font-black text-slate-700">{formatPrice(order.shippingFee)}</span>
                                </div>
                            )}
                            {(order.discount ?? 0) > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span className="font-bold">{t("invoice.discount")}</span>
                                    <span className="font-black">-{formatPrice(order.discount || 0)}</span>
                                </div>
                            )}
                            {/* Total row */}
                            <div className="mt-3 pt-3 border-t-2 border-slate-200">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t("invoice.grandTotal")}</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                            {t("invoice.thankYou")}
                        </p>
                        <p className="text-[9px] text-slate-300 font-medium">
                            {t("invoice.autoGenerated")} · {new Date().getFullYear()} LIKEFOOD
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                }
            `}</style>
        </div>
    );
}
