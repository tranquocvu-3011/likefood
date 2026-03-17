"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface PriceAlert {
    productId: number;
    productSlug?: string;
    productName: string;
    productImage?: string;
    originalPrice: number;
    currentPrice: number;
    dropPercent: number;
}

interface PriceAlertListProps {
    priceAlerts: PriceAlert[];
}

export function PriceAlertList({ priceAlerts }: PriceAlertListProps) {
    const { language } = useLanguage();

    if (priceAlerts.length === 0) {
        return null;
    }

    return (
        <Card className="border-none shadow-lg">
            <CardContent className="p-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                    {language === "vi" ? "Giá giảm" : "Price Drops"}
                </h2>
                <div className="space-y-4">
                    {priceAlerts.map((alert) => (
                        <Link
                            key={alert.productId}
                            href={`/products/${alert.productSlug || alert.productId}`}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 border-2 border-green-100 hover:border-green-200 transition-all"
                        >
                            {alert.productImage && (
                                <Image
                                    src={alert.productImage}
                                    alt={alert.productName}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-2xl object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <p className="font-black text-slate-900 mb-1">{alert.productName}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400 line-through">
                                        ${alert.originalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-lg font-black text-green-600">
                                        ${alert.currentPrice.toFixed(2)}
                                    </span>
                                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-black rounded-full">
                                        -{alert.dropPercent}%
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
