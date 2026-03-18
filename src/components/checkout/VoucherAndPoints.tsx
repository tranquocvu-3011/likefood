"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * VoucherAndPoints – Voucher picker & Loyalty points toggle
 */

import { Ticket, X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { CheckoutVoucher } from "@/hooks/useCheckout";
import PriceDisplay from "@/components/ui/price-display";
import { formatPrice } from "@/lib/currency";

interface VoucherAndPointsProps {
    language: string;
    t: any;
    selectedVoucher: CheckoutVoucher | null;
    setSelectedVoucher: (v: CheckoutVoucher | null) => void;
    setShowVoucherModal: (v: boolean) => void;
    userPoints: number;
    usePoints: boolean;
    pointsToUse: number;
    togglePoints: () => void;
}

export default function VoucherAndPoints({
    language, t, selectedVoucher, setSelectedVoucher, setShowVoucherModal,
    userPoints, usePoints, pointsToUse, togglePoints,
}: VoucherAndPointsProps) {
    return (
        <>
            <div className="mt-5 pt-5 border-t border-slate-100 uppercase tracking-widest text-[#64748b] font-bold text-[9px] mb-3">
                {t('checkout.offersAndDiscounts')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedVoucher ? (
                    <div className="p-3 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ticket className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="font-black text-green-900 text-xs">{selectedVoucher.code}</p>
                                <p className="text-[10px] text-green-700 font-bold">
                                    {selectedVoucher.discountType === "PERCENTAGE"
                                        ? `${selectedVoucher.discountValue}%`
                                        : <PriceDisplay currentPrice={selectedVoucher.discountValue} size="sm" showDiscountBadge={false} className="inline-block" />}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedVoucher(null)}
                            className="p-2 hover:bg-green-100 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-green-600" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowVoucherModal(true)}
                        className="p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                        <Ticket className="w-5 h-5" />
                        <span className="text-xs font-bold">
                            {t('checkout.selectVoucherBtn')}
                        </span>
                    </button>
                )}

                {/* Loyalty Points */}
                {userPoints > 0 && (
                    <div className={`p-3 rounded-xl border-2 transition-all ${usePoints ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-white"}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${usePoints ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`font-black text-xs ${usePoints ? "text-amber-900" : "text-slate-500"}`}>
                                        {t('checkout.useLikefoodPoints')}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        {t('checkout.youHavePoints', { points: userPoints })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={togglePoints}
                                className={`w-10 h-6 rounded-full relative transition-colors ${usePoints ? "bg-amber-500" : "bg-slate-200"}`}
                            >
                                <motion.div
                                    animate={{ x: usePoints ? 18 : 2 }}
                                    className="w-4 h-4 bg-white rounded-full absolute top-1"
                                />
                            </button>
                        </div>
                        {usePoints && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="mt-3 pt-3 border-t border-amber-200/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-amber-700">
                                        {t('checkout.convertedValue')}
                                    </span>
                                    <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap text-[10px] font-black text-amber-900">
                                        <span aria-hidden="true">-</span>
                                        <PriceDisplay currentPrice={pointsToUse / 100} size="sm" showDiscountBadge={false} className="whitespace-nowrap" />
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
