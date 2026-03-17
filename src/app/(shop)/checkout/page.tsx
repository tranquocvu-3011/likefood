"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Checkout Page – Stripe-only, single-step checkout
 * Flow: Fill shipping info → Click "Thanh toán ngay" → Redirect to Stripe
 */

import { useState, useEffect } from "react";
import { ShoppingBag, Lock, Shield, CreditCard, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { useCheckout } from "@/hooks/useCheckout";
import OrderSuccess from "@/components/checkout/OrderSuccess";
import VoucherPickerModal from "@/components/checkout/VoucherPickerModal";
import OrderSummarySaaS from "@/components/checkout/OrderSummarySaaS";
import CheckoutFormSaaS from "@/components/checkout/CheckoutFormSaaS";
import type { CheckoutVoucher } from "@/hooks/useCheckout";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function CheckoutPage() {
    const { language, t } = useLanguage();
    const checkout = useCheckout(language);
    const searchParams = useSearchParams();
    const [shownCancelMsg, setShownCancelMsg] = useState(false);
    const vi = language === "vi";

    // Show cancel message if user returned from Stripe without paying
    useEffect(() => {
        if (searchParams.get("cancelled") === "true" && !shownCancelMsg) {
            toast.info(
                vi
                    ? "Bạn đã hủy thanh toán. Giỏ hàng vẫn được giữ nguyên."
                    : "Payment cancelled. Your cart is still intact."
            );
            setShownCancelMsg(true);
        }
    }, [searchParams, vi, shownCancelMsg]);

    // ── Empty cart guard ──
    if (checkout.isCartEmpty) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 px-4">
                <div className="text-center p-10 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 max-w-sm w-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-7 h-7 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {vi ? "Giỏ hàng trống" : "Your cart is empty"}
                    </h2>
                    <p className="text-sm text-slate-500 mb-8">
                        {vi
                            ? "Hãy tiếp tục khám phá và thêm sản phẩm vào giỏ hàng."
                            : "Continue exploring and add items to your cart."}
                    </p>
                    <Link
                        href="/products"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl text-sm font-semibold hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-900/20"
                    >
                        {vi ? "Tiếp tục mua sắm" : "Continue shopping"}
                    </Link>
                </div>
            </div>
        );
    }

    // ── Success step — Show Stripe pay button ──
    if (checkout.step === 3) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-start justify-center pt-4 lg:pt-6 px-4">
                <div className="w-full max-w-2xl">
                    <OrderSuccess
                        language={language}
                        t={t}
                        orderId={checkout.orderId ? String(checkout.orderId) : null}
                        paymentMethod={checkout.paymentMethod}
                        finalTotal={checkout.finalTotal}
                    />
                </div>
            </div>
        );
    }

    // ── Main checkout flow ──
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex flex-col">

            {/* ── Checkout header ── */}
            <header className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-6 py-3 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/products"
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline font-medium">
                                {vi ? "Tiếp tục mua sắm" : "Continue Shopping"}
                            </span>
                        </Link>
                        <div className="h-5 w-px bg-slate-200" />
                        <Link href="/" aria-label="LIKEFOOD home">
                            <Image
                                src="/logo.png"
                                alt="LIKEFOOD"
                                width={100}
                                height={28}
                                className="object-contain max-h-7 w-auto"
                                priority
                            />
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span className="text-[11px] font-semibold text-emerald-700">
                                {vi ? "Thanh toán an toàn" : "Secure Checkout"}
                            </span>
                        </div>
                        {/* Stripe badge */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#635BFF]/5 rounded-lg border border-[#635BFF]/10">
                            <CreditCard className="w-3 h-3 text-[#635BFF]" />
                            <span className="text-[11px] font-semibold text-[#635BFF]">Stripe</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Progress bar ── */}
            <div className="w-full bg-slate-100 h-1">
                <div className="h-full bg-gradient-to-r from-[#635BFF] to-emerald-500 rounded-r-full transition-all duration-500 w-1/2" />
            </div>

            {/* ── Two-column layout ── */}
            <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">

                {/* LEFT COLUMN: Form */}
                <div className="flex-1 order-2 lg:order-1 overflow-y-auto">
                    {/* Mobile-only collapsible summary */}
                    <div className="lg:hidden border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                        <OrderSummarySaaS
                            items={checkout.items}
                            totalPrice={checkout.totalPrice}
                            shippingFee={checkout.shippingFee}
                            pointsUsed={checkout.pointsToUse}
                            pointsDiscount={checkout.pointsDiscount}
                            finalTotal={checkout.finalTotal}
                            selectedVoucher={checkout.selectedVoucher}
                            language={language}
                            t={t}
                            isMobile={true}
                        />
                    </div>

                    <CheckoutFormSaaS
                        step={checkout.step}
                        language={language}
                        t={t}
                        checkout={checkout}
                    />
                </div>

                {/* RIGHT COLUMN: Order Summary (Desktop) */}
                <div className="order-1 lg:order-2 hidden lg:flex flex-col w-[380px] xl:w-[420px] bg-gradient-to-b from-slate-50 to-blue-50/30 border-l border-slate-100 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto">
                    <OrderSummarySaaS
                        items={checkout.items}
                        totalPrice={checkout.totalPrice}
                        shippingFee={checkout.shippingFee}
                        pointsUsed={checkout.pointsToUse}
                        pointsDiscount={checkout.pointsDiscount}
                        finalTotal={checkout.finalTotal}
                        selectedVoucher={checkout.selectedVoucher}
                        language={language}
                        t={t}
                        isMobile={false}
                        summaryBg="lightBlue"
                    />

                    {/* Trust badges */}
                    <div className="px-6 py-5 mt-auto border-t border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] text-slate-400 font-medium">SSL 256-bit</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                                <span className="text-[10px] text-slate-400 font-medium">Powered by Stripe</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voucher Modal */}
            <VoucherPickerModal
                isOpen={checkout.showVoucherModal}
                onClose={() => checkout.setShowVoucherModal(false)}
                orderTotal={checkout.totalPrice}
                selectedVoucher={checkout.selectedVoucher}
                onSelectVoucher={(voucher) =>
                    checkout.setSelectedVoucher(voucher as CheckoutVoucher | null)
                }
            />
        </div>
    );
}
