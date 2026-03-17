"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Admin panel error", error, {
            context: "admin-error-boundary",
            digest: error.digest,
        });
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-zinc-100">Đã xảy ra lỗi</h2>
                <p className="text-zinc-500 mb-6 text-sm">
                    {error.message || "Có vấn đề xảy ra khi tải trang admin. Vui lòng thử lại."}
                    {error.digest && (
                        <span className="block mt-1 text-xs text-slate-400">
                            Mã lỗi: {error.digest}
                        </span>
                    )}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} variant="default" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Thử lại
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/dashboard">
                            <Home className="w-4 h-4 mr-2" />
                            Bảng điều khiển
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
