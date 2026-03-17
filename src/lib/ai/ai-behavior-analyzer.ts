"use server";

/**
 * LIKEFOOD - AI Behavior Analyzer
 * Phân tích hành vi người dùng bằng AI → insights cho admin
 * Copyright (c) 2026 LIKEFOOD Team
 */

import prisma from "@/lib/prisma";
import { callGPT } from "@/lib/ai/ai-provider";

// ─── Types ───────────────────────────────────────────────────

export interface UserSegmentData {
  segment: string;
  count: number;
  description: string;
  avgOrderValue: number;
}

export interface ConversionFunnel {
  pageViews: number;
  productViews: number;
  addToCart: number;
  beginCheckout: number;
  purchases: number;
  conversionRate: number;
}

export interface BehaviorInsight {
  title: string;
  description: string;
  metric: string;
  trend: "up" | "down" | "stable";
  recommendation: string;
}

// ─── 1. User Segments ────────────────────────────────────────

export async function getUserSegments(days = 30): Promise<UserSegmentData[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get behavior events
    const events = await prisma.behaviorEvent.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      select: { userId: true, eventType: true },
    });

    // Count events per user per type
    const userEventMap = new Map<number, Record<string, number>>();
    for (const e of events) {
      if (!e.userId) continue;
      const existing = userEventMap.get(e.userId) ?? {};
      existing[e.eventType] = (existing[e.eventType] ?? 0) + 1;
      userEventMap.set(e.userId, existing);
    }

    // Classify segments (aligned with user-segmentation.ts)
    const segments: Record<string, number[]> = {
      vip_customer: [],
      repeat_customer: [],
      first_time_buyer: [],
      cart_abandoner: [],
      deal_seeker: [],
      active_searcher: [],
      window_shopper: [],
      new_visitor: [],
    };

    for (const [userId, counts] of userEventMap.entries()) {
      const purchases = counts.purchase ?? 0;
      const addToCart = counts.add_to_cart ?? 0;
      const searches = counts.search_query ?? 0;
      const views = counts.product_view ?? 0;
      const voucherSaves = counts.voucher_save ?? 0;

      if (purchases >= 5) segments.vip_customer.push(userId);
      else if (purchases >= 2) segments.repeat_customer.push(userId);
      else if (purchases === 1) segments.first_time_buyer.push(userId);
      else if (addToCart > 0 && purchases === 0) segments.cart_abandoner.push(userId);
      else if (voucherSaves > 2 || (searches >= 5 && addToCart > 0)) segments.deal_seeker.push(userId);
      else if (searches >= 3) segments.active_searcher.push(userId);
      else if (views >= 5 && addToCart === 0) segments.window_shopper.push(userId);
      else segments.new_visitor.push(userId);
    }

    // Calculate avg order values per segment
    const segmentData: UserSegmentData[] = [];
    const descriptions: Record<string, string> = {
      vip_customer: "Khách VIP — mua hàng thường xuyên, chi tiêu cao",
      repeat_customer: "Khách hàng mua hàng nhiều lần",
      first_time_buyer: "Khách mới mua hàng lần đầu",
      cart_abandoner: "Thêm giỏ hàng nhưng chưa thanh toán",
      deal_seeker: "Săn deal, thu thập voucher, tìm kiếm nhiều",
      active_searcher: "Tìm kiếm tích cực nhưng chưa mua",
      window_shopper: "Xem nhiều sản phẩm, chưa hành động",
      new_visitor: "Khách mới với ít tương tác",
    };

    for (const [segment, userIds] of Object.entries(segments)) {
      let avgOrderValue = 0;
      if (userIds.length > 0 && ["vip_customer", "repeat_customer", "first_time_buyer"].includes(segment)) {
        const orders = await prisma.order.aggregate({
          where: { userId: { in: userIds }, status: { in: ["DELIVERED", "COMPLETED"] } },
          _avg: { total: true },
        });
        avgOrderValue = orders._avg?.total ?? 0;
      }

      segmentData.push({
        segment,
        count: userIds.length,
        description: descriptions[segment] ?? segment,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      });
    }

    return segmentData.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("[AI_BEHAVIOR] getUserSegments error:", error);
    return [];
  }
}

// ─── 2. Conversion Funnel ────────────────────────────────────

export async function getConversionFunnel(days = 30): Promise<ConversionFunnel> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.behaviorEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.eventType] = e._count.id;
    }

    const pageViews = counts.page_view ?? 0;
    const productViews = counts.product_view ?? 0;
    const addToCart = counts.add_to_cart ?? 0;
    const beginCheckout = counts.begin_checkout ?? 0;
    const purchases = counts.purchase ?? 0;

    return {
      pageViews,
      productViews,
      addToCart,
      beginCheckout,
      purchases,
      conversionRate: pageViews > 0
        ? Math.round((purchases / pageViews) * 10000) / 100
        : 0,
    };
  } catch (error) {
    console.error("[AI_BEHAVIOR] getConversionFunnel error:", error);
    return { pageViews: 0, productViews: 0, addToCart: 0, beginCheckout: 0, purchases: 0, conversionRate: 0 };
  }
}

