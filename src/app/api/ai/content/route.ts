/**
 * LIKEFOOD — AI Content Generation API
 * POST /api/ai/content — unified content generation
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import {
  generateProductContent,
  generateProductDescription,
  generateSEOContent,
  generateMarketingCopy,
} from "@/lib/ai/content-generator";
import { generateMarketingEmail } from "@/lib/ai/admin-service";
import { callGPT } from "@/lib/ai/ai-provider";

export async function POST(req: NextRequest) {
  // Admin only
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getRateLimitIdentifier(req);
  const rl = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 15 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, productName, category, features, brand, tags, tone, platform, emailType, theme, sourceContent, targetLanguage } = body ?? {};

    switch (action) {
      case "description": {
        if (!productName || !category) {
          return NextResponse.json({ error: "productName và category bắt buộc" }, { status: 400 });
        }
        const content = await generateProductContent({ name: productName, category, features, tone: tone || "vi" });
        return NextResponse.json({ content });
      }

      case "seo": {
        if (!productName || !category) {
          return NextResponse.json({ error: "productName và category bắt buộc" }, { status: 400 });
        }
        const seo = await generateSEOContent({ name: productName, category, brand, tags });
        return NextResponse.json({ seo });
      }

      case "marketing": {
        if (!productName || !category) {
          return NextResponse.json({ error: "productName và category bắt buộc" }, { status: 400 });
        }
        const copy = await generateMarketingCopy({ name: productName, category, features, brand, tags });
        return NextResponse.json({ copy });
      }

      case "email": {
        const type = emailType || "welcome";
        const email = await generateMarketingEmail(type, body?.context);
        return NextResponse.json({ email });
      }

      case "banner": {
        const bannerPrompt = [
          "You are writing content for a LIKEFOOD promotional banner.",
          theme ? `Theme: ${theme}` : "Theme: general promotion",
          productName ? `Featured product: ${productName}` : "No specific product",
          "Return exactly 3 lines:",
          "HEADLINE: bold, attention-grabbing headline (max 8 words)",
          "SUBTEXT: supporting text (max 15 words)",
          "CTA: call to action button text (max 4 words)",
          tone === "en" ? "Write in English." : "Write in Vietnamese.",
        ].join("\n");

        const result = await callGPT(bannerPrompt, { task: "content-banner", temperature: 0.7, maxTokens: 200 });
        const text = result?.text ?? "";
        const headline = text.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim() ?? "Đặc sản Việt Nam chính hãng";
        const subtext = text.match(/SUBTEXT:\s*(.+)/i)?.[1]?.trim() ?? "Giao hàng toàn nước Mỹ, đóng gói cẩn thận";
        const cta = text.match(/CTA:\s*(.+)/i)?.[1]?.trim() ?? "Mua ngay";

        return NextResponse.json({ banner: { headline, subtext, cta } });
      }

      case "caption": {
        const captionPrompt = [
          "You are writing a social media caption for LIKEFOOD.",
          productName ? `Product: ${productName}` : "General store promotion",
          category ? `Category: ${category}` : "",
          platform ? `Platform: ${platform}` : "Platform: general",
          "Return a single caption with emojis, 2-4 sentences max.",
          "Include 3-5 relevant hashtags at the end.",
          tone === "en" ? "Write in English." : "Write in Vietnamese.",
        ].filter(Boolean).join("\n");

        const captionResult = await callGPT(captionPrompt, { task: "content-caption", temperature: 0.8, maxTokens: 300 });
        return NextResponse.json({ caption: captionResult?.text?.trim() ?? "" });
      }

      case "bilingual": {
        if (!sourceContent) {
          return NextResponse.json({ error: "sourceContent bắt buộc" }, { status: 400 });
        }
        const direction = targetLanguage === "en" ? "Vietnamese to English" : "English to Vietnamese";
        const bilingualPrompt = [
          `Translate the following ecommerce content from ${direction}.`,
          "Keep the tone professional and warm for a food marketplace.",
          "Preserve formatting, emojis, and line breaks.",
          `Content:\n${sourceContent}`,
        ].join("\n\n");

        const translated = await callGPT(bilingualPrompt, { task: "content-generation", temperature: 0.3, maxTokens: 1000 });
        return NextResponse.json({ translation: translated?.text?.trim() ?? "" });
      }

      default:
        return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 });
    }
  } catch (error) {
    logger.error("[AI_CONTENT] Error", error as Error, { context: "ai-content-api" });
    return NextResponse.json({ error: "Không thể tạo nội dung" }, { status: 500 });
  }
}
