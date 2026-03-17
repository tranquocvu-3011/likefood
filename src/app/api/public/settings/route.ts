/**
 * LIKEFOOD - Site Config API (Public)
 * Get public site settings — merges from both SiteConfig and systemsetting tables
 * so admin settings changes are immediately visible on the frontend.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { logger } from "@/lib/logger";
/**
 * Map from admin's systemsetting keys → public-facing keys used by
 * Footer, Contact page, Navbar, etc.
 */
const SYSTEM_TO_PUBLIC_MAP: Record<string, string> = {
  contact_email: "SITE_SUPPORT_EMAIL",
  contact_phone: "SITE_SUPPORT_PHONE",
  contact_address: "SITE_ADDRESS",
  site_name: "SITE_NAME",
  site_description: "SITE_DESCRIPTION",
  facebook_url: "FACEBOOK_URL",
  instagram_url: "INSTAGRAM_URL",
  tiktok_url: "TIKTOK_URL",
  youtube_url: "YOUTUBE_URL",
  announcement_bar: "ANNOUNCEMENT_BAR",
  announcement_text: "ANNOUNCEMENT_TEXT",
  shipping_fee: "SHIPPING_FEE",
  free_shipping_threshold: "FREE_SHIPPING_THRESHOLD",
  // Captcha keys (client-visible only)
  security_captcha_enabled: "CAPTCHA_ENABLED",
  turnstile_site_key: "TURNSTILE_SITE_KEY",
};

/** systemsetting keys that are safe to expose publicly */
const PUBLIC_SYSTEM_KEYS = new Set(Object.keys(SYSTEM_TO_PUBLIC_MAP));

// GET - Get merged public site config
export async function GET() {
  try {
    // 1. Read from SiteConfig (legacy / backward compat)
    const siteConfigs = await prisma.siteConfig.findMany({
      where: { isPublic: true },
    });

    const result: Record<string, string> = {};
    for (const cfg of siteConfigs) {
      result[cfg.key] = cfg.value;
    }

    // 2. Read from systemsetting and override with mapped keys
    //    This ensures that any changes made in Admin Settings page
    //    immediately reflect on the frontend.
    const systemSettings = await prisma.systemsetting.findMany({
      where: {
        key: { in: Array.from(PUBLIC_SYSTEM_KEYS) },
      },
    });

    for (const setting of systemSettings) {
      const publicKey = SYSTEM_TO_PUBLIC_MAP[setting.key];
      if (publicKey && setting.value) {
        result[publicKey] = setting.value;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Site config fetch error", error as Error, { context: "public-settings-api" });
    return NextResponse.json({ error: "Lỗi khi lấy cấu hình" }, { status: 500 });
  }
}
