"use client";

/**
 * LIKEFOOD - Premium Admin Pagination
 * Dark Gray Enterprise Dashboard Style - 2026 Edition
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  total: number;
  itemLabel?: string;
}

export function AdminPagination({
  page,
  setPage,
  pageSize,
  total,
  itemLabel = "items",
}: AdminPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => windowStart + index).filter(
    (value) => value <= totalPages
  );

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-zinc-500">
        Showing <span className="font-semibold text-zinc-300">{start}</span> to <span className="font-semibold text-zinc-300">{end}</span> of <span className="font-semibold text-zinc-300">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPage(value)}
            className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold transition ${
              value === page
                ? "bg-teal-600 text-white"
                : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            {value}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
