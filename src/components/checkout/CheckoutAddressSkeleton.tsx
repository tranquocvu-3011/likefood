/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

export default function CheckoutAddressSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading addresses">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50"
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
