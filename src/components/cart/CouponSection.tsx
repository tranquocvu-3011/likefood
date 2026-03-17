"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { logger } from "@/lib/logger";

interface CouponSectionProps {
    couponCode: string;
    setCouponCode: (code: string) => void;
    couponApplied: boolean;
    setCouponApplied: (applied: boolean) => void;
    couponDiscount: number;
    setCouponDiscount: (discount: number) => void;
    appliedCouponCode: string;
    setAppliedCouponCode: (code: string) => void;
    selectedTotal: number;
}

export function CouponSection({
    couponCode,
    setCouponCode,
    couponApplied,
    setCouponApplied,
    couponDiscount,
    setCouponDiscount,
    appliedCouponCode,
    setAppliedCouponCode,
    selectedTotal,
}: CouponSectionProps) {
    const { t, language } = useLanguage();
    const [couponLoading, setCouponLoading] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error(t('cart.enterCouponCode'));
            return;
        }

        setCouponLoading(true);
        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode.toUpperCase(),
                    orderTotal: selectedTotal
                })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setCouponApplied(true);
                setCouponDiscount(data.coupon.discountAmount);
                setAppliedCouponCode(data.coupon.code);
                toast.success(data.message || t('cart.couponAppliedSuccess'));
            } else {
                toast.error(data.error || t('cart.invalidCoupon'));
                setCouponApplied(false);
                setCouponDiscount(0);
            }
        } catch (error) {
            logger.error('Coupon error', error as Error, { context: 'cart-page' });
            toast.error(t('cart.errorApplyingCoupon'));
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponApplied(false);
        setCouponDiscount(0);
        setCouponCode('');
        setAppliedCouponCode('');
        toast.success(t('cart.couponRemoved'));
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-black text-lg mb-4">{t("cart.couponCode")}</h3>

            {couponApplied ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">{appliedCouponCode}</span>
                        <span className="text-green-600 text-sm">
                            -{formatPrice(couponDiscount)}
                        </span>
                    </div>
                    <button
                        onClick={handleRemoveCoupon}
                        className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                        {t('cart.remove')}
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder={t('cart.enterCouponCode')}
                        className="flex-1 h-14 px-5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm"
                    />
                    <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide"
                    >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("cart.apply")}
                    </Button>
                </div>
            )}
        </div>
    );
}
