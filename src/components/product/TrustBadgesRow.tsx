"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * TrustBadgesRow – 4 trust badges: Fast Delivery, Quality, Easy Return, Secure Payment
 * Tách từ inline code trong Product Detail page.
 */

import { Truck, Shield, RefreshCw, CreditCard } from "lucide-react";

interface TrustBadgesRowProps {
    t: (key: string) => string;
}

const BADGES = [
    {
        icon: Truck,
        labelKey: "shop.fastDelivery",
        descKey: "shop.deliveryDays",
        from: "from-orange-50",
        to: "to-amber-50",
        border: "border-orange-100",
        iconFrom: "from-orange-400",
        iconTo: "to-amber-500",
        shadow: "shadow-orange-500/20",
    },
    {
        icon: Shield,
        labelKey: "shop.qualityGuarantee",
        descKey: "shop.authentic",
        from: "from-emerald-50",
        to: "to-teal-50",
        border: "border-emerald-100",
        iconFrom: "from-emerald-400",
        iconTo: "to-teal-500",
        shadow: "shadow-emerald-500/20",
    },
    {
        icon: RefreshCw,
        labelKey: "shop.easyReturn",
        descKey: "shop.returnDays",
        from: "from-blue-50",
        to: "to-sky-50",
        border: "border-blue-100",
        iconFrom: "from-blue-400",
        iconTo: "to-sky-500",
        shadow: "shadow-blue-500/20",
    },
    {
        icon: CreditCard,
        labelKey: "shop.securePayment",
        descKey: "shop.multiplePayments",
        from: "from-violet-50",
        to: "to-purple-50",
        border: "border-violet-100",
        iconFrom: "from-violet-400",
        iconTo: "to-purple-500",
        shadow: "shadow-violet-500/20",
    },
];

export default function TrustBadgesRow({ t }: TrustBadgesRowProps) {
    return (
        <div className="grid grid-cols-2 gap-4 pt-6">
            {BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                    <div
                        key={badge.labelKey}
                        className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${badge.from} ${badge.to} border ${badge.border}`}
                    >
                        <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.iconFrom} ${badge.iconTo} flex items-center justify-center shadow-lg ${badge.shadow}`}
                        >
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{t(badge.labelKey)}</p>
                            <p className="text-xs text-slate-500">{t(badge.descKey)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
