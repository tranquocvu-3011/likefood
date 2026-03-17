/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { cookies } from "next/headers";

export default async function Loading() {
    const cookieStore = await cookies();
    const lang = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const text = lang === "en" ? "Loading..." : "Đang tải...";

    return (
        <div className="min-h-screen flex items-center justify-center bg-white/95 backdrop-blur-md z-50 fixed inset-0">
            <div className="text-center flex flex-col items-center justify-center">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-48 h-48 md:w-64 md:h-64 object-contain"
                >
                    <source src="/loadtrang.mp4" type="video/mp4" />
                </video>
                <p className="text-slate-600 font-medium tracking-widest uppercase text-sm mt-4 animate-pulse">
                    {text}
                </p>
            </div>
        </div>
    );
}
