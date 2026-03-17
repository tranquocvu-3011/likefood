import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const nextConfig: NextConfig = {
    // TS build errors are now properly resolved — type checking enabled
    // typescript: { ignoreBuildErrors: true }, // Removed after fixing all TS errors
    // ═══════════════════════════════════════════════════
    // 🚀 PERFORMANCE OPTIMIZATIONS
    // ═══════════════════════════════════════════════════

    // Tree-shake large icon/utility libraries — chỉ import đúng icon cần dùng
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "framer-motion",
            "date-fns",
            "zod",
            "react-markdown",
            "remark-gfm",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
        ],
    },

    // Không bundle các package server-only vào client
    serverExternalPackages: [
        "@prisma/client",
        "prisma",
        "bcryptjs",
        "nodemailer",
        "stripe",
    ],

    // Turbopack config (required by Next.js 16)
    turbopack: {},

    // ═══════════════════════════════════════════════════
    // 🖼️ IMAGE OPTIMIZATION
    // ═══════════════════════════════════════════════════
    images: {
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
        // SEC-06: Restrict remote patterns to known domains only
        remotePatterns: [
            // Google profile photos for OAuth
            {
                protocol: "https",
                hostname: "**.googleusercontent.com",
            },
            // Google Drive (if used for images)
            {
                protocol: "https",
                hostname: "drive.google.com",
            },
            // Flag CDN for language switcher
            {
                protocol: "https",
                hostname: "flagcdn.com",
            },
            // VPS domain for dual environment testing
            {
                protocol: "https",
                hostname: "likefood.vudev.io.vn",
            },
            // Add your image CDN here when configured (e.g., Cloudinary, AWS S3)
            // Example for Cloudinary:
            // {
            //     protocol: "https",
            //     hostname: "**.cloudinary.com",
            // },
            // Example for AWS S3:
            // {
            //     protocol: "https",
            //     hostname: "**.s3.amazonaws.com",
            // },
        ],
        // SEC-06: Allow local images from public folder subpaths
        localPatterns: [
            { pathname: "/uploads/**" },
            { pathname: "/images/**" },
            { pathname: "/categories/**" },
            { pathname: "/donggoi/**" },
            { pathname: "/sanpham/**" },
            { pathname: "/loadtrang.png" },
            { pathname: "/*.png" },
            { pathname: "/*.jpg" },
            { pathname: "/*.jpeg" },
            { pathname: "/*.webp" },
            { pathname: "/*.svg" },
            { pathname: "/*.avif" },
        ],
    },

    // ═══════════════════════════════════════════════════
    // ⚡ COMPILER & CACHING
    // ═══════════════════════════════════════════════════

    // Bật SWC compiler optimizations
    compiler: {
        // Loại bỏ console.log trong production
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },

    // Powered by header không cần thiết
    poweredByHeader: false,

    // Cho phép React Strict Mode (phát hiện lỗi sớm)
    reactStrictMode: true,

    // Output standalone cho Docker deployment (tạo ra server.js + minimal node_modules)
    output: "standalone",

    // ═══════════════════════════════════════════════════
    // 🛡 SECURITY HEADERS
    // ═══════════════════════════════════════════════════
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                    },
                    // SEC-002 TODO: Fix CSP to remove unsafe-inline and unsafe-eval
                    // Currently required for:
                    // - unsafe-inline: Next.js dynamic styles, Turnstile widget
                    // - unsafe-eval: Stripe.js dynamic code loading
                    // Plan: Migrate to nonce-based CSP after refactoring inline scripts
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https: http:",
                            "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com https://www.google-analytics.com https://api.openai.com https://*.upstash.io https://*.sentry.io",
                            "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "upgrade-insecure-requests",
                        ].join("; "),
                    },
                ],
            },
            {
                source: "/_next/static/(.*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/_next/image(.*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/images/(.*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            }
        ];
    },
};

const sentryConfig = {
  // Upload source maps to Sentry when SENTRY_AUTH_TOKEN is set
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Automatically tree-shake Sentry logger in production
  hideSourceMaps: true,
  // Skip sourcemap upload when no auth token (local builds)
  sourceMapsUploadOptions: {
    enabled: !!process.env.SENTRY_AUTH_TOKEN,
  },
};

// Skip Sentry instrumentation in dev for performance (saves ~500MB RAM + faster HMR)
const isDev = process.env.NODE_ENV !== "production";
export default isDev
  ? withBundleAnalyzer(nextConfig)
  : withSentryConfig(withBundleAnalyzer(nextConfig), sentryConfig);
