"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * OrderSummarySaaS – Premium SaaS-style order summary panel
 */

import Image from "next/image";
import { ShieldCheck, Lock, ChevronDown, Tag, Coins, Package, Star } from "lucide-react";
import { POINTS_PER_DOLLAR } from "@/lib/commerce";
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
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Cost breakdown — aligned grid */}
                <div className="space-y-2 text-[13px]">
                    {/* Subtotal row */}
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">{vi ? "Tạm tính" : "Subtotal"}</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                            <PriceDisplay currentPrice={totalPrice} size="xs" showDiscountBadge={false} />
                        </span>
                    </div>

                    {/* Voucher discount row */}
                    {selectedVoucher && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{vi ? "Mã giảm giá" : "Coupon"}</span>
                                <span className="text-[10px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold tracking-wide">
                                    {selectedVoucher.code}
                                </span>
                            </span>
                            <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap font-semibold text-emerald-600 tabular-nums">
                                <span aria-hidden="true">-</span>
                                <PriceDisplay currentPrice={discount} size="xs" showDiscountBadge={false} className="whitespace-nowrap" />
                            </span>
                        </div>
                    )}

                    {/* Points used row */}
                    {pointsUsed > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                                <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{vi ? "Dùng Xu" : "Points used"}</span>
                                <span className="text-[10px] text-amber-500">({pointsUsed} xu)</span>
                            </span>
                            <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap font-semibold text-amber-600 tabular-nums">
                                <span aria-hidden="true">-</span>
                                <PriceDisplay currentPrice={pointsDiscount} size="xs" showDiscountBadge={false} className="whitespace-nowrap" />
                            </span>
                        </div>
                    )}

                    {/* Shipping row */}
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">{vi ? "Phí vận chuyển" : "Shipping"}</span>
                        {shippingFee > 0 ? (
                            <span className="font-semibold text-slate-800 tabular-nums">
                                <PriceDisplay currentPrice={shippingFee} size="xs" showDiscountBadge={false} />
                            </span>
                        ) : (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {vi ? "Miễn phí" : "Free"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Total */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-bold text-slate-800">
                        {vi ? "Tổng cộng" : "Total due"}
                    </span>
                    <div className="text-right">
                        <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                            <PriceDisplay currentPrice={finalTotal} showDiscountBadge={false} />
                        </div>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                            {vi ? "Đã gồm thuế & phí" : "Incl. taxes & fees"}
                        </p>
                    </div>
                </div>

                {/* ★ Earned points CTA banner */}
                {(() => {
                    const earnedPoints = Math.floor(totalPrice * POINTS_PER_DOLLAR);
                    if (earnedPoints <= 0) return null;
                    return (
                        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 rounded-xl px-3.5 py-3">
                            {/* Decorative sparkles */}
                            <div className="absolute top-1 right-2 text-amber-300/40 text-lg">✦</div>
                            
                            <div className="flex items-center gap-2.5 relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200/50">
                                    <Star className="w-4 h-4 text-white fill-white drop-shadow-sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-amber-900 leading-snug">
                                        {vi
                                            ? `Thanh toán ngay để nhận `
                                            : `Pay now to earn `}
                                        <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-md mx-0.5 shadow-sm">
                                            +{earnedPoints} {vi ? "xu" : "pts"}
                                        </span>
                                        {vi ? " đổi thưởng!" : " rewards!"}
                                    </p>
                                    <p className="text-[9px] text-amber-600/70 mt-0.5 font-medium">
                                        {vi
                                            ? `Tích ${POINTS_PER_DOLLAR} xu cho mỗi $1 • Đổi voucher giảm giá`
                                            : `${POINTS_PER_DOLLAR} pts per $1 • Redeem for discount vouchers`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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
