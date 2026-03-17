"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

// global-error.tsx catches errors in the root layout itself.
// It must include its own <html> and <body> tags.
// Cannot use useLanguage hook here since root layout (and LanguageProvider) may have failed.
// Using cookie-based locale detection as fallback.

import Link from "next/link";

const translations = {
    vi: {
        title: "Đã có lỗi nghiêm trọng!",
        description: "Hệ thống gặp sự cố không thể khôi phục. Vui lòng tải lại trang hoặc quay về trang chủ.",
        reload: "Tải lại trang",
        goHome: "Về trang chủ",
    },
    en: {
        title: "A critical error occurred!",
        description: "The system encountered an unrecoverable error. Please reload the page or go back to the homepage.",
        reload: "Reload page",
        goHome: "Go to homepage",
    },
};

function getLocale(): "vi" | "en" {
    if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)language=([^;]*)/);
        if (match && match[1] === "en") return "en";
    }
    return "vi";
}

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const locale = getLocale();
    const t = translations[locale];

    return (
        <html lang={locale}>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)',
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: '#fee2e2', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', marginBottom: 24, fontSize: 28,
                    }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px', color: '#0f172a' }}>
                        {t.title}
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
                        {t.description}
                    </p>
                    {error.digest && (
                        <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '16px', fontFamily: 'monospace' }}>
                            Error ID: {error.digest}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '12px 32px', background: '#16a34a', color: 'white',
                                fontWeight: 700, border: 'none', borderRadius: '9999px',
                                cursor: 'pointer', fontSize: '14px',
                            }}
                        >
                            {t.reload}
                        </button>
                        <Link
                            href="/"
                            style={{
                                padding: '12px 32px', background: '#f1f5f9', color: '#334155',
                                fontWeight: 700, border: 'none', borderRadius: '9999px',
                                textDecoration: 'none', fontSize: '14px',
                                display: 'inline-flex', alignItems: 'center',
                            }}
                        >
                            {t.goHome}
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    )
}