// ─── 3. AI Insights ──────────────────────────────────────────

export async function getAIBehaviorInsights(days = 30): Promise<BehaviorInsight[]> {
  try {
    const [segments, funnel] = await Promise.all([
      getUserSegments(days),
      getConversionFunnel(days),
    ]);

    // Get top searched terms
    const since = new Date();
    since.setDate(since.getDate() - days);
    const searchEvents = await prisma.behaviorEvent.findMany({
      where: { eventType: "search_query", createdAt: { gte: since } },
      select: { eventData: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    const searchTerms: Record<string, number> = {};
    for (const e of searchEvents) {
      try {
        const raw = e.eventData;
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        const query = data?.query as string | undefined;
        if (query) {
          searchTerms[query.toLowerCase()] = (searchTerms[query.toLowerCase()] ?? 0) + 1;
        }
      } catch { /* ignore malformed JSON */ }
    }

    const topSearches = Object.entries(searchTerms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => `"${term}" (${count}x)`)
      .join(", ");

    // Build AI prompt
    const prompt = `Bạn là chuyên gia phân tích hành vi người dùng cho LIKEFOOD — cửa hàng đặc sản Việt Nam tại Mỹ.
Dựa trên dữ liệu thật ${days} ngày qua:

📊 FUNNEL CHUYỂN ĐỔI:
- Lượt xem trang: ${funnel.pageViews}
- Xem sản phẩm: ${funnel.productViews}
- Thêm giỏ hàng: ${funnel.addToCart}
- Bắt đầu thanh toán: ${funnel.beginCheckout}
- Mua hàng: ${funnel.purchases}
- Tỷ lệ chuyển đổi: ${funnel.conversionRate}%

👥 PHÂN KHÚC KHÁCH HÀNG:
${segments.map(s => `- ${s.segment}: ${s.count} users (AOV: $${s.avgOrderValue})`).join("\n")}

🔍 TOP TÌM KIẾM: ${topSearches || "Không có dữ liệu"}

Hãy đưa ra 4-5 insights THỰC TẾ với đề xuất hành động CỤ THỂ.
Mỗi insight phải:
- Dựa trên số liệu cụ thể từ data
- Có metric rõ ràng
- Có recommendation actionable (admin có thể làm ngay)

Format JSON array: [{"title":"...", "description":"...", "metric":"...", "trend":"up|down|stable", "recommendation":"..."}]
Chỉ trả JSON array.`;

    const result = await callGPT(prompt, {
      task: "behavior-insight",
      temperature: 0.35,
      maxTokens: 800,
      frequencyPenalty: 0.2,
    });

    if (result?.text) {
      try {
        const text = result.text.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as BehaviorInsight[];
        }
      } catch {
        // Fallback to static insights
      }
    }

    return buildStaticInsights(segments, funnel, topSearches);
  } catch (error) {
    console.error("[AI_BEHAVIOR] getAIBehaviorInsights error:", error);
    return [];
  }
}

// ─── Static Insights (fallback) ──────────────────────────────

function buildStaticInsights(
  segments: UserSegmentData[],
  funnel: ConversionFunnel,
  topSearches: string
): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];

  // Conversion rate insight
  insights.push({
    title: "Tỷ lệ chuyển đổi",
    description: `${funnel.conversionRate}% visitors đã mua hàng`,
    metric: `${funnel.conversionRate}%`,
    trend: funnel.conversionRate > 2 ? "up" : funnel.conversionRate > 0 ? "stable" : "down",
    recommendation: funnel.conversionRate < 2
      ? "Cải thiện CTA, simplify checkout, thêm trust signals"
      : "Duy trì tốt, cân nhắc A/B test để tối ưu thêm",
  });

  // Cart abandonment
  const abandonRate = funnel.addToCart > 0
    ? Math.round(((funnel.addToCart - funnel.purchases) / funnel.addToCart) * 100)
    : 0;
  if (abandonRate > 50) {
    insights.push({
      title: "Bỏ giỏ hàng cao",
      description: `${abandonRate}% users thêm giỏ hàng nhưng không thanh toán`,
      metric: `${abandonRate}%`,
      trend: "down",
      recommendation: "Gửi email nhắc nhở, giảm giá cho cart abandoners, đơn giản hóa checkout",
    });
  }

  // Segments
  const abandoners = segments.find(s => s.segment === "cart_abandoner");
  if (abandoners && abandoners.count > 0) {
    insights.push({
      title: "Cart Abandoners",
      description: `${abandoners.count} users đã thêm sản phẩm vào giỏ nhưng chưa mua`,
      metric: String(abandoners.count),
      trend: "stable",
      recommendation: "Tạo popup exit-intent, gửi reminder email, offer discount code",
    });
  }

  // Top searches
  if (topSearches) {
    insights.push({
      title: "Xu hướng tìm kiếm",
      description: `Từ khóa phổ biến: ${topSearches}`,
      metric: String(Object.keys(topSearches).length),
      trend: "stable",
      recommendation: "Đảm bảo sản phẩm phù hợp với từ khóa này, tạo landing pages chuyên biệt",
    });
  }

  return insights;
}
