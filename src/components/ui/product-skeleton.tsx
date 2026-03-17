/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Skeleton component for Product Card
 */
export function ProductCardSkeleton() {
    return (
        <Card className="border-none shadow-sm overflow-hidden rounded-xl">
            <CardContent className="p-0">
                <Skeleton className="w-full aspect-[4/3]" />
                <div className="p-2.5 space-y-1.5">
                    <Skeleton className="h-2.5 w-14" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex items-center justify-between pt-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton component for Product Grid
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton component for Product Detail Page
 */
export function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 pt-6 pb-20">
            <div className="w-full mx-auto px-6 sm:px-10 lg:px-[8%]">
                <div className="mb-8">
                    <Skeleton className="h-4 w-64 mb-4" />
                    <Skeleton className="h-4 w-32" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                    {/* Image Gallery Skeleton */}
                    <div className="max-w-[500px] mx-auto w-full lg:mx-0">
                        <Skeleton className="w-full aspect-square rounded-[3rem]" />
                    </div>

                    {/* Product Info Skeleton */}
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-32 rounded-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-10 w-40" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton component for Cart Item
 */
export function CartItemSkeleton() {
    return (
        <div className="flex gap-8 pb-10 border-b border-slate-200">
            <Skeleton className="w-28 h-28 md:w-40 md:h-40 rounded-[2rem] flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                </div>
                <div className="flex items-center justify-between mt-6">
                    <Skeleton className="h-10 w-32 rounded-2xl" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton component for Cart Page
 */
export function CartPageSkeleton() {
    return (
        <div className="w-full mx-auto px-6 sm:px-10 lg:px-[8%] py-20 bg-slate-50 min-h-screen">
            <Skeleton className="h-4 w-48 mb-12" />
            <Skeleton className="h-12 w-64 mb-16" />

            <div className="lg:grid lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-8">
                    <div className="space-y-10">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <CartItemSkeleton key={i} />
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 mt-16 lg:mt-0">
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
                        <Skeleton className="h-8 w-48 mb-8" />
                        <div className="space-y-6 mb-10">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                        <Skeleton className="h-20 w-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
