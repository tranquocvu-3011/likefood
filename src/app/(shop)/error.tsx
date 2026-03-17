"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { t } = useLanguage();

    useEffect(() => {
        logger.error("Shop error", error, { 
            context: "shop-error-boundary",
            digest: error.digest 
        });
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900">
                    {t("errorPage.title")}
                </h1>
                <p className="text-slate-600 mb-8 font-medium">
                    {error.message || t("errorPage.defaultMessage")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={reset}
                        className="rounded-full bg-primary text-white font-black uppercase tracking-widest px-8 py-6"
                    >
                        {t("errorPage.retry")}
                    </Button>
                    <Link href="/">
                        <Button
                            variant="outline"
                            className="rounded-full border-slate-200 text-slate-600 font-black uppercase tracking-widest px-8 py-6"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            {t("errorPage.goHome")}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
