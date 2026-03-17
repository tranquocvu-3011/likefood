"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState } from "react";
import { X, Ruler, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/context";

interface SizeOption {
    size: string;
    chest: string;
    length: string;
    sleeve: string;
    fitKey: "fitRegular" | "fitLoose";
}

interface SizeGuideProps {
    isOpen: boolean;
    onClose: () => void;
    productName?: string;
    category?: string;
}

const sizeCharts: Record<string, SizeOption[]> = {
    clothing: [
        { size: "S", chest: "86-91 cm", length: "66 cm", sleeve: "60 cm", fitKey: "fitRegular" },
        { size: "M", chest: "91-96 cm", length: "69 cm", sleeve: "62 cm", fitKey: "fitRegular" },
        { size: "L", chest: "96-101 cm", length: "72 cm", sleeve: "64 cm", fitKey: "fitLoose" },
        { size: "XL", chest: "101-106 cm", length: "74 cm", sleeve: "66 cm", fitKey: "fitLoose" },
        { size: "2XL", chest: "106-111 cm", length: "76 cm", sleeve: "68 cm", fitKey: "fitLoose" },
    ],
    shoes: [
        { size: "38", chest: "24 cm", length: "-", sleeve: "-", fitKey: "fitRegular" },
        { size: "39", chest: "24.5 cm", length: "-", sleeve: "-", fitKey: "fitRegular" },
        { size: "40", chest: "25 cm", length: "-", sleeve: "-", fitKey: "fitRegular" },
        { size: "41", chest: "26 cm", length: "-", sleeve: "-", fitKey: "fitLoose" },
        { size: "42", chest: "27 cm", length: "-", sleeve: "-", fitKey: "fitLoose" },
        { size: "43", chest: "28 cm", length: "-", sleeve: "-", fitKey: "fitLoose" },
    ],
    default: [
        { size: "One Size", chest: "Fits all", length: "Standard", sleeve: "-", fitKey: "fitRegular" },
    ],
};

export function SizeGuide({ isOpen, onClose, productName, category = "default" }: SizeGuideProps) {
    const { t } = useLanguage();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [measurementUnit, setMeasurementUnit] = useState<"cm" | "inch">("cm");

    const sizeData = sizeCharts[category] || sizeCharts.default;

    const convertToInch = (cm: string) => {
        if (cm === "-" || !cm) return "-";
        const match = cm.match(/(\d+)/);
        if (match) {
            const inches = Math.round(parseInt(match[1]) / 2.54);
            return `${inches} inches`;
        }
        return cm;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-3xl shadow-2xl m-4 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Ruler className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {t("sizeGuide.title")}
                            </h2>
                            {productName && (
                                <p className="text-sm text-slate-500">{productName}</p>
                            )}
                        </div>
                    </div>

                    {/* Unit Toggle */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-slate-100 rounded-full p-1 flex">
                            <button
                                onClick={() => setMeasurementUnit("cm")}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                    measurementUnit === "cm" 
                                        ? "bg-white shadow-sm text-slate-900" 
                                        : "text-slate-500"
                                }`}
                            >
                                {t("sizeGuide.centimeter")}
                            </button>
                            <button
                                onClick={() => setMeasurementUnit("inch")}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                    measurementUnit === "inch" 
                                        ? "bg-white shadow-sm text-slate-900" 
                                        : "text-slate-500"
                                }`}
                            >
                                {t("sizeGuide.inch")}
                            </button>
                        </div>
                    </div>

                    {/* Size Chart */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                        Size
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                        {category === "shoes" ? t("sizeGuide.footLength") : t("sizeGuide.chest")}
                                    </th>
                                    {category !== "shoes" && (
                                        <>
                                            <th className="text-left py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                                {t("sizeGuide.length")}
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                                {t("sizeGuide.sleeve")}
                                            </th>
                                        </>
                                    )}
                                    <th className="text-left py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                                        {t("sizeGuide.fit")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sizeData.map((row) => (
                                    <tr 
                                        key={row.size}
                                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                                            selectedSize === row.size ? "bg-primary/5" : "hover:bg-slate-50"
                                        }`}
                                        onClick={() => setSelectedSize(row.size)}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900">{row.size}</span>
                                                {selectedSize === row.size && (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600">
                                            {measurementUnit === "inch" ? convertToInch(row.chest) : row.chest}
                                        </td>
                                        {category !== "shoes" && (
                                            <>
                                                <td className="py-4 px-4 text-sm text-slate-600">
                                                    {measurementUnit === "inch" ? convertToInch(row.length) : row.length}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600">
                                                    {measurementUnit === "inch" ? convertToInch(row.sleeve) : row.sleeve}
                                                </td>
                                            </>
                                        )}
                                        <td className="py-4 px-4">
                                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                {t(`sizeGuide.${row.fitKey}`)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tips */}
                    <Card className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/50">
                        <CardContent className="p-4">
                            <h4 className="font-bold text-amber-800 text-sm mb-2">{t("sizeGuide.tipsTitle")}</h4>
                            <ul className="text-xs text-amber-700 space-y-1">
                                <li>• {t("sizeGuide.tip1")}</li>
                                <li>• {t("sizeGuide.tip2")}</li>
                                <li>• {t("sizeGuide.tip3")}</li>
                                <li>• {t("sizeGuide.tip4")}</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Selected Size Action */}
                    {selectedSize && (
                        <div className="mt-6 flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                            <div>
                                <p className="text-sm text-slate-500">{t("sizeGuide.youSelected")}</p>
                                <p className="font-black text-primary text-lg">Size {selectedSize}</p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="rounded-full bg-primary hover:bg-primary/90 font-bold"
                            >
                                {t("sizeGuide.apply")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Size Guide Button Component
interface SizeGuideButtonProps {
    onClick: () => void;
    className?: string;
}

export function SizeGuideButton({ onClick, className = "" }: SizeGuideButtonProps) {
    const { t } = useLanguage();
    return (
        <button
            onClick={onClick}
            className={`text-sm text-primary hover:underline font-medium flex items-center gap-1 ${className}`}
        >
            <Ruler className="w-4 h-4" />
            {t("sizeGuide.buttonText")}
        </button>
    );
}
