"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { callGPT } from "@/lib/ai/ai-provider";
import prisma from "@/lib/prisma";
// ─── Prospect Customer Analysis ──────────────────────────────

import type { ChurnRiskCustomer, CampaignAnalysis, ShoppingTrend, RevenueBreakdown, ProspectCustomer, ActiveVisitor, SmartCustomerProfile, HotLead, AISalesRecommendation } from "./ai-types";

/**
 * Phân tích khách hàng tiềm năng — dựa trên hành vi 7 ngày gần nhất
 * Trả về danh sách KH có hành vi cho thấy sự quan tâm cao
 */
export async function getProspectCustomers(days = 7): Promise<ProspectCustomer[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all behavior events with userId in the period
  const events = await prisma.behaviorEvent.findMany({
    where: { createdAt: { gte: since }, userId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  if (events.length === 0) return [];

  // Group events by userId
  interface UserBehavior {
    userId: number;
    pageViews: number;
    productViews: Map<number, { name: string; price: number; count: number; category: string }>;
    searchQueries: string[];
    addToCartCount: number;
    sessions: Set<string>;
    firstSeen: Date;
    lastSeen: Date;
    totalDurationMs: number;
    visitDays: Set<string>;
  }

  const userBehaviorMap = new Map<number, UserBehavior>();

  for (const event of events) {
    if (!event.userId) continue;
    const userId = event.userId;

    const behavior: UserBehavior = userBehaviorMap.get(userId) ?? {
      userId,
      pageViews: 0,
      productViews: new Map(),
      searchQueries: [],
      addToCartCount: 0,
      sessions: new Set(),
      firstSeen: event.createdAt,
      lastSeen: event.createdAt,
      totalDurationMs: 0,
      visitDays: new Set(),
    };

    behavior.pageViews += 1;
    behavior.sessions.add(event.sessionId);
    behavior.visitDays.add(event.createdAt.toISOString().split("T")[0]);

    if (event.createdAt < behavior.firstSeen) behavior.firstSeen = event.createdAt;
    if (event.createdAt > behavior.lastSeen) behavior.lastSeen = event.createdAt;

    if (event.eventData) {
      try {
        const data = JSON.parse(event.eventData);
        if (event.eventType === "product_view" && data.productId) {
          const existing = behavior.productViews.get(data.productId);
          if (existing) {
            existing.count += 1;
          } else {
            behavior.productViews.set(data.productId, {
              name: data.productName || `SP #${data.productId}`,
              price: data.price || 0,
              count: 1,
              category: data.category || "",
            });
          }
        }
        if (event.eventType === "search_query" && data.query && !behavior.searchQueries.includes(String(data.query))) {
          behavior.searchQueries.push(String(data.query));
        }
        if (event.eventType === "add_to_cart") behavior.addToCartCount += 1;
      } catch { /* ignore malformed */ }
    }

    userBehaviorMap.set(userId, behavior);
  }

  // Filter: only users with meaningful activity (>= 3 page views OR >= 1 product view)
  const activeUsers = [...userBehaviorMap.values()].filter(
    (u) => u.pageViews >= 3 || u.productViews.size >= 1
  );

  if (activeUsers.length === 0) return [];

  // Get user info
  const userIds = activeUsers.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "USER" },
    select: { id: true, name: true, email: true, phone: true, points: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Check which users already have recent orders (to exclude already-converted)
  const recentOrders = await prisma.order.findMany({
    where: { userId: { in: userIds }, createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { userId: true },
  });
  const recentBuyerIds = new Set(recentOrders.map((o) => o.userId));

  // Get top products for cross-reference
  const topProducts = await prisma.product.findMany({
    where: { isDeleted: false, isVisible: true, inventory: { gt: 0 } },
    select: { id: true, name: true, price: true, category: true, soldCount: true, salePrice: true },
    orderBy: { soldCount: "desc" },
    take: 30,
  });

  const prospects: ProspectCustomer[] = [];

  for (const behavior of activeUsers) {
    const user = userMap.get(behavior.userId);
    if (!user) continue;

    // Skip users who already bought in this period
    if (recentBuyerIds.has(behavior.userId)) continue;

    // Calculate prospect score
    let score = 0;
    const summaryParts: string[] = [];

    // Product views scoring
    if (behavior.productViews.size >= 10) { score += 25; summaryParts.push(`Xem ${behavior.productViews.size} SP khác nhau`); }
    else if (behavior.productViews.size >= 5) { score += 18; summaryParts.push(`Xem ${behavior.productViews.size} SP`); }
    else if (behavior.productViews.size >= 1) { score += 10; summaryParts.push(`Xem ${behavior.productViews.size} SP`); }

    // Repeated views (strong buy signal)
    const repeatedViews = [...behavior.productViews.values()].filter((v) => v.count >= 2);
    if (repeatedViews.length > 0) { score += 15; summaryParts.push(`Xem lại ${repeatedViews.length} SP nhiều lần`); }

    // Add to cart (very strong signal)
    if (behavior.addToCartCount > 0) {
      score += 25; summaryParts.push(`Thêm ${behavior.addToCartCount} SP vào giỏ hàng`);
    }

    // Search activity
    if (behavior.searchQueries.length >= 3) { score += 15; summaryParts.push(`Tìm kiếm ${behavior.searchQueries.length} lần`); }
    else if (behavior.searchQueries.length >= 1) { score += 8; summaryParts.push(`Tìm kiếm ${behavior.searchQueries.length} lần`); }

    // Visit frequency
    if (behavior.visitDays.size >= 3) { score += 12; summaryParts.push(`Quay lại ${behavior.visitDays.size} ngày`); }
    else if (behavior.visitDays.size >= 2) { score += 6; summaryParts.push(`Quay lại ${behavior.visitDays.size} ngày`); }

    // Page views volume
    if (behavior.pageViews >= 20) { score += 8; summaryParts.push(`${behavior.pageViews} lượt xem trang`); }

    score = Math.min(100, score);
    if (score < 15) continue; // Skip very low-score prospects

    // Duration estimate (average per session in minutes)
    const durationMs = behavior.lastSeen.getTime() - behavior.firstSeen.getTime();
    const avgSessionMinutes = behavior.sessions.size > 0
      ? Math.max(1, Math.round(durationMs / (behavior.sessions.size * 60000)))
      : 1;

    // Products viewed (sorted by view count)
    const productsViewed = [...behavior.productViews.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, p]) => ({ id, name: p.name, price: p.price, viewCount: p.count, category: p.category }));

    // Predict interested products based on behavior
    const viewedCategories = new Set(productsViewed.map((p) => p.category).filter(Boolean));
    const viewedProductIds = new Set(productsViewed.map((p) => p.id));
    const predictedProducts = topProducts
      .filter((p) => !viewedProductIds.has(p.id) && viewedCategories.has(p.category))
      .slice(0, 3)
      .map((p, i) => ({
        id: p.id,
        name: p.name,
        price: p.salePrice ?? p.price,
        reason: `Cùng danh mục "${p.category}" — ${p.soldCount} đã bán`,
        confidence: Math.max(0.5, 0.9 - i * 0.15),
      }));

    // If not enough from same category, add bestsellers
    if (predictedProducts.length < 3) {
      const remaining = topProducts
        .filter((p) => !viewedProductIds.has(p.id) && !predictedProducts.some((pp) => pp.id === p.id))
        .slice(0, 3 - predictedProducts.length)
        .map((p, i) => ({
          id: p.id,
          name: p.name,
          price: p.salePrice ?? p.price,
          reason: `Bán chạy nhất — ${p.soldCount} đã bán`,
          confidence: Math.max(0.4, 0.7 - i * 0.1),
        }));
      predictedProducts.push(...remaining);
    }

    // Determine segment
    let segment = "Đang tìm hiểu";
    if (score >= 70) segment = "Rất tiềm năng";
    else if (score >= 50) segment = "Tiềm năng cao";
    else if (score >= 30) segment = "Tiềm năng";

    // Suggested contact method
    let suggestedContactMethod = "📧 Email";
    if (user.phone) suggestedContactMethod = "📱 Gọi điện / Zalo";
    if (score >= 70 && user.phone) suggestedContactMethod = "📱 Gọi ngay";

    // Generate suggested message
    const topViewedName = productsViewed[0]?.name || "sản phẩm LIKEFOOD";
    const suggestedMessage = `Chào ${user.name || "anh/chị"}, em thấy ${user.name ? "" : "quý khách "}đang quan tâm đến ${topViewedName}. Bên em đang có ưu đãi đặc biệt, ${user.name ? "" : "quý khách "}có cần em tư vấn thêm không ạ?`;

    prospects.push({
      id: user.id,
      name: user.name || "Chưa cập nhật",
      email: user.email,
      phone: user.phone || undefined,
      avatarInitial: (user.name || user.email).charAt(0).toUpperCase(),
      prospectScore: score,
      visitDays: behavior.visitDays.size,
      totalPageViews: behavior.pageViews,
      totalProductViews: behavior.productViews.size,
      totalSearches: behavior.searchQueries.length,
      addToCartCount: behavior.addToCartCount,
      avgSessionMinutes,
      lastVisit: behavior.lastSeen.toISOString(),
      firstVisit: behavior.firstSeen.toISOString(),
      productsViewed,
      searchQueries: behavior.searchQueries.slice(0, 10),
      predictedProducts,
      behaviorSummary: summaryParts,
      segment,
      suggestedContactMethod,
      suggestedMessage,
    });
  }

  return prospects.sort((a, b) => b.prospectScore - a.prospectScore).slice(0, 30);
}


interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface ProductData {
  id: number;
  name: string;
  category: string;
  price: number;
  soldCount: number;
  inventory: number;
  ratingAvg: number;
}

interface CustomerData {
  id: number;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
  segment: string;
}

interface AIInsight {
  type: "success" | "warning" | "info" | "trend";
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

interface InventoryForecast {
  productId: number;
  productName: string;
  currentStock: number;
  daysUntilStockout: number;
  recommendedRestock: number;
  confidence: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  avgOrderValue: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function detectAdminLanguage(text: string): "vi" | "en" {
  const normalized = ` ${text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d")} `;
  const vietnameseSignals = [" doanh thu ", " khach hang ", " san pham ", " ton kho ", " chien luoc ", " don hang "];
  return vietnameseSignals.some((signal) => normalized.includes(signal)) ? "vi" : "en";
}

function getTopicFallback(topic: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes("revenue") || lower.includes("doanh thu")) {
    return "Revenue looks stable enough to review conversion drivers, best-selling products, and any recent pricing shifts before changing strategy.";
  }
  if (lower.includes("inventory") || lower.includes("ton kho")) {
    return "Inventory attention should go first to fast-moving products with less than two weeks of stock cover.";
  }
  if (lower.includes("customer") || lower.includes("khach hang")) {
    return "Customer analysis should focus on repeat buyers, dormant high-value users, and the segment with the best reorder potential.";
  }
  return "The current signal is usable, but the next best step is to compare revenue, inventory pressure, and customer quality before taking action.";
}

async function askAI(prompt: string, fallback: string): Promise<string> {
  const result = await callGPT(prompt, {
    task: "admin-insight",
    temperature: 0.5,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1,
  });
  return result?.text?.trim() || fallback;
}

export async function getAIAnalyticsInsights(salesData: SalesData[]): Promise<AIInsight[]> {
  if (!salesData.length) {
    return [{
      type: "info",
      title: "No analytics window yet",
      description: "The selected date range does not have enough finished orders to produce meaningful AI signals.",
    }];
  }

  const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const recent = salesData.slice(-7);
  const previous = salesData.slice(-14, -7);
  const recentAverage = recent.reduce((sum, day) => sum + day.revenue, 0) / Math.max(recent.length, 1);
  const previousAverage = previous.reduce((sum, day) => sum + day.revenue, 0) / Math.max(previous.length, 1);
  const trend = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;
  const peakDay = salesData.reduce((winner, day) => (day.revenue > winner.revenue ? day : winner), salesData[0]);

  const insights: AIInsight[] = [
    {
      type: trend >= 0 ? "success" : "warning",
      title: trend >= 0 ? "Revenue trend is positive" : "Revenue trend is under pressure",
      description:
        trend >= 0
          ? `Revenue over the last 7 days is up ${trend.toFixed(1)}% versus the prior 7-day window.`
          : `Revenue over the last 7 days is down ${Math.abs(trend).toFixed(1)}% versus the prior 7-day window.`,
      metric: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`,
    },
    {
      type: "info",
      title: "Average order value",
      description: `The current average order value sits at ${formatCurrency(averageOrderValue)}.`,
      metric: formatCurrency(averageOrderValue),
    },
    {
      type: "trend",
      title: "Strongest sales day",
      description: `${peakDay.date} produced the highest revenue in the selected range.`,
      metric: formatCurrency(peakDay.revenue),
    },
  ];

  if (recentAverage < previousAverage && averageOrderValue < 75) {
    insights.push({
      type: "warning",
      title: "Basket size needs attention",
      description: "Revenue is softening while average order value remains modest. Consider bundles or threshold-based incentives.",
      action: "Review merchandising and cart incentives",
    });
  }

  return insights;
}

export async function getAIInventoryForecast(products: ProductData[]): Promise<InventoryForecast[]> {
  return products
    .map((product) => {
      const dailySalesRate = product.soldCount > 0 ? product.soldCount / 30 : 0;
      const daysUntilStockout = dailySalesRate > 0 ? Math.max(Math.floor(product.inventory / dailySalesRate), 0) : 999;
      const recommendedRestock = dailySalesRate > 0 ? Math.ceil(dailySalesRate * 45) : Math.max(product.inventory, 10);

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.inventory,
        daysUntilStockout,
        recommendedRestock,
        confidence: dailySalesRate > 0 ? 0.82 : 0.45,
      };
    })
    .sort((left, right) => left.daysUntilStockout - right.daysUntilStockout);
}

export async function getAICustomerInsights(customers: CustomerData[]): Promise<CustomerSegment[]> {
  const segments = new Map<string, CustomerSegment>();

  for (const customer of customers) {
    const segment = customer.totalSpent >= 500
      ? "VIP"
      : customer.totalSpent >= 200
        ? "Premium"
        : customer.totalSpent >= 100
          ? "Regular"
          : "New";

    const current = segments.get(segment) ?? {
      segment,
      count: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
    };

    current.count += 1;
    current.totalRevenue += customer.totalSpent;
    current.avgOrderValue = current.count > 0 ? current.totalRevenue / current.count : 0;
    segments.set(segment, current);
  }

  return Array.from(segments.values()).sort((left, right) => right.totalRevenue - left.totalRevenue);
}

export async function getAIProductRecommendations(products: ProductData[], limit = 5): Promise<ProductData[]> {
  return products
    .map((product) => ({
      ...product,
      score: product.soldCount * 0.35 + product.ratingAvg * 18 + (product.inventory > 10 ? 10 : 0),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export async function getAIContentAnalysis(content: string): Promise<string> {
  const prompt = [
    "You are reviewing ecommerce copy for LIKEFOOD.",
    "Give a concise review with three parts: strengths, weaknesses, and next edit.",
    "Keep it under 120 words.",
    "Content:",
    content,
  ].join("\n\n");

  return askAI(prompt, getTopicFallback("content"));
}

export async function generateMarketingEmail(
  type: "welcome" | "promotion" | "abandoned_cart" | "order_confirm",
  context?: Record<string, string>
): Promise<string> {
  const promptMap: Record<string, string> = {
    welcome: "Write a warm welcome email for a new LIKEFOOD customer.",
    promotion: `Write a promotional email for LIKEFOOD. Include the offer ${context?.discount || "only if it is confirmed"}.`,
    abandoned_cart: "Write a calm abandoned cart email for LIKEFOOD that reminds the shopper of value without sounding pushy.",
    order_confirm: `Write an order confirmation email for LIKEFOOD using order reference ${context?.orderId || "the customer's order number"}.`,
  };

  const prompt = [
    promptMap[type] || promptMap.welcome,
    "Use a structured ecommerce email with subject line, preview text, body, and one main CTA.",
    "Keep details factual and do not invent discounts or shipping promises.",
  ].join("\n\n");

  return askAI(prompt, "Subject: LIKEFOOD update\n\nPreview: Your latest update from LIKEFOOD.\n\nBody: Thank you for shopping with LIKEFOOD. We are sharing the next step for your account or order.\n\nCTA: Open LIKEFOOD");
}

export async function getAISEOSuggestions(
  productName: string,
  category: string,
  currentDescription: string
): Promise<{ title: string; description: string; keywords: string[] }> {
  const fallback = {
    title: `${productName} | Vietnamese Specialty Food`,
    description: `Shop ${productName} from LIKEFOOD with clear pricing, fast delivery details, and a focused specialty food experience.`,
    keywords: [productName, category, "Vietnamese specialty food", "LIKEFOOD", "shop online"],
  };

  const prompt = [
    "You are an SEO strategist for an ecommerce product page.",
    `Product: ${productName}`,
    `Category: ${category}`,
    `Current description: ${currentDescription}`,
    "Return exactly three lines:",
    "TITLE: ...",
    "DESCRIPTION: ...",
    "KEYWORDS: keyword 1, keyword 2, keyword 3, keyword 4, keyword 5",
  ].join("\n");

  const text = await askAI(prompt, `TITLE: ${fallback.title}\nDESCRIPTION: ${fallback.description}\nKEYWORDS: ${fallback.keywords.join(", ")}`);
  const titleMatch = text.match(/TITLE:\s*(.+)/i);
  const descriptionMatch = text.match(/DESCRIPTION:\s*(.+)/i);
  const keywordsMatch = text.match(/KEYWORDS:\s*(.+)/i);

  return {
    title: titleMatch?.[1]?.trim() || fallback.title,
    description: descriptionMatch?.[1]?.trim() || fallback.description,
    keywords: keywordsMatch?.[1]?.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 5) || fallback.keywords,
  };
}

export async function getAIPricingStrategy(
  product: ProductData,
  competitors: { name: string; price: number }[]
): Promise<{ recommendedPrice: number; strategy: string; reasoning: string }> {
  const averageCompetitorPrice = competitors.reduce((sum, competitor) => sum + competitor.price, 0) / Math.max(competitors.length, 1);

  if (product.price > averageCompetitorPrice * 1.2) {
    return {
      recommendedPrice: Math.round(averageCompetitorPrice * 0.95 * 100) / 100,
      strategy: "Reduce price",
      reasoning: "The current price sits materially above the competitive set. A moderate reduction should improve conversion without forcing a discount war.",
    };
  }

  if (product.price < averageCompetitorPrice * 0.8) {
    return {
      recommendedPrice: Math.round(product.price * 1.08 * 100) / 100,
      strategy: "Lift price slightly",
      reasoning: "The product is priced well below the market. A modest increase can protect margin while remaining competitive.",
    };
  }

  return {
    recommendedPrice: Math.round(product.price * 100) / 100,
    strategy: "Hold current price",
    reasoning: "The product is already positioned close to the market average. Focus on merchandising and review quality before repricing.",
  };
}

export async function getAISummary(data: {
  revenue?: number;
  orders?: number;
  customers?: number;
  period?: string;
}): Promise<string> {
  const fallback = [
    `- Revenue snapshot: ${formatCurrency(data.revenue || 0)}`,
    `- Order volume: ${data.orders || 0}`,
    `- Customer count: ${data.customers || 0}`,
  ].join("\n");

  const prompt = [
    "Bạn là trợ lý AI thông minh cho quản trị viên cửa hàng LIKEFOOD.",
    "Hãy tóm tắt hiệu suất cửa hàng bằng tiếng Việt, ngắn gọn và có insights hành động.",
    `Kỳ: ${data.period || "tổng thể"}`,
    `Doanh thu: ${formatCurrency(data.revenue || 0)}`,
    `Đơn hàng: ${data.orders || 0}`,
    `Khách hàng: ${data.customers || 0}`,
    "Trả về đúng 3 bullet points (bắt đầu bằng -) với takeaways thực tế.",
    "Mỗi bullet phải có số liệu cụ thể và đề xuất hành động.",
  ].join("\n");

  return askAI(prompt, fallback);
}

export async function getAIChatResponse(
  message: string,
  context?: {
    recentOrders?: number;
    totalCustomers?: number;
    totalRevenue?: number;
    topProducts?: string[];
  }
): Promise<string> {
  const language = detectAdminLanguage(message);
  const contextLines = [
    context?.recentOrders !== undefined ? `Recent orders (7d): ${context.recentOrders}` : "",
    context?.totalCustomers !== undefined ? `Total customers: ${context.totalCustomers}` : "",
    context?.totalRevenue !== undefined ? `Total revenue: ${formatCurrency(context.totalRevenue)}` : "",
    context?.topProducts?.length ? `Top products:\n- ${context.topProducts.join("\n- ")}` : "",
  ].filter(Boolean).join("\n");

  const prompt = [
    "Bạn là copilot quản trị thông minh cho LIKEFOOD — cửa hàng đặc sản Việt Nam tại Mỹ.",
    language === "vi"
      ? "Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn, thực tế và có insights hành động."
      : "Reply in English, clearly, briefly, and practically with actionable insights.",
    "Vai trò: giúp admin ưu tiên hành động, hiểu tín hiệu kinh doanh, quyết định bước tiếp theo.",
    "Do NOT invent data. If info is missing, say what's missing and suggest next check.",
    "Use short sections or bullets. Always end with 1-2 recommended next steps.",
    contextLines ? `Dữ liệu cửa hàng hiện tại:\n${contextLines}` : "Dữ liệu cửa hàng: chưa có metrics.",
    `Yêu cầu admin: ${message}`,
  ].join("\n\n");

  return askAI(prompt, getTopicFallback(message));
}

// ─── Churn Risk Detection ────────────────────────────────────

export async function detectChurnRisk(days = 30): Promise<ChurnRiskCustomer[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      name: true,
      email: true,
      orders: {
        select: { total: true, createdAt: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const riskCustomers: ChurnRiskCustomer[] = [];

  for (const user of users) {
    const completedOrders = user.orders.filter(o => ["COMPLETED", "DELIVERED"].includes(o.status));
    if (completedOrders.length === 0) continue;

    const lastOrder = completedOrders[0];
    const daysSince = Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const totalSpent = completedOrders.reduce((s, o) => s + o.total, 0);

    let riskLevel: "high" | "medium" | "low" = "low";
    let riskReason = "";

    if (daysSince > 60 && totalSpent > 100) {
      riskLevel = "high";
      riskReason = `Khách VIP không mua ${daysSince} ngày, tổng chi $${totalSpent.toFixed(0)}`;
    } else if (daysSince > 45) {
      riskLevel = "medium";
      riskReason = `Không hoạt động ${daysSince} ngày`;
    } else if (daysSince > days && completedOrders.length >= 3) {
      riskLevel = "medium";
      riskReason = `Khách thường xuyên nhưng ${daysSince} ngày chưa quay lại`;
    }

    if (riskLevel !== "low" || daysSince > days) {
      riskCustomers.push({
        id: user.id,
        name: user.name || "Unknown",
        email: user.email,
        lastOrderDate: lastOrder.createdAt.toISOString(),
        daysSinceLastOrder: daysSince,
        totalOrders: completedOrders.length,
        totalSpent,
        riskLevel,
        riskReason: riskReason || `${daysSince} ngày chưa đơn hàng mới`,
      });
    }
  }

  return riskCustomers
    .sort((a, b) => {
      const levelOrder = { high: 0, medium: 1, low: 2 };
      return levelOrder[a.riskLevel] - levelOrder[b.riskLevel] || b.totalSpent - a.totalSpent;
    })
    .slice(0, 20);
}

// ─── Campaign Performance ────────────────────────────────────

export async function analyzeCampaignPerformance(): Promise<CampaignAnalysis[]> {
  const coupons = await prisma.coupon.findMany({
    select: {
      id: true,
      code: true,
      usedCount: true,
      discountType: true,
      discountValue: true,
    },
    take: 10,
    orderBy: { usedCount: "desc" },
  });

  return coupons.map(coupon => ({
    campaignId: coupon.id,
    name: coupon.code,
    type: "coupon" as const,
    totalUsage: coupon.usedCount,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: coupon.usedCount > 0 ? 0.5 : 0,
    effectiveness: coupon.usedCount >= 10 ? "high" : coupon.usedCount >= 3 ? "medium" : "low",
    insights: [
      `Coupon ${coupon.code} đã được sử dụng ${coupon.usedCount} lần`,
      `Loại giảm giá: ${coupon.discountType} — giá trị: ${coupon.discountValue}`,
    ],
  }));
}

// ─── Shopping Trends ─────────────────────────────────────────

export async function getShoppingTrends(days = 30): Promise<ShoppingTrend> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

  // Fetch current & previous period orders in one go
  const allOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: prevStart },
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    select: {
      createdAt: true,
      total: true,
      orderItems: {
        select: {
          productId: true,
          quantity: true,
          product: { select: { name: true, category: true } },
        },
      },
    },
  });

  // Split into current and previous periods
  const currentOrders = allOrders.filter(o => o.createdAt >= since);
  const prevOrders = allOrders.filter(o => o.createdAt < since);

  // Helper to aggregate sales data
  function aggregateSales(orders: typeof allOrders) {
    const catSales = new Map<string, number>();
    const prodSales = new Map<string, { name: string; sales: number }>();
    const hourOrders = new Map<number, number>();

    for (const order of orders) {
      const hour = order.createdAt.getHours();
      hourOrders.set(hour, (hourOrders.get(hour) ?? 0) + 1);
      for (const item of order.orderItems) {
        const cat = item.product?.category ?? "Unknown";
        catSales.set(cat, (catSales.get(cat) ?? 0) + item.quantity);
        const pKey = String(item.productId);
        const existing = prodSales.get(pKey) ?? { name: item.product?.name ?? "Unknown", sales: 0 };
        existing.sales += item.quantity;
        prodSales.set(pKey, existing);
      }
    }
    return { catSales, prodSales, hourOrders };
  }

  const current = aggregateSales(currentOrders);
  const prev = aggregateSales(prevOrders);

  // Calculate growth %
  function calcGrowth(now: number, before: number): number {
    if (before === 0) return now > 0 ? 100 : 0;
    return Math.round(((now - before) / before) * 100);
  }

  const currentRevenue = currentOrders.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
  const revenueGrowth = calcGrowth(currentRevenue, prevRevenue);

  return {
    period: `${days}d`,
    topCategories: Array.from(current.catSales.entries())
      .map(([name, sales]) => ({
        name, sales,
        growth: calcGrowth(sales, prev.catSales.get(name) ?? 0),
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6),
    topProducts: Array.from(current.prodSales.entries())
      .map(([key, data]) => ({
        ...data,
        growth: calcGrowth(data.sales, prev.prodSales.get(key)?.sales ?? 0),
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10),
    peakHours: Array.from(current.hourOrders.entries())
      .map(([hour, orders]) => ({ hour, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6),
    insights: [
      `${currentOrders.length} đơn hàng trong ${days} ngày (${currentOrders.length > prevOrders.length ? "↑" : "↓"} so với kỳ trước: ${prevOrders.length})`,
      `Doanh thu: ${formatCurrency(currentRevenue)} (${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}%)`,
      `Top danh mục: ${Array.from(current.catSales.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"}`,
    ],
  };
}

// ─── Revenue Breakdown ───────────────────────────────────────

export async function getRevenueBreakdown(days = 30): Promise<RevenueBreakdown> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { in: ["COMPLETED", "DELIVERED"] },
    },
    select: {
      total: true,
      paymentMethod: true,
      orderItems: {
        select: {
          quantity: true,
          price: true,
          product: { select: { category: true } },
        },
      },
    },
  });

  const total = orders.reduce((s, o) => s + o.total, 0);
  const catRevenue = new Map<string, number>();
  const paymentRevenue = new Map<string, { revenue: number; count: number }>();

  for (const order of orders) {
    const method = order.paymentMethod ?? "Unknown";
    const pm = paymentRevenue.get(method) ?? { revenue: 0, count: 0 };
    pm.revenue += order.total;
    pm.count += 1;
    paymentRevenue.set(method, pm);

    for (const item of order.orderItems) {
      const cat = item.product?.category ?? "Unknown";
      catRevenue.set(cat, (catRevenue.get(cat) ?? 0) + item.price * item.quantity);
    }
  }

  return {
    period: `${days}d`,
    total: Math.round(total * 100) / 100,
    byCategory: Array.from(catRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue: Math.round(revenue * 100) / 100,
        percentage: total > 0 ? Math.round((revenue / total) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    byPaymentMethod: Array.from(paymentRevenue.entries())
      .map(([method, data]) => ({
        method,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    averageOrderValue: orders.length > 0 ? Math.round((total / orders.length) * 100) / 100 : 0,
    insights: [
      `Tổng doanh thu: ${formatCurrency(total)}`,
      `${orders.length} đơn hàng, AOV: ${formatCurrency(orders.length > 0 ? total / orders.length : 0)}`,
    ],
  };
}

// ─── AI Command Center Functions ─────────────────────────────

/**
 * Get active visitors on the website (within last 15 minutes)
 */
export async function getActiveVisitors(): Promise<ActiveVisitor[]> {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const events = await prisma.behaviorEvent.findMany({
    where: { createdAt: { gte: fifteenMinAgo } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  interface VisitorSession {
    userId?: number;
    pages: string[];
    deviceType: string;
    firstSeen: Date;
    lastSeen: Date;
    searchQueries: string[];
    productViews: Map<number, { name: string; count: number }>;
  }

  const sessionMap = new Map<string, VisitorSession>();

  for (const event of events) {
    const session: VisitorSession = sessionMap.get(event.sessionId) ?? {
      userId: event.userId ?? undefined,
      pages: [] as string[],
      deviceType: event.deviceType,
      firstSeen: event.createdAt,
      lastSeen: event.createdAt,
      searchQueries: [] as string[],
      productViews: new Map<number, { name: string; count: number }>(),
    };

    if (event.url && !session.pages.includes(event.url)) session.pages.push(event.url);
    if (event.createdAt < session.firstSeen) session.firstSeen = event.createdAt;
    if (event.createdAt > session.lastSeen) session.lastSeen = event.createdAt;

    if (event.eventData) {
      try {
        const data = JSON.parse(event.eventData);
        if (event.eventType === "product_view" && data.productId) {
          const existing = session.productViews.get(data.productId);
          if (existing) existing.count += 1;
          else session.productViews.set(data.productId, { name: data.productName || `SP #${data.productId}`, count: 1 });
        }
        if (event.eventType === "search_query" && data.query && !session.searchQueries.includes(String(data.query))) {
          session.searchQueries.push(String(data.query));
        }
      } catch { /* ignore */ }
    }

    sessionMap.set(event.sessionId, session);
  }

  const userIds = [...new Set([...sessionMap.values()].map(s => s.userId).filter(Boolean))] as number[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const returningSessions = new Set<string>();
  if (sessionMap.size > 0) {
    const oldEvents = await prisma.behaviorEvent.findMany({
      where: { sessionId: { in: [...sessionMap.keys()] }, createdAt: { lt: today } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    });
    for (const e of oldEvents) returningSessions.add(e.sessionId);
  }

  const visitors: ActiveVisitor[] = [];
  for (const [sessionId, session] of sessionMap.entries()) {
    const user = session.userId ? userMap.get(session.userId) : undefined;
    const durationMs = session.lastSeen.getTime() - session.firstSeen.getTime();
    visitors.push({
      sessionId,
      userId: session.userId,
      userName: user?.name || undefined,
      userEmail: user?.email || undefined,
      currentPage: session.pages[0] || "/",
      deviceType: session.deviceType,
      lastActivity: session.lastSeen.toISOString(),
      pagesViewed: session.pages.length,
      durationMinutes: Math.max(1, Math.round(durationMs / 60000)),
      productsViewed: [...session.productViews.entries()].map(([id, v]) => ({ id, name: v.name, viewCount: v.count })),
      searchQueries: session.searchQueries,
      isReturning: returningSessions.has(sessionId),
    });
  }

  return visitors.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
}

/**
 * Smart customer profile with behavior analysis
 */
export async function getSmartCustomerProfile(userId: number): Promise<SmartCustomerProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, points: true, createdAt: true,
      orders: {
        select: { id: true, total: true, createdAt: true, status: true,
          orderItems: { select: { product: { select: { id: true, name: true, category: true, price: true } }, quantity: true } }
        },
        orderBy: { createdAt: "desc" }, take: 20,
      },
      cart: { select: { items: { select: { product: { select: { name: true, price: true } }, quantity: true } } } },
    },
  });
  if (!user) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const behaviorEvents = await prisma.behaviorEvent.findMany({
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" }, take: 200,
  });

  const productViewMap = new Map<number, { name: string; price: number; viewedAt: Date }>();
  const searchQueries: string[] = [];
  for (const event of behaviorEvents) {
    if (!event.eventData) continue;
    try {
      const data = JSON.parse(event.eventData);
      if (event.eventType === "product_view" && data.productId && !productViewMap.has(data.productId)) {
        productViewMap.set(data.productId, { name: data.productName || `SP #${data.productId}`, price: data.price || 0, viewedAt: event.createdAt });
      }
      if (event.eventType === "search_query" && data.query && !searchQueries.includes(data.query)) searchQueries.push(data.query);
    } catch { /* ignore */ }
  }

  const completedOrders = user.orders.filter(o => ["COMPLETED", "DELIVERED"].includes(o.status));
  const totalSpent = completedOrders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;

  let segment = "Khách mới";
  if (totalSpent >= 500) segment = "VIP";
  else if (totalSpent >= 200) segment = "Premium";
  else if (totalSpent >= 100) segment = "Thường xuyên";
  else if (completedOrders.length > 0) segment = "Đã mua";

  const catCount = new Map<string, number>();
  for (const order of user.orders) {
    for (const item of order.orderItems) {
      if (item.product?.category) catCount.set(item.product.category, (catCount.get(item.product.category) ?? 0) + item.quantity);
    }
  }
  const topCategories = [...catCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);

  const behaviorInsights: string[] = [];
  const pageViews = behaviorEvents.length;
  if (pageViews > 50) behaviorInsights.push("Rất tích cực, xem nhiều trang");
  else if (pageViews > 20) behaviorInsights.push("Mức độ quan tâm TB");
  else if (pageViews > 0) behaviorInsights.push("Đang tìm hiểu SP");
  if (productViewMap.size > 10) behaviorInsights.push(`Đã xem ${productViewMap.size} SP khác nhau`);
  if (searchQueries.length > 0) behaviorInsights.push(`Tìm kiếm ${searchQueries.length} lần`);
  if (user.cart?.items && user.cart.items.length > 0) behaviorInsights.push(`${user.cart.items.length} SP trong giỏ`);

  const lastOrder = completedOrders[0];
  if (lastOrder) {
    const daysSince = Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSince > 30) behaviorInsights.push(`${daysSince} ngày chưa mua — cần re-engage`);
  }

  let purchaseProbability = 20;
  if (user.cart?.items && user.cart.items.length > 0) purchaseProbability += 30;
  if (productViewMap.size > 5) purchaseProbability += 15;
  if (completedOrders.length > 0) purchaseProbability += 15;
  if (pageViews > 20) purchaseProbability += 10;
  if (searchQueries.length > 0) purchaseProbability += 10;
  purchaseProbability = Math.min(95, purchaseProbability);

  const aiRecommendations: string[] = [];
  if (purchaseProbability > 70) aiRecommendations.push("Khả năng mua cao — Liên hệ trực tiếp");
  if (user.cart?.items && user.cart.items.length > 0) aiRecommendations.push("Có SP trong giỏ — Gửi voucher kích mua");
  if (topCategories.length > 0) aiRecommendations.push(`Quan tâm: ${topCategories.slice(0, 3).join(", ")} — Push SP mới`);
  if (totalSpent >= 200 && segment !== "VIP") aiRecommendations.push("Gần VIP — Ưu đãi nâng tier");

  return {
    id: user.id, name: user.name || "Chưa cập nhật", email: user.email,
    phone: user.phone || undefined, joinedAt: user.createdAt.toISOString(),
    totalOrders: completedOrders.length, totalSpent: Math.round(totalSpent * 100) / 100,
    averageOrderValue: Math.round(avgOrderValue * 100) / 100,
    lastOrderDate: lastOrder?.createdAt.toISOString(), segment, loyaltyPoints: user.points,
    recentProducts: [...productViewMap.entries()].slice(0, 10).map(([id, p]) => ({ id, name: p.name, price: p.price, viewedAt: p.viewedAt.toISOString() })),
    cartItems: user.cart?.items?.map(item => ({ name: item.product.name, price: item.product.price, quantity: item.quantity })) || [],
    searchHistory: searchQueries.slice(0, 10), topCategories, behaviorInsights, purchaseProbability, aiRecommendations,
  };
}

/**
 * Find hot leads — visitors with high purchase probability
 */
export async function getHotLeads(): Promise<HotLead[]> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const events = await prisma.behaviorEvent.findMany({
    where: { createdAt: { gte: thirtyMinAgo } },
    orderBy: { createdAt: "desc" }, take: 1000,
  });

  const sessionMap = new Map<string, {
    userId?: number;
    productViews: Map<number, { name: string; price: number; count: number }>;
    addToCartCount: number; searchCount: number; pageViews: number; lastSeen: Date;
  }>();

  for (const event of events) {
    const session = sessionMap.get(event.sessionId) ?? {
      userId: event.userId ?? undefined,
      productViews: new Map(), addToCartCount: 0, searchCount: 0, pageViews: 0, lastSeen: event.createdAt,
    };
    session.pageViews += 1;
    if (event.createdAt > session.lastSeen) session.lastSeen = event.createdAt;

    if (event.eventData) {
      try {
        const data = JSON.parse(event.eventData);
        if (event.eventType === "product_view" && data.productId) {
          const existing = session.productViews.get(data.productId);
          if (existing) existing.count += 1;
          else session.productViews.set(data.productId, { name: data.productName || `#${data.productId}`, price: data.price || 0, count: 1 });
        }
        if (event.eventType === "add_to_cart") session.addToCartCount += 1;
        if (event.eventType === "search_query") session.searchCount += 1;
      } catch { /* ignore */ }
    }
    sessionMap.set(event.sessionId, session);
  }

  const userIds = [...new Set([...sessionMap.values()].map(s => s.userId).filter(Boolean))] as number[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const leads: HotLead[] = [];
  for (const [sessionId, session] of sessionMap.entries()) {
    let score = 0;
    const signals: string[] = [];
    if (session.addToCartCount > 0) { score += 35; signals.push(`Thêm ${session.addToCartCount} SP vào giỏ`); }
    if (session.productViews.size > 5) { score += 20; signals.push(`Xem ${session.productViews.size} SP`); }
    else if (session.productViews.size > 2) { score += 10; signals.push(`Xem ${session.productViews.size} SP`); }
    if (session.searchCount > 2) { score += 15; signals.push(`Tìm kiếm ${session.searchCount} lần`); }
    if (session.pageViews > 10) { score += 10; signals.push(`${session.pageViews} trang`); }
    if (session.userId) { score += 10; signals.push("Đã đăng nhập"); }
    const repeatedViews = [...session.productViews.values()].filter(v => v.count >= 2);
    if (repeatedViews.length > 0) { score += 10; signals.push(`Xem lại ${repeatedViews.length} SP`); }

    if (score < 25) continue;

    const user = session.userId ? userMap.get(session.userId) : undefined;
    const productsInterested = [...session.productViews.entries()]
      .sort((a, b) => b[1].count - a[1].count).slice(0, 5)
      .map(([id, p]) => ({ id, name: p.name, price: p.price }));
    const cartValue = productsInterested.reduce((s, p) => s + p.price, 0);

    let suggestedAction = "Theo dõi";
    if (score >= 70) suggestedAction = "🔥 Liên hệ ngay";
    else if (score >= 50) suggestedAction = "💡 Gửi voucher";
    else if (score >= 30) suggestedAction = "📧 Gửi thông báo SP";

    leads.push({
      sessionId, userId: session.userId

, userName: user?.name || undefined, userEmail: user?.email || undefined,
      score: Math.min(100, score), signals, productsInterested, cartValue,
      visitCount: session.pageViews, lastActivity: session.lastSeen.toISOString(), suggestedAction,
    });
  }

  return leads.sort((a, b) => b.score - a.score).slice(0, 20);
}

/**
 * AI sales recommendations for a customer
 */
export async function getAISalesRecommendations(userId: number): Promise<AISalesRecommendation | null> {
  const profile = await getSmartCustomerProfile(userId);
  if (!profile) return null;

  const topProducts = await prisma.product.findMany({
    where: { isVisible: true, isDeleted: false, inventory: { gt: 0 } },
    orderBy: { soldCount: "desc" }, take: 20,
    select: { id: true, name: true, price: true, category: true, soldCount: true, ratingAvg: true },
  });

  const interestedCategories = new Set(profile.topCategories);
  const categoryProducts = topProducts.filter(p => interestedCategories.has(p.category));
  const viewedIds = new Set(profile.recentProducts.map(p => p.id));
  const newProducts = topProducts.filter(p => !viewedIds.has(p.id));

  const recommendedProducts = categoryProducts.slice(0, 5).map((p, i) => ({
    id: p.id, name: p.name, price: p.price,
    reason: `Cùng danh mục "${p.category}" mà khách quan tâm`,
    confidence: Math.max(0.5, 0.95 - i * 0.1),
  }));

  const crossSellProducts = newProducts.slice(0, 5).map(p => ({
    id: p.id, name: p.name, price: p.price,
    reason: `Bán chạy (${p.soldCount} đã bán) — khách chưa xem`,
  }));

  const scriptPrompt = [
    "Bạn là trợ lý tư vấn bán hàng LIKEFOOD. Viết kịch bản tư vấn ngắn (5-7 câu):",
    `- Tên: ${profile.name}, Phân khúc: ${profile.segment}`,
    `- Tổng chi: ${formatCurrency(profile.totalSpent)}, Danh mục: ${profile.topCategories.join(", ") || "Chưa rõ"}`,
    `- SP đang xem: ${profile.recentProducts.slice(0, 3).map(p => p.name).join(", ") || "Chưa rõ"}`,
    `- Giỏ hàng: ${profile.cartItems.length > 0 ? profile.cartItems.map(i => i.name).join(", ") : "Trống"}`,
    "Kịch bản tự nhiên, thân thiện, đề xuất SP phù hợp.",
  ].join("\n");

  const salesScript = await askAI(scriptPrompt, `Chào ${profile.name}! Cảm ơn bạn đã quay lại LIKEFOOD. Bạn cần tư vấn gì thêm không ạ?`);
  const customerInsight = profile.behaviorInsights.join(". ") || "Chưa có đủ dữ liệu hành vi.";

  let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
  if (profile.purchaseProbability > 70) urgencyLevel = 'high';
  else if (profile.purchaseProbability > 40) urgencyLevel = 'medium';

  return {
    userId, customerName: profile.name,
    recommendedProducts, crossSellProducts, salesScript, customerInsight, urgencyLevel,
  };
}
