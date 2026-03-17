"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * CheckoutFormSaaS – Single-step checkout: fill address → pay with Stripe
 */

import { AnimatePresence, motion } from "framer-motion";
import { Lock, Truck, MessageSquare, CreditCard, MapPin } from "lucide-react";
import Link from "next/link";
import ShippingForm from "./ShippingForm";

interface CheckoutFormSaaSProps {
    step: number;
    language: string;
    t: (key: string) => string;
    checkout: any;
}

export default function CheckoutFormSaaS({
    step,
    language,
    t,
    checkout,
}: CheckoutFormSaaSProps) {
    const vi = language === "vi";
    const isPickup = checkout.formData?.shippingMethod === "pickup";

    return (
        <div className="max-w-[520px] mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-5">

            {/* Single-step header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="h-[3px] rounded-full bg-primary w-16 transition-all duration-500" />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                    <span className="text-slate-500 font-semibold">
                        {isPickup
                            ? (vi ? "Nhận hàng • Stripe" : "Pickup • Stripe")
                            : (vi ? "Thanh toán qua Stripe" : "Pay with Stripe")}
                    </span>
                    {isPickup && <MapPin className="w-3 h-3 text-primary" />}
                </div>
            </div>

            {/* Single step content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key="checkout-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Step heading */}
                    <div className="mb-5">
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                            {isPickup
                                ? (vi ? "Thông tin liên hệ" : "Contact Information")
                                : (vi ? "Thông tin giao hàng" : "Shipping Information")}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            {isPickup
                                ? (vi
                                    ? "Nhập thông tin liên hệ, thanh toán qua Stripe, sau đó đến cửa hàng nhận hàng."
                                    : "Enter your contact info, pay via Stripe, then pick up at the store.")
                                : (vi
                                    ? "Nhập thông tin liên hệ và địa chỉ nhận hàng, sau đó ấn thanh toán."
                                    : "Enter your contact info, shipping address, then click Pay.")}
                        </p>
                    </div>

                    {/* Shipping form — button now triggers handleOrder directly */}
                    <ShippingForm
                        language={language}
                        t={t}
                        formData={checkout.formData}
                        updateField={checkout.updateField}
                        saveInfo={checkout.saveInfo}
                        setSaveInfo={checkout.setSaveInfo}
                        isLoggedIn={!!checkout.session?.user}
                        addresses={checkout.addresses}
                        isLoadingAddresses={checkout.isLoadingAddresses}
                        selectedAddressId={checkout.selectedAddressId}
                        selectAddress={checkout.selectAddress}
                        selectedVoucher={checkout.selectedVoucher}
                        setSelectedVoucher={checkout.setSelectedVoucher}
                        showVoucherModal={checkout.showVoucherModal}
                        setShowVoucherModal={checkout.setShowVoucherModal}
                        userPoints={checkout.userPoints}
                        usePoints={checkout.usePoints}
                        pointsToUse={checkout.pointsToUse}
                        togglePoints={checkout.togglePoints}
                        totalPrice={checkout.totalPrice}
                        formErrors={checkout.formErrors}
                        onNext={checkout.handleOrder}
                        isSubmitting={checkout.isSubmitting}
                    />

                    {/* Order Notes — inline below shipping form */}
                    <div className="mt-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {vi ? "Ghi chú đơn hàng" : "Order Notes"}
                            </span>
                        </div>
                        <textarea
                            value={checkout.orderNotes || ""}
                            onChange={(e) => checkout.setOrderNotes?.(e.target.value)}
                            placeholder={vi
                                ? "Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
                                : "e.g. Deliver during business hours, call before delivery..."}
                            rows={2}
                            maxLength={500}
                            className="w-full text-sm text-slate-700 placeholder:text-slate-300 bg-white border border-slate-150 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                        />
                    </div>

                    {/* Submitting overlay */}
                    {checkout.isSubmitting && (
                        <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium text-slate-500">
                                {vi ? "Đang chuyển đến Stripe để thanh toán..." : "Redirecting to Stripe for payment..."}
                            </span>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Footer trust bar */}
            <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {vi ? "Bảo mật" : "Secure"}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        {vi
                            ? "Kết nối được mã hóa SSL 256-bit."
                            : "256-bit SSL encrypted connection."}
                    </p>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {vi ? "Bảo vệ" : "Protected"}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        {vi
                            ? "Cam kết giao hàng và chính sách hoàn trả."
                            : "Guaranteed delivery & easy returns."}
                    </p>
                </div>
            </div>

            <p className="mt-5 text-center text-[10px] text-slate-300">
                {vi ? "Hỗ trợ:" : "Support:"}{" "}
                <Link href="/contact" className="hover:text-slate-500 transition-colors">
                    {vi ? "Liên hệ hỗ trợ" : "Contact support"}
                </Link>
            </p>
        </div>
    );
}
