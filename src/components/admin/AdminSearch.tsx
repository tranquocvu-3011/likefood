"use client";

/**
 * LIKEFOOD - Premium Admin Search & Filter
 * Dark Gray Enterprise Dashboard Style - 2026 Edition
 */

import { ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface AdminFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function AdminFilterBar({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Search...",
  children,
}: AdminFilterBarProps) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 w-full rounded-md border border-zinc-600 bg-zinc-900/80 pl-9 pr-8 text-sm font-medium text-zinc-100 outline-none transition focus:border-teal-500 focus:bg-zinc-900 placeholder:text-zinc-500"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {children ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-700/50 bg-zinc-900/60 px-3 py-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <SlidersHorizontal className="h-3 w-3" />
              Filters
            </div>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
