"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { callGPT, callGPTJSON } from "@/lib/ai/ai-provider";

interface GenerateDescriptionInput {
  name: string;
  category: string;
  features?: string[];
  tone?: "vi" | "en";
  type?: "description" | "seo" | "marketing";
}

interface GenerateProductContentInput {
  name: string;
  category: string;
  features?: string[];
  brand?: string;
  tags?: string[];
}

export interface GeneratedProductContent {
  description: string;
  benefits: string[];
  origin: string;
  howToUse: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

function buildFallbackProductContent(input: { name: string; category: string }): GeneratedProductContent {
  return {
    description: `${input.name} la mot san pham dac trung trong nhom ${input.category}, phu hop cho bua an gia dinh, qua bieu, hoac nhu cau thuong thuc hang ngay. Noi dung nay can duoc bo sung bang chi tiet thuc te tu nha cung cap, xuat xu, va trai nghiem huong vi cu the.`,
    benefits: [
      "Phu hop cho nguoi tim mon dac san Viet de thuong thuc tai nha",
      "De bo sung vao gio hang qua bieu hoac pantry hang ngay",
      "Can xac nhan them thong tin xuat xu va cach dung de tang do tin cay",
      "Nen bo sung diem khac biet so voi cac san pham cung nhom",
      "Co the ket hop voi noi dung recipe, gifting, hoac pantry guidance",
    ],
    origin: "Vietnam",
    howToUse: "Use directly or combine with the most common serving method for this category. Add product-specific serving notes after supplier verification.",
    seoTitle: `${input.name} | Vietnamese Specialty Food | LIKEFOOD`,
    seoDescription: `Shop ${input.name} from LIKEFOOD with clear pricing, shipping details, and a focused Vietnamese specialty food experience.`,
    tags: [input.name.toLowerCase(), input.category.toLowerCase(), "vietnamese specialty", "likefood", "online grocery"],
  };
}

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlock?.[1]) return codeBlock[1].trim();

  const jsonObject = text.match(/\{[\s\S]*\}/);
  return jsonObject?.[0]?.trim() || text.trim();
}

async function askAI(prompt: string, fallback: string): Promise<string> {
  const result = await callGPT(prompt, {
    task: 'content-generation',
    temperature: 0.6,
    maxTokens: 1500,
    frequencyPenalty: 0.3,
    presencePenalty: 0.2,
  });
  return result?.text?.trim() || fallback;
}

function buildDescriptionPrompt(input: GenerateDescriptionInput): string {
  const languageInstruction = input.tone === "en"
    ? "Write in English. Keep the tone premium, warm, and clear."
    : "Write in Vietnamese. Keep the tone premium, warm, and clear.";

  const typeInstruction = input.type === "seo"
    ? "Return SEO-focused copy: title suggestion, meta-style summary, and keyword-rich description."
    : input.type === "marketing"
      ? "Return persuasive marketing copy with a clear hook, benefit framing, and CTA language."
      : "Return a detailed product description that helps the admin publish a stronger product page.";

  return [
    "You write ecommerce product content for LIKEFOOD.",
    languageInstruction,
    typeInstruction,
    `Product name: ${input.name}`,
    `Category: ${input.category}`,
    input.features?.length ? `Known product notes:\n- ${input.features.join("\n- ")}` : "Known product notes: none provided.",
    "Do not invent certifications, health claims, origin claims, or discounts.",
    "If facts are missing, use confident but generic ecommerce language instead of making up details.",
  ].join("\n\n");
}

export async function generateProductContent(input: GenerateDescriptionInput): Promise<GeneratedProductContent> {
  const fallback = buildFallbackProductContent(input);
  const prompt = [
    "You are preparing product-launch content for LIKEFOOD.",
    input.tone === "en"
      ? "Write all copy in English."
      : "Write all copy in Vietnamese.",
    "Use grounded web research if available, but do not invent unverifiable facts.",
    `Product name: ${input.name}`,
    `Category: ${input.category}`,
    input.features?.length ? `Admin notes:\n- ${input.features.join("\n- ")}` : "Admin notes: none provided.",
    "Return valid JSON only with this shape:",
    JSON.stringify({
      description: "2 to 3 short paragraphs",
      benefits: ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
      origin: "origin or source region if confidently known",
      howToUse: "one practical usage paragraph",
      seoTitle: "seo title",
      seoDescription: "seo description",
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    }, null, 2),
  ].join("\n\n");

  const raw = await askAI(prompt, JSON.stringify(fallback));

  try {
    const parsed = JSON.parse(extractJson(raw)) as Partial<GeneratedProductContent>;
    return {
      description: typeof parsed.description === "string" ? parsed.description : fallback.description,
      benefits: Array.isArray(parsed.benefits) && parsed.benefits.length > 0 ? parsed.benefits.slice(0, 6) : fallback.benefits,
      origin: typeof parsed.origin === "string" ? parsed.origin : fallback.origin,
      howToUse: typeof parsed.howToUse === "string" ? parsed.howToUse : fallback.howToUse,
      seoTitle: typeof parsed.seoTitle === "string" ? parsed.seoTitle : fallback.seoTitle,
      seoDescription: typeof parsed.seoDescription === "string" ? parsed.seoDescription : fallback.seoDescription,
      tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags.slice(0, 8) : fallback.tags,
    };
  } catch (error) {
    console.error("[AI_GENERATE_PRODUCT_CONTENT] Parse error:", error);
    return fallback;
  }
}

