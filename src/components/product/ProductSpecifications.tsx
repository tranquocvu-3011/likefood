"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

interface Specification {
    id: number;
    key: string;
    value: string;
    order: number;
}

interface ProductSpecificationsProps {
    slug: string;
}

export default function ProductSpecifications({ slug }: ProductSpecificationsProps) {
    const { t } = useLanguage();
    const [specifications, setSpecifications] = useState<Specification[]>([]);

    useEffect(() => {
        if (!slug) return;
        fetch(`/api/products/${slug}/specifications`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setSpecifications(Array.isArray(data) ? data : []))
            .catch(() => setSpecifications([]));
    }, [slug]);

    if (!specifications || specifications.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-lg">
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                {t("productSpecs.title")}
            </h3>
            <div className="space-y-3">
                {specifications.map((spec, index) => (
                    <div
                        key={spec.id}
                        className={`flex py-3 ${index !== specifications.length - 1 ? 'border-b border-slate-100' : ''
                            }`}
                    >
                        <div className="w-1/3 flex-shrink-0">
                            <span className="text-sm font-bold text-slate-600">
                                {spec.key}
                            </span>
                        </div>
                        <div className="w-2/3">
                            <span className="text-sm text-slate-800 font-medium">
                                {spec.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
