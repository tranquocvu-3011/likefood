/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { logger } from "@/lib/logger";
// Whitelist of allowed setting keys — prevents arbitrary key injection into systemsetting
const ALLOWED_SETTING_KEYS = new Set([
    "site_name", "site_description", "site_logo", "site_favicon",
    "contact_email", "contact_phone", "contact_address",
    "shipping_fee", "free_shipping_threshold", "tax_rate",
    "maintenance_mode", "maintenance_message",
    "smtp_host", "smtp_port", "smtp_user",
    "facebook_url", "instagram_url", "tiktok_url", "youtube_url",
    "points_per_order", "points_redemption_rate",
    "checkin_points", "referral_points",
    "meta_title", "meta_description", "meta_keywords",
    "announcement_bar", "announcement_text",
    // Payment settings
    "payment_cod_enabled", "payment_bank_enabled", "payment_momo_enabled",
    "payment_paypal_enabled", "payment_stripe_enabled", "zalo_pay_enabled",
    "bank_name", "bank_account_name", "bank_account_number",
    "bank_qr_image_url", "momo_qr_image_url", "paypal_client_id", "zalo_pay_qr_url",
    // Security
    "security_captcha_enabled",
    "turnstile_site_key",
    "turnstile_secret_key",
    // ===== CONNECTIONS / INTEGRATIONS =====
    // Database (Docker)
    "db_host", "db_port", "db_name", "db_user", "db_password",
    // Redis
    "redis_url", "redis_password",
    // Rate Limiting (Upstash)
    "upstash_redis_rest_url", "upstash_redis_rest_token",
    // AI / OpenAI
    "openai_api_key",
    // Telegram
    "telegram_bot_token", "telegram_chat_id",
    // Stripe
    "stripe_secret_key", "stripe_webhook_secret", "stripe_publishable_key",
    // PayPal
    "paypal_client_id", "paypal_client_secret",
    // MoMo
    "momo_partner_code", "momo_access_key", "momo_secret_key",
    // Sentry
    "sentry_org", "sentry_project", "sentry_auth_token", "sentry_dsn",
    // Cloudflare
    "cloudflare_api_token", "cloudflare_zone_id",
    // Google OAuth
    "google_client_id", "google_client_secret",
    // AWS S3
    "aws_s3_bucket", "aws_access_key_id", "aws_secret_access_key", "aws_region",
    // Analytics
    "ga_tracking_id", "fb_pixel_id", "gtm_id",
    // Health check
    "health_secret",
]);

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await prisma.systemsetting.findMany();
        const settingsMap = settings.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json(settingsMap);
    } catch (error) {
        logger.error("[SETTINGS_GET]", error as Error, { context: "settings-api" });
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validate keys against whitelist — reject unknown setting keys
        const entries = Object.entries(body);
        const unknownKeys = entries.filter(([key]) => !ALLOWED_SETTING_KEYS.has(key)).map(([key]) => key);
        if (unknownKeys.length > 0) {
            return NextResponse.json({ error: `Không được phép cập nhật cài đặt: ${unknownKeys.join(", ")}` }, { status: 400 });
        }

        // Cap value length to prevent large payload abuse
        const promises = entries.map(([key, value]) => {
            const strValue = String(value).slice(0, 5000);
            return prisma.systemsetting.upsert({
                where: { key },
                update: { value: strValue },
                create: { key, value: strValue },
            });
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("[SETTINGS_POST]", error as Error, { context: "settings-api" });
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
