"use server";

/**
 * LIKEFOOD — AI Product Advisor
 * So sánh sản phẩm, tư vấn chuyên sâu, gợi ý thay thế.
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { callGPTJSON } from "@/lib/ai/ai-provider";
import prisma from "@/lib/prisma";
import type {
  ProductComparison,
  ProductComparisonItem,
  ProductStrengthWeakness,
  AlternativeProduct,
  AdvisorResponse,
} from "./ai-types";

// ─── Helpers ─────────────────────────────────────────────────

interface ProductRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  isOnSale: boolean;
  category: string;
  inventory: number;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  image: string | null;
  tags: string | null;
}

async function loadProducts(ids: number[]): Promise<ProductRecord[]> {
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isDeleted: false },
    select: {
      id: true, name: true, slug: true, description: true,
      price: true, salePrice: true, isOnSale: true, category: true,
      inventory: true, soldCount: true, ratingAvg: true, ratingCount: true,
      image: true, tags: true,
    },
  });
  return products as ProductRecord[];
}

// ─── Compare Products ────────────────────────────────────────

export async function compareProducts(productIds: number[]): Promise<ProductComparison | null> {
  if (productIds.length < 2 || productIds.length > 5) return null;

  const products = await loadProducts(productIds);
  if (products.length < 2) return null;

  // Get reviews for each product
  const reviews = await prisma.review.findMany({
    where: { productId: { in: productIds }, status: "APPROVED" },
    select: { productId: true, rating: true, comment: true },
    take: 30,
  });

  const reviewsByProduct = new Map<number, { avgRating: number; comments: string[] }>();
  for (const pid of productIds) {
    const productReviews = reviews.filter(r => r.productId === pid);
    reviewsByProduct.set(pid, {
      avgRating: productReviews.length > 0
        ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
        : 0,
      comments: productReviews.slice(0, 5).map(r => r.comment).filter(Boolean) as string[],
    });
  }

  const productSummaries = products.map(p => {
    const rev = reviewsByProduct.get(p.id);
    return `[${p.id}] ${p.name}
  - Giá: $${p.price}${p.isOnSale && p.salePrice ? ` (sale $${p.salePrice})` : ""}
  - Danh mục: ${p.category}
  - Bán: ${p.soldCount} | Đánh giá: ${p.ratingAvg}/5 (${p.ratingCount} reviews)
  - Tồn kho: ${p.inventory}
  - Mô tả: ${p.description?.slice(0, 200) || "N/A"}
  - Reviews: ${rev?.comments.slice(0, 3).join(" | ") || "Chưa có review"}`;
  }).join("\n\n");

  const prompt = `Bạn là chuyên gia tư vấn đặc sản Việt Nam cho LIKEFOOD.

So sánh các sản phẩm sau:

${productSummaries}

Trả về JSON:
{
  "items": [
    {
      "id": <product_id>,
      "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
      "weaknesses": ["điểm yếu 1"],
      "bestFor": ["phù hợp cho ai/dịp gì"]
    }
  ],
  "recommendation": "gợi ý chọn sản phẩm nào và lý do (tiếng Việt, 2-3 câu)",
  "summary": "tóm tắt so sánh (tiếng Việt, 1-2 câu)"
}

QUY TẮC:
- Dựa trên dữ liệu thật, KHÔNG bịa
- Strengths/weaknesses phải cụ thể
- Recommendation phải rõ ràng`;

  const aiResult = await callGPTJSON<{
    items: Array<{
      id: number;
      strengths: string[];
      weaknesses: string[];
      bestFor: string[];
    }>;
    recommendation: string;
    summary: string;
  }>(prompt, { task: "product-compare", temperature: 0.4, maxTokens: 1200 });

  const comparisonItems: ProductComparisonItem[] = products.map(p => {
    const aiItem = aiResult?.items?.find(i => i.id === p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      salePrice: p.salePrice,
      category: p.category,
      rating: p.ratingAvg,
      reviewCount: p.ratingCount,
      soldCount: p.soldCount,
      strengths: aiItem?.strengths ?? [`Đặc sản ${p.category} chính hãng`, `Đánh giá ${p.ratingAvg}/5`],
      weaknesses: aiItem?.weaknesses ?? [],
      bestFor: aiItem?.bestFor ?? ["Gia đình Việt tại Mỹ"],
    };
  });

  return {
    products: comparisonItems,
    recommendation: aiResult?.recommendation ?? `Cả ${products.length} sản phẩm đều là đặc sản chất lượng. Chọn dựa trên khẩu vị và ngân sách của bạn.`,
    summary: aiResult?.summary ?? `So sánh ${products.length} sản phẩm trong danh mục ${products[0].category}.`,
  };
}

// ─── Strengths & Weaknesses ──────────────────────────────────

export async function getProductStrengthsWeaknesses(productId: number): Promise<ProductStrengthWeakness | null> {
  const [product] = await loadProducts([productId]);
  if (!product) return null;

  // Find alternatives
  const alternatives = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: productId },
      isDeleted: false,
      inventory: { gt: 0 },
    },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, isOnSale: true, soldCount: true, ratingAvg: true },
    orderBy: [{ soldCount: "desc" }, { ratingAvg: "desc" }],
    take: 5,
  });

  const prompt = `Phân tích sản phẩm LIKEFOOD:
- Tên: ${product.name}
- Danh mục: ${product.category}
- Giá: $${product.price}${product.isOnSale && product.salePrice ? ` (sale $${product.salePrice})` : ""}
- Bán: ${product.soldCount} | Đánh giá: ${product.ratingAvg}/5
- Mô tả: ${product.description?.slice(0, 300) || "N/A"}

Sản phẩm tương tự:
${alternatives.map(a => `[${a.id}] ${a.name} — $${a.price} — ${a.soldCount} sold — ${a.ratingAvg}/5`).join("\n")}

Trả về JSON:
{
  "strengths": ["3-5 điểm mạnh cụ thể"],
  "weaknesses": ["1-2 điểm yếu nếu có"],
  "bestFor": ["ai/dịp nào phù hợp nhất"],
  "alternatives": [{"id": <product_id>, "reason": "lý do thay thế"}]
}`;

  const aiResult = await callGPTJSON<{
    strengths: string[];
    weaknesses: string[];
    bestFor: string[];
    alternatives: Array<{ id: number; reason: string }>;
  }>(prompt, { task: "advisor", temperature: 0.4, maxTokens: 800 });

  const altMap = new Map(alternatives.map(a => [a.id, a]));

  return {
    productId: product.id,
    name: product.name,
    strengths: aiResult?.strengths ?? [`Đặc sản ${product.category} chính hãng`, `Đánh giá ${product.ratingAvg}/5`, `Đã bán ${product.soldCount} sản phẩm`],
    weaknesses: aiResult?.weaknesses ?? [],
    bestFor: aiResult?.bestFor ?? ["Gia đình Việt tại Mỹ", "Quà biếu người thân"],
    alternatives: (aiResult?.alternatives ?? [])
      .filter(a => altMap.has(a.id))
      .map(a => {
        const alt = altMap.get(a.id)!;
        return {
          id: alt.id,
          name: alt.name,
          slug: alt.slug ?? String(alt.id),
          price: alt.price,
          salePrice: alt.isOnSale && alt.salePrice ? alt.salePrice : undefined,
          reason: a.reason,
        } satisfies AlternativeProduct;
      }),
  };
}

// ─── General Advisor (for chatbot integration) ───────────────

export async function getAdvisorResponse(
  query: string,
  userId?: number,
  language: "vi" | "en" = "vi"
): Promise<AdvisorResponse> {
  // Check if query is about comparison
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d");
  const isComparison = ["so sanh", "khac nhau", "compare", "versus", "vs", "hay la", "nen chon"].some(kw => normalizedQuery.includes(kw));

  if (isComparison) {
    // Try to extract product names from query
    const products = await prisma.product.findMany({
      where: { isDeleted: false, inventory: { gt: 0 } },
      select: { id: true, name: true },
      take: 100,
    });

    const matchedIds: number[] = [];
    for (const p of products) {
      const pNameNorm = p.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d");
      if (normalizedQuery.includes(pNameNorm) || normalizedQuery.includes(pNameNorm.replace(/\s+/g, ""))) {
        matchedIds.push(p.id);
      }
    }

    if (matchedIds.length >= 2) {
      const comparison = await compareProducts(matchedIds.slice(0, 4));
      if (comparison) {
        return {
          type: "comparison",
          content: comparison.recommendation,
          comparison,
        };
      }
    }
  }

  // General advisor: find relevant products and provide advice
  const products = await prisma.product.findMany({
    where: { isDeleted: false, inventory: { gt: 0 } },
    select: { id: true, name: true, slug: true, price: true, salePrice: true, isOnSale: true, image: true, category: true, soldCount: true, ratingAvg: true },
    orderBy: [{ soldCount: "desc" }],
    take: 30,
  });

  const productList = products.map(p => `[${p.id}] ${p.name} — $${p.price} — ${p.category}`).join("\n");

  const prompt = `Bạn là tư vấn viên chuyên nghiệp của LIKEFOOD.

Câu hỏi khách: "${query}"

Sản phẩm hiện có:
${productList}

Trả về JSON:
{
  "content": "câu tư vấn chi tiết bằng ${language === "vi" ? "tiếng Việt" : "English"}, 3-5 câu",
  "productIds": [id sản phẩm gợi ý, tối đa 5],
  "type": "recommendation"
}

QUY TẮC:
- Dựa trên sản phẩm thật
- Tư vấn cụ thể, không chung chung`;

  const aiResult = await callGPTJSON<{
    content: string;
    productIds: number[];
    type: string;
  }>(prompt, { task: "advisor", temperature: 0.5, maxTokens: 600 });

  const recommendedProducts = aiResult?.productIds
    ? products
      .filter(p => aiResult.productIds.includes(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug ?? String(p.id),
        price: p.isOnSale && p.salePrice ? p.salePrice : p.price,
        salePrice: p.salePrice,
        image: p.image,
        category: p.category,
        quantity: 1,
      }))
    : [];

  return {
    type: "recommendation",
    content: aiResult?.content ?? (language === "vi"
      ? "Mình có thể giúp bạn chọn sản phẩm phù hợp. Bạn cho mình biết thêm về nhu cầu nhé!"
      : "I can help you choose the right product. Tell me more about what you need!"),
    products: recommendedProducts,
  };
}
