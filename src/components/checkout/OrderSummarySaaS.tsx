"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * OrderSummarySaaS – Premium SaaS-style order summary panel
 */

import Image from "next/image";
import { ShieldCheck, Lock, ChevronDown, Tag, Coins, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import PriceDisplay from "@/components/ui/price-display";

interface OrderSummarySaaSProps {
    items: any[];
    totalPrice: number;
    shippingFee: number;
    pointsUsed: number;
    pointsDiscount: number;
    finalTotal: number;
    selectedVoucher: any | null;
    language: string;
    t: (key: string) => string;
    isMobile?: boolean;
    /** "lightBlue" = nền xanh nước nhạt cho cột sản phẩm (Stripe-style) */
    summaryBg?: "default" | "lightBlue";
}

export default function OrderSummarySaaS({
    items,
    totalPrice,
    shippingFee,
    pointsUsed,
    pointsDiscount,
    finalTotal,
    selectedVoucher,
    language,
    t,
    isMobile = false,
    summaryBg = "default",
}: OrderSummarySaaSProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const vi = language === "vi";
    const discount = selectedVoucher?.discountAmount || 0;
    const isLightBlue = summaryBg === "lightBlue";

    function SummaryBody() {
        return (
            <div className="space-y-4 px-5 pb-6 pt-4">
                {/* Items list */}
                <div className="space-y-2.5">
                    {items.map((item, index) => (
                        <div key={item.id || item.productId || `item-${index}`} className="flex items-start gap-2.5">
                            {/* Thumbnail */}
                            <div className="relative flex-shrink-0 w-[42px] h-[42px] rounded-lg overflow-hidden bg-white border border-slate-200">
                                {(item.image || item.product?.image) ? (
                                    <Image
                                        src={item.image || item.product?.image}
                                        alt={item.name || item.product?.name || "Product"}
                                        fill
                                        className="object-cover"
                                        sizes="42px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <Package className="w-4 h-4 text-slate-300" />
                                    </div>
                                )}
                                <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] font-bold rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center border border-white">
                                    {item.quantity}
                                </span>
                            </div>

                            {/* Name & variant */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate leading-snug">
                                    {item.name || item.product?.name || "Sản phẩm"}
                                </p>
                                {(item.variant || item.category) && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {item.variant?.weight || item.variant?.flavor || item.category}
                                    </p>
                                )}
                            </div>

                            {/* Line price */}
                            <div className="text-xs font-semibold text-slate-900 flex-shrink-0">
                                <PriceDisplay currentPrice={(item.price || item.product?.price || 0) * item.quantity} size="sm" showDiscountBadge={false} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200" />

                {/* Cost breakdown */}
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">{vi ? "Tạm tính" : "Subtotal"}</span>
                        <span className="font-medium text-slate-900">
                            <PriceDisplay currentPrice={totalPrice} size="sm" showDiscountBadge={false} />
                        </span>
                    </div>

                    {selectedVoucher && (
                        <div className="flex justify-between text-emerald-600">
                            <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3 flex-shrink-0" />
                                {vi ? "Giảm giá" : "Discount"}
                                <span className="text-[9px] bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-medium">
                                    {selectedVoucher.code}
                                </span>
                            </span>
                            <span className="font-medium">-<PriceDisplay currentPrice={discount} size="sm" showDiscountBadge={false} /></span>
                        </div>
                    )}

                    {pointsUsed > 0 && (
                        <div className="flex justify-between text-amber-600">
                            <span className="flex items-center gap-1">
                                <Coins className="w-3 h-3 flex-shrink-0" />
                                {vi ? "Dùng Xu" : "Points"} ({pointsUsed})
                            </span>
                            <span className="font-medium">-<PriceDisplay currentPrice={pointsDiscount} size="sm" showDiscountBadge={false} /></span>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <span className="text-slate-500">{vi ? "Phí vận chuyển" : "Shipping"}</span>
                        {shippingFee > 0 ? (
                            <span className="font-medium text-slate-900">
                                <PriceDisplay currentPrice={shippingFee} size="sm" showDiscountBadge={false} />
                            </span>
                        ) : (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                {vi ? "Miễn phí" : "Free"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Total */}
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700">
                        {vi ? "Tổng cộng" : "Total due"}
                    </span>
                    <div className="text-right">
                        <div className="text-base font-bold text-slate-900 tracking-tight">
                            <PriceDisplay currentPrice={finalTotal} showDiscountBadge={false} />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                            {vi ? "Bao gồm thuế & phí" : "Incl. taxes & fees"}
                        </p>
                    </div>
                </div>

                {/* Trust indicators – desktop only */}
                {!isMobile && (
                    <div className="pt-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="text-[10px] text-slate-500">
                                {vi ? "Thanh toán an toàn & mã hóa SSL 256-bit" : "Secured & 256-bit SSL encrypted"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-[10px] text-slate-500">
                                {vi ? "Quyền lợi người mua được bảo vệ" : "Buyer protection guaranteed"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* ── Mobile: collapsible accordion ── */
    if (isMobile) {
        return (
            <div className="bg-white">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs"
                    aria-expanded={isExpanded}
                >
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                            {isExpanded
                                ? (vi ? "Ẩn đơn hàng" : "Hide summary")
                                : (vi ? "Xem đơn hàng" : "Show order summary")}
                        </span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                    </div>
                    <span className="font-bold text-slate-900">
                        <PriceDisplay currentPrice={finalTotal} showDiscountBadge={false} />
                    </span>
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-slate-100"
                        >
                            <SummaryBody />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    /* ── Desktop: full sticky panel ── */
    return (
        <div className="h-full flex flex-col">
            {/* Logo header */}
            <div className="px-6 py-5 border-b border-slate-200">
                <Image
                    src="/logo.png"
                    alt="LIKEFOOD"
                    width={120}
                    height={32}
                    className="object-contain max-h-7 w-auto"
                    priority
                />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                <SummaryBody />
            </div>
        </div>
    );
}
