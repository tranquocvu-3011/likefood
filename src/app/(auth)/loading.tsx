/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { ChefHat } from "lucide-react";

export default function AuthLoading() {
    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side: Skeleton Branding Wrapper */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-emerald-50 justify-between flex-col p-16 border-r border-emerald-100/50">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-100/60 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-200/50 flex items-center justify-center text-emerald-400 animate-pulse">
                        <ChefHat className="w-7 h-7" />
                    </div>
                </div>

                <div className="relative z-10 max-w-lg space-y-6">
                    <div className="w-32 h-6 bg-emerald-200/50 rounded-full animate-pulse" />
                    <div className="w-3/4 h-16 bg-emerald-200/50 rounded-2xl animate-pulse" />
                    <div className="w-1/2 h-16 bg-emerald-200/50 rounded-2xl animate-pulse" />
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-8 max-w-md">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="w-10 h-10 bg-emerald-200/50 rounded-full animate-pulse" />
                            <div className="w-24 h-4 bg-emerald-200/50 rounded animate-pulse" />
                            <div className="w-32 h-3 bg-emerald-200/30 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Side: Skeleton Form Wrapper */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative z-10">
                <div className="w-full max-w-[420px] space-y-8">
                    {/* Header Skeleton */}
                    <div className="text-center lg:text-left space-y-3 mb-8">
                        <div className="w-2/3 h-10 bg-slate-100 rounded-xl animate-pulse mx-auto lg:mx-0" />
                        <div className="w-1/2 h-5 bg-slate-50 rounded animate-pulse mx-auto lg:mx-0" />
                    </div>

                    {/* Form Skeleton */}
                    <div className="space-y-5">
                        <div className="w-full h-14 bg-slate-50 rounded-2xl animate-pulse" />
                        <div className="w-full h-14 bg-slate-50 rounded-2xl animate-pulse" />
                        <div className="flex justify-between items-center mt-2">
                            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                        </div>

                        <div className="w-full h-14 bg-slate-200 rounded-2xl animate-pulse mt-6" />

                        <div className="py-6 flex justify-center">
                            <div className="w-16 h-3 bg-slate-100 rounded animate-pulse" />
                        </div>

                        <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
                        <div className="w-full h-14 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
