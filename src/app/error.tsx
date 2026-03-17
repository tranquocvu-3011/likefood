"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        logger.error('Root error boundary', error, { context: 'root-error', digest: error.digest })
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Đã có lỗi xảy ra!</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Rất tiếc, hệ thống gặp sự cố ngoài ý muốn. Vui lòng thử lại hoặc liên hệ với chúng tôi nếu tình trạng này tiếp diễn.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                    Thử lại ngay
                </button>
                <Link
                    href="/"
                    className="px-8 py-4 bg-slate-100 text-black font-bold rounded-full hover:bg-slate-200 transition-all"
                >
                    Về trang chủ
                </Link>
            </div>
        </div>
    )
}
