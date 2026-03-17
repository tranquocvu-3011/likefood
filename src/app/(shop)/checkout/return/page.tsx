"use client";

/**
 * LIKEFOOD - Stripe Checkout Return Page
 * After paying on Stripe hosted page, user lands here to see payment result.
 * The order is created by the webhook, so we poll for the orderId.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { useCart } from "@/contexts/CartContext";

interface SessionStatus {
    status: string;
    customer_email: string | null;
    payment_status: string;
    orderId: number | null;
}

export default function CheckoutReturnPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const { clearCart } = useCart();

    const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [pollCount, setPollCount] = useState(0);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { t } = useLanguage();

    const fetchStatus = useCallback(async () => {
        if (!sessionId) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/checkout/session-status?session_id=${sessionId}`);
            if (res.ok) {
                const data: SessionStatus = await res.json();
                setSessionStatus(data);

                // If session is complete but order not yet created by webhook,
                // poll a few more times (webhook may take a moment)
                if (data.status === "complete" && !data.orderId && pollCount < 10) {
                    pollRef.current = setTimeout(() => {
                        setPollCount(prev => prev + 1);
                    }, 2000);
                    return; // Keep loading state — don't setLoading(false)
                }
            }
        } catch {
            // silently fail
        }
        setLoading(false);
    }, [sessionId, pollCount]);

    useEffect(() => {
        fetchStatus();
        return () => {
            if (pollRef.current) clearTimeout(pollRef.current);
        };
    }, [fetchStatus]);

    // Redirect to order-success page when payment is complete and order is created
    useEffect(() => {
        if (sessionStatus?.status === "complete" && sessionStatus.orderId) {
            clearCart();
            router.push(`/order-success?orderId=${sessionStatus.orderId}`);
        }
    }, [sessionStatus, clearCart, router]);

    // Redirect back to checkout if session is still open
    useEffect(() => {
        if (sessionStatus?.status === "open") {
            window.location.href = "/checkout";
        }
    }, [sessionStatus]);

    if (loading || (sessionStatus?.status === "complete" && !sessionStatus.orderId && pollCount < 10)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-500">{t("checkoutReturn.verifyingPayment")}</p>
                    <p className="text-xs text-slate-400 mt-2">
                        {pollCount > 0
                            ? t("checkoutReturn.creatingOrder") || "Đang tạo đơn hàng..."
                            : t("checkoutReturn.verifyingPayment")}
                    </p>
                </div>
            </div>
        );
    }

    if (!sessionId || !sessionStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center max-w-md px-6">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 mb-2">{t("checkoutReturn.sessionNotFound")}</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        {t("checkoutReturn.sessionInvalid")}
                    </p>
                    <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
                        <ShoppingBag className="w-4 h-4" />
                        {t("checkoutReturn.continueShopping")}
                    </Link>
                </div>
            </div>
        );
    }

    // Payment successful
    if (sessionStatus.status === "complete") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30">
                <div className="text-center max-w-lg px-6 py-16">
                    {/* Success animation circle */}
                    <div className="relative mx-auto mb-8">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-[scale-in_0.5s_ease-out]">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="absolute inset-0 w-20 h-20 bg-emerald-200/30 rounded-full animate-ping" />
                    </div>

                    <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
                        {t("checkoutReturn.paymentSuccess")}
                    </h1>

                    <p className="text-sm text-slate-500 mb-2 leading-relaxed">
                        {t("checkoutReturn.thankYou")} <strong className="text-slate-700">LIKEFOOD</strong>.
                    </p>

                    {sessionStatus.customer_email && (
                        <p className="text-sm text-slate-500 mb-6">
                            {t("checkoutReturn.emailConfirmation")}{" "}
                            <strong className="text-slate-700">{sessionStatus.customer_email}</strong>
                        </p>
                    )}

                    {sessionStatus.orderId && (
                        <div className="inline-block bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 mb-8">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("checkoutReturn.orderNumber")}</span>
                            <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                                #{sessionStatus.orderId}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {sessionStatus.orderId && (
                            <Link
                                href={`/profile/orders/${sessionStatus.orderId}`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                            >
                                {t("checkoutReturn.viewOrder")}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        <Link
                            href="/products"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {t("checkoutReturn.continueShopping")}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Payment failed or other status
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center max-w-md px-6">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">{t("checkoutReturn.paymentIncomplete")}</h1>
                <p className="text-sm text-slate-500 mb-6">
                    {t("checkoutReturn.paymentError")}
                </p>
                <Link href="/checkout" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
                    {t("checkoutReturn.retry")}
                </Link>
            </div>
        </div>
    );
}
