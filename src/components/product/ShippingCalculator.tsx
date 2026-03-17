"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { MapPin, Truck } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { DEFAULT_SHIPPING_FEE_USD, FREE_SHIPPING_THRESHOLD_USD } from "@/lib/commerce";
import { useLanguage } from "@/lib/i18n/context";

interface ShippingCalculatorProps {
    productId: number;
    productSlug?: string;
    basePrice: number;
    shippingInfo?: {
        weight?: number | null;
        shippingFee?: number | null;
        freeShipMin?: number | null;
        estimatedDays?: number;
    } | null;
}

export default function ShippingCalculator({
    productId,
    productSlug,
    basePrice,
    shippingInfo,
}: ShippingCalculatorProps) {
    const { t } = useLanguage();
    const quantity = 1;
    const orderTotal = basePrice * quantity;
    const freeShipThreshold = shippingInfo?.freeShipMin || FREE_SHIPPING_THRESHOLD_USD;
    const baseFee = shippingInfo?.shippingFee || DEFAULT_SHIPPING_FEE_USD;
    const isFreeShip = orderTotal >= freeShipThreshold;
    const shippingFee = isFreeShip ? 0 : baseFee;
    const estimatedDays = shippingInfo?.estimatedDays || 3;

    return (
        <div
            className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border-2 border-sky-100 p-6 shadow-lg"
            data-product-id={productId}
            data-product-slug={productSlug}
        >
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <Truck className="w-6 h-6 text-sky-600" />
                {t("shippingCalc.title")}
            </h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-sky-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{t("shippingCalc.shippingFee")}</p>
                            <p className="text-xs text-slate-500">{t("shippingCalc.standardDelivery")} • {estimatedDays} {t("shippingCalc.days")}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        {isFreeShip ? (
                            <span className="text-lg font-black text-green-600">{t("shippingCalc.freeShip")}</span>
                        ) : (
                            <span className="text-lg font-black text-slate-800">{formatPrice(shippingFee)}</span>
                        )}
                    </div>
                </div>

                {!isFreeShip && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <p className="text-sm font-bold text-amber-800 mb-2">
                            {t("shippingCalc.buyMore")} <span className="text-amber-600">{formatPrice(freeShipThreshold - orderTotal)}</span> {t("shippingCalc.toFreeShip")}
                        </p>
                        <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 transition-all duration-500"
                                style={{ width: `${Math.min((orderTotal / freeShipThreshold) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                            {Math.round((orderTotal / freeShipThreshold) * 100)}% {t("shippingCalc.reached")}
                        </p>
                    </div>
                )}

                {shippingInfo?.weight && (
                    <div className="text-sm text-slate-600">
                        <span className="font-bold">{t("shippingCalc.weight")}</span> {shippingInfo.weight} kg
                    </div>
                )}

                <div className="pt-4 border-t-2 border-sky-200">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">{t("shippingCalc.subtotal")} ({quantity} {t("shippingCalc.product")})</span>
                        <span className="font-bold text-slate-800">{formatPrice(orderTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-slate-600">{t("shippingCalc.shippingFeeLabel")}</span>
                        <span className="font-bold text-slate-800">
                            {isFreeShip ? t("shippingCalc.free") : formatPrice(shippingFee)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-sky-200">
                        <span className="text-base font-black text-slate-800">{t("shippingCalc.total")}</span>
                        <span className="text-xl font-black bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                            {formatPrice(orderTotal + shippingFee)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
