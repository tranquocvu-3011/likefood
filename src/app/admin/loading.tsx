/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Loader2 } from "lucide-react";

export default function AdminLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-zinc-500">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                <p className="text-sm font-medium">Đang tải...</p>
            </div>
        </div>
    );
}