export async function generateProductDescription(input: GenerateDescriptionInput): Promise<string> {
  const fallback = buildFallbackProductContent(input).description;
  const prompt = buildDescriptionPrompt(input);
  return askAI(prompt, fallback);
}

export async function generateSEOContent(
  input: GenerateProductContentInput
): Promise<{ title: string; description: string; keywords: string[] }> {
  const fallback = {
    title: `${input.name} | Vietnamese Specialty Food | LIKEFOOD`,
    description: `Shop ${input.name} from LIKEFOOD with clear pricing, shipping details, and a focused Vietnamese specialty food experience.`,
    keywords: [input.name, input.category, "vietnamese specialty food", "likefood", "shop online"],
  };

  const prompt = [
    "You are an ecommerce SEO strategist.",
    `Product: ${input.name}`,
    `Category: ${input.category}`,
    input.brand ? `Brand: ${input.brand}` : "Brand: not specified.",
    input.tags?.length ? `Known tags: ${input.tags.join(", ")}` : "Known tags: none.",
    "Return exactly three lines:",
    "TITLE: ...",
    "DESCRIPTION: ...",
    "KEYWORDS: keyword 1, keyword 2, keyword 3, keyword 4, keyword 5",
  ].join("\n");

  const text = await askAI(
    prompt,
    `TITLE: ${fallback.title}\nDESCRIPTION: ${fallback.description}\nKEYWORDS: ${fallback.keywords.join(", ")}`
  );

  const titleMatch = text.match(/TITLE:\s*(.+)/i);
  const descriptionMatch = text.match(/DESCRIPTION:\s*(.+)/i);
  const keywordsMatch = text.match(/KEYWORDS:\s*(.+)/i);

  return {
    title: titleMatch?.[1]?.trim() || fallback.title,
    description: descriptionMatch?.[1]?.trim() || fallback.description,
    keywords: keywordsMatch?.[1]?.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 5) || fallback.keywords,
  };
}

export async function generateMarketingCopy(
  input: GenerateProductContentInput
): Promise<{ headline: string; body: string; cta: string; tags: string[] }> {
  const fallback = {
    headline: `${input.name} for everyday gifting and pantry use`,
    body: `Introduce ${input.name} with a clear value story, a short quality angle, and one concrete use case so shoppers understand why it belongs in the cart.`,
    cta: "Shop now",
    tags: [input.category, "likefood", "vietnamese specialty"],
  };

  const prompt = [
    "You are writing a short ecommerce marketing block for LIKEFOOD.",
    `Product: ${input.name}`,
    `Category: ${input.category}`,
    input.features?.length ? `Key selling points: ${input.features.join(", ")}` : "Key selling points: not provided.",
    "Return exactly four lines:",
    "HEADLINE: ...",
    "BODY: ...",
    "CTA: ...",
    "TAGS: tag1, tag2, tag3, tag4",
  ].join("\n");

  const text = await askAI(
    prompt,
    `HEADLINE: ${fallback.headline}\nBODY: ${fallback.body}\nCTA: ${fallback.cta}\nTAGS: ${fallback.tags.join(", ")}`
  );

  const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
  const bodyMatch = text.match(/BODY:\s*(.+)/i);
  const ctaMatch = text.match(/CTA:\s*(.+)/i);
  const tagsMatch = text.match(/TAGS:\s*(.+)/i);

  return {
    headline: headlineMatch?.[1]?.trim() || fallback.headline,
    body: bodyMatch?.[1]?.trim() || fallback.body,
    cta: ctaMatch?.[1]?.trim() || fallback.cta,
    tags: tagsMatch?.[1]?.split(/[#,]/).map((item) => item.trim()).filter(Boolean).slice(0, 5) || fallback.tags,
  };
}
