"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { Truck } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { DEFAULT_SHIPPING_FEE_USD, FREE_SHIPPING_THRESHOLD_USD } from "@/lib/commerce";
import PriceDisplay from "@/components/ui/price-display";

interface CartSummaryProps {
    selectedTotal: number;
    couponDiscount: number;
    selectedCount: number;
    canCheckout: boolean;
    hasOutOfStockItems: boolean;
}

export function CartSummary({
    selectedTotal,
    couponDiscount,
    selectedCount,
    canCheckout,
    hasOutOfStockItems,
}: CartSummaryProps) {
    const { t, language } = useLanguage();

    const FREESHIP_THRESHOLD = FREE_SHIPPING_THRESHOLD_USD;
    const progress = Math.min((selectedTotal / FREESHIP_THRESHOLD) * 100, 100);
    const remaining = Math.max(FREESHIP_THRESHOLD - selectedTotal, 0);

    const estimatedDelivery = useMemo(() => {
        const now = new Date();
        const min = new Date(now);
        min.setDate(min.getDate() + 3);
        const max = new Date(now);
        max.setDate(max.getDate() + 5);
        const locale = language === "vi" ? "vi-VN" : "en-US";
        return {
            min: min.toLocaleDateString(locale, { day: "numeric", month: "long" }),
            max: max.toLocaleDateString(locale, { day: "numeric", month: "long" }),
        };
    }, [language]);

    const subtotal = selectedTotal;
    const shipping = selectedTotal >= FREESHIP_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE_USD;
    const discount = couponDiscount;
    const total = Math.max(subtotal + shipping - discount, 0);

    return (
        <div className="lg:col-span-4 space-y-6">
            {/* Freeship Progress Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <Truck className={`w-5 h-5 ${progress >= 100 ? 'text-green-500' : 'text-slate-400'}`} />
                    {progress >= 100 ? (
                        <p className="text-sm font-bold text-green-600">
                            🎉 {t('cart.qualifyForFreeShip')} <span className="font-black uppercase">{t("cart.freeShipping")}!</span>
                        </p>
                    ) : (
                        <p className="text-sm font-bold text-slate-600">
                            {t('cart.addMoreFor').replace('{amount}', formatPrice(remaining))} <span className="font-black text-green-600 uppercase">{t("cart.freeShipping")}</span>
                        </p>
                    )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${progress >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-orange-400 to-primary'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h2 className="font-black text-xl mb-6">{t("cart.orderSummary")}</h2>

                <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">{t('cart.subtotal').replace('{count}', String(selectedCount))}</span>
                        <PriceDisplay currentPrice={subtotal} size="md" showDiscountBadge={false} />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">{t("cart.shipping")}</span>
                        <span className="font-bold">
                            {shipping === 0 ? (
                                <span className="text-green-600">{t("cart.free")}</span>
                            ) : (
                                <PriceDisplay currentPrice={shipping} size="md" showDiscountBadge={false} />
                            )}
                        </span>
                    </div>

                    {discount > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">{t("cart.discount")}</span>
                            <span className="font-bold text-green-600">-{formatPrice(discount)}</span>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                        <span className="font-black text-lg">{t("cart.total")}</span>
                        <PriceDisplay currentPrice={total} size="md" />
                    </div>
                </div>

                {/* Estimated Delivery */}
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">{t('cart.estimatedDelivery')}</p>
                    <p className="font-bold text-slate-700">{estimatedDelivery.min} - {estimatedDelivery.max}</p>
                </div>

                {/* Checkout Button */}
                <Link href="/checkout" className="block mt-6">
                    <Button
                        disabled={!canCheckout}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20"
                    >
                        {hasOutOfStockItems
                            ? t('cart.outOfStockItems')
                            : t("cart.checkout")
                        }
                    </Button>
                </Link>
            </div>
        </div>
    );
}
