"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * OrderSuccess – Step 3: Order placed → Pay with Stripe
 */

import { CheckCircle2, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { PaymentMethod } from "@/hooks/useCheckout";
import PriceDisplay from "@/components/ui/price-display";
import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface OrderSuccessProps {
    language: string;
    t: (key: string) => string;
    orderId: string | null;
    paymentMethod: PaymentMethod;
    finalTotal: number;
}

export default function OrderSuccess({
    language, t, orderId, paymentMethod, finalTotal,
}: OrderSuccessProps) {
    const vi = language === "vi";
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Celebrate!
    useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Handle Stripe payment redirect
    const handleStripePayment = useCallback(async () => {
        if (!orderId || isRedirecting) return;
        setIsRedirecting(true);

        try {
            const res = await fetch("/api/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Stripe session creation failed");
            }

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(vi ? "Không nhận được URL thanh toán" : "No checkout URL received");
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error(msg);
            setIsRedirecting(false);
        }
    }, [orderId, isRedirecting, vi]);

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-10 lg:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
        >
            {/* Celebratory background accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-primary to-blue-500" />
            
            <div className="text-center mb-10 relative z-10">
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-primary text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 rotate-12"
                >
                    <CheckCircle2 className="w-14 h-14" />
                </motion.div>
                
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {vi ? "Tuyệt vời!" : "Amazing!"}
                </h2>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                    {vi ? "Đơn hàng đã được ghi nhận." : "Your order is confirmed."}
                </h3>

                {orderId && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="inline-flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 mb-8"
                    >
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
                            {vi ? "Mã đơn hàng" : "Order ID"}
                        </span>
                        <span className="font-black text-primary text-lg">#{String(orderId).slice(-8).toUpperCase()}</span>
                    </motion.div>
                )}
                
                <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed font-medium">
                    {vi ? (
                        <>
                            Cảm ơn bạn đã tin tưởng chọn{" "}
                            <span className="text-slate-900 font-black uppercase">LIKEFOOD</span>. 
                            Vui lòng thanh toán để hoàn tất đơn hàng.
                        </>
                    ) : (
                        <>
                            Thank you for choosing{" "}
                            <span className="text-slate-900 font-black uppercase">LIKEFOOD</span>. 
                            Please complete payment to finalize your order.
                        </>
                    )}
                </p>
            </div>

            {/* ── Stripe Payment Section ── */}
            <div className="bg-gradient-to-br from-[#635BFF]/5 to-[#635BFF]/10 rounded-3xl p-6 lg:p-8 mb-8 border border-[#635BFF]/20">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3 text-slate-900">
                    <CreditCard className="w-6 h-6 text-[#635BFF]" />
                    {vi ? "Thanh toán đơn hàng" : "Complete Payment"}
                </h3>

                {/* Order total */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-500">
                            {vi ? "Tổng tiền cần thanh toán" : "Total amount"}
                        </span>
                        <PriceDisplay currentPrice={finalTotal} size="lg" />
                    </div>
                </div>

                {/* Stripe Pay button */}
                <motion.button
                    onClick={handleStripePayment}
                    disabled={isRedirecting || !orderId}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#635BFF] hover:bg-[#5347FE] text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#635BFF]/30"
                >
                    {isRedirecting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {vi ? "Đang chuyển hướng..." : "Redirecting..."}
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                            </svg>
                            {vi ? "Thanh toán ngay với Stripe" : "Pay now with Stripe"}
                            <ExternalLink className="w-4 h-4 opacity-60" />
                        </>
                    )}
                </motion.button>

                <p className="text-center text-xs text-slate-400 mt-4">
                    {vi 
                        ? "Bạn sẽ được chuyển đến trang thanh toán bảo mật của Stripe" 
                        : "You will be redirected to Stripe's secure checkout page"}
                </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/products" prefetch={true}>
                    <button className="px-10 py-5 bg-black text-white rounded-full font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                        {t("shop.continueShopping")}
                    </button>
                </Link>
                {orderId && (
                    <Link href={`/orders/${orderId}`}>
                        <button className="px-10 py-5 bg-white border-2 border-slate-100 text-black rounded-full font-black uppercase tracking-widest hover:border-slate-200 transition-all">
                            {vi ? "Xem lại đơn hàng" : "View Order"}
                        </button>
                    </Link>
                )}
            </div>
        </motion.div>
    );
}
