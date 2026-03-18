/**
 * LIKEFOOD - Behavioral Intelligence Engine
 * ─────────────────────────────────────────────────────────────
 * Scoring, funnel analysis, affinity calculation, buyer stage,
 * intent scoring, and churn risk — all from BehaviorEvent data.
 *
 * Copyright (c) 2026 LIKEFOOD Team
 */

"use server";

import prisma from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────

export interface LeadScore {
  userId: number;
  score: number; // 0-100
  signals: string[];
  buyerStage: "awareness" | "consideration" | "intent" | "purchase" | "loyalty";
  intentScore: number; // 0-100
  churnRisk: number; // 0-100
  productAffinity: Array<{ category: string; score: number }>;
  lastActivity: Date;
}

export interface FunnelAnalysis {
  period: string;
  steps: Array<{
    name: string;
    count: number;
    dropOff: number;
    dropOffRate: number;
  }>;
  overallConversion: number;
}

export interface AbandonedSession {
  sessionId: string;
  userId?: number;
  userName?: string;
  email?: string;
  lastPage: string;
  farthestStage: string;
  productsViewed: Array<{ id: number; name: string; price: number }>;
  cartValue: number;
  durationMinutes: number;
  lastActivity: string;
}

export interface RetentionCohort {
  cohortMonth: string;
  totalUsers: number;
  retained: number[];
  retentionRates: number[];
}

// ─── Time-Decay Weights ──────────────────────────────────────

function timeDecayWeight(eventDate: Date, halfLifeDays = 14): number {
  const ageMs = Date.now() - eventDate.getTime();
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

// ─── Lead Scoring ────────────────────────────────────────────

const EVENT_WEIGHTS: Record<string, number> = {
  page_view: 1,
  product_view: 3,
  product_click: 2,
  search_query: 2,
  search_result_click: 3,
  add_to_wishlist: 5,
  add_to_cart: 8,
  begin_checkout: 12,
  purchase: 20,
  login: 1,
};

export async function calculateLeadScores(days = 30, limit = 50): Promise<LeadScore[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.behaviorEvent.findMany({
    where: { createdAt: { gte: since }, userId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const userMap = new Map<number, {
    rawScore: number;
    signals: string[];
    eventCounts: Record<string, number>;
    categories: Record<string, number>;
    lastActivity: Date;
    cartValue: number;
    daysActive: Set<string>;
  }>();

  for (const event of events) {
    if (!event.userId) continue;
    const userId = event.userId;

    const entry = userMap.get(userId) ?? {
      rawScore: 0,
      signals: [],
      eventCounts: {},
      categories: {},
      lastActivity: event.createdAt,
      cartValue: 0,
      daysActive: new Set(),
    };

    // Time-decayed score
    const weight = EVENT_WEIGHTS[event.eventType] ?? 1;
    entry.rawScore += weight * timeDecayWeight(event.createdAt);

    // Count events
    entry.eventCounts[event.eventType] = (entry.eventCounts[event.eventType] ?? 0) + 1;

    // Track last activity
    if (event.createdAt > entry.lastActivity) entry.lastActivity = event.createdAt;
    entry.daysActive.add(event.createdAt.toISOString().split("T")[0]);

    // Extract product/category data
    if (event.eventData) {
      try {
        const data = typeof event.eventData === "string" ? JSON.parse(event.eventData) : event.eventData;
        if (data?.category) {
          entry.categories[data.category as string] = (entry.categories[data.category as string] ?? 0) + weight;
        }
        if (event.eventType === "add_to_cart" && typeof data?.cartValue === "number") {
          entry.cartValue += data.cartValue;
        }
      } catch { /* ignore */ }
    }

    userMap.set(userId, entry);
  }

  // Convert to LeadScore[]
  const scores: LeadScore[] = [];
  const maxRawScore = Math.max(...[...userMap.values()].map(v => v.rawScore), 1);

  for (const [userId, data] of userMap.entries()) {
    const normalizedScore = Math.min(100, Math.round((data.rawScore / maxRawScore) * 100));

    // Generate signals
    const signals: string[] = [];
    const ec = data.eventCounts;
    if ((ec.purchase ?? 0) > 0) signals.push(`${ec.purchase} lần mua hàng`);
    if ((ec.add_to_cart ?? 0) > 0) signals.push(`${ec.add_to_cart} lần thêm giỏ`);
    if ((ec.begin_checkout ?? 0) > 0) signals.push(`${ec.begin_checkout} lần bắt đầu thanh toán`);
    if ((ec.product_view ?? 0) >= 5) signals.push(`Xem ${ec.product_view} sản phẩm`);
    if ((ec.search_query ?? 0) >= 3) signals.push(`Tìm kiếm ${ec.search_query} lần`);
    if (data.daysActive.size >= 3) signals.push(`Hoạt động ${data.daysActive.size} ngày`);

    // Determine buyer stage
    let buyerStage: LeadScore["buyerStage"] = "awareness";
    if ((ec.purchase ?? 0) >= 2) buyerStage = "loyalty";
    else if ((ec.purchase ?? 0) >= 1) buyerStage = "purchase";
    else if ((ec.begin_checkout ?? 0) > 0 || (ec.add_to_cart ?? 0) >= 2) buyerStage = "intent";
    else if ((ec.product_view ?? 0) >= 3 || (ec.add_to_wishlist ?? 0) > 0) buyerStage = "consideration";

    // Intent score: heavily weighted by recent cart/checkout activity
    let intentScore = 0;
    if ((ec.add_to_cart ?? 0) > 0) intentScore += 30;
    if ((ec.begin_checkout ?? 0) > 0) intentScore += 30;
    if ((ec.add_to_wishlist ?? 0) > 0) intentScore += 15;
    if ((ec.product_view ?? 0) >= 5) intentScore += 15;
    if (data.daysActive.size >= 3) intentScore += 10;
    intentScore = Math.min(100, intentScore);

    // Churn risk: inverse of recency
    const daysSinceLastActivity = (Date.now() - data.lastActivity.getTime()) / (24 * 60 * 60 * 1000);
    let churnRisk = 0;
    if (daysSinceLastActivity > 60) churnRisk = 90;
    else if (daysSinceLastActivity > 30) churnRisk = 60;
    else if (daysSinceLastActivity > 14) churnRisk = 30;
    else if (daysSinceLastActivity > 7) churnRisk = 15;

    // Category affinity
    const productAffinity = Object.entries(data.categories)
      .map(([category, score]) => ({ category, score: Math.round(score) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    scores.push({
      userId,
      score: normalizedScore,
      signals,
      buyerStage,
      intentScore,
      churnRisk,
      productAffinity,
      lastActivity: data.lastActivity,
    });
  }

  return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ─── Funnel Analysis ─────────────────────────────────────────

export async function getFunnelAnalysis(days = 30): Promise<FunnelAnalysis> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const counts = await prisma.behaviorEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.eventType] = c._count.id;

  const funnelSteps = [
    { name: "Xem trang", event: "page_view" },
    { name: "Xem sản phẩm", event: "product_view" },
    { name: "Thêm giỏ hàng", event: "add_to_cart" },
    { name: "Bắt đầu thanh toán", event: "begin_checkout" },
    { name: "Mua hàng", event: "purchase" },
  ];

  const steps = funnelSteps.map((step, i) => {
    const count = countMap[step.event] ?? 0;
    const prevCount = i > 0 ? (countMap[funnelSteps[i - 1].event] ?? 0) : count;
    const dropOff = i > 0 ? Math.max(0, prevCount - count) : 0;
    const dropOffRate = i > 0 && prevCount > 0 ? Math.round((dropOff / prevCount) * 100) : 0;
    return { name: step.name, count, dropOff, dropOffRate };
  });

  const firstStep = steps[0]?.count ?? 0;
  const lastStep = steps[steps.length - 1]?.count ?? 0;
  const overallConversion = firstStep > 0 ? Math.round((lastStep / firstStep) * 10000) / 100 : 0;

  return { period: `${days}d`, steps, overallConversion };
}

// ─── Abandoned Sessions ──────────────────────────────────────

export async function getAbandonedSessions(limit = 20): Promise<AbandonedSession[]> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Get sessions that had cart activity but no purchase in the last 2h
  const events = await prisma.behaviorEvent.findMany({
    where: { createdAt: { gte: twoHoursAgo, lte: thirtyMinAgo } },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const sessionMap = new Map<string, {
    userId?: number;
    productViews: Map<number, { name: string; price: number }>;
    hasCart: boolean;
    hasCheckout: boolean;
    hasPurchase: boolean;
    cartValue: number;
    lastPage: string;
    firstSeen: Date;
    lastSeen: Date;
  }>();

  for (const event of events) {
    const sess = sessionMap.get(event.sessionId) ?? {
      userId: event.userId ?? undefined,
      productViews: new Map(),
      hasCart: false,
      hasCheckout: false,
      hasPurchase: false,
      cartValue: 0,
      lastPage: event.url ?? "/",
      firstSeen: event.createdAt,
      lastSeen: event.createdAt,
    };

    if (event.createdAt < sess.firstSeen) sess.firstSeen = event.createdAt;
    if (event.createdAt > sess.lastSeen) sess.lastSeen = event.createdAt;
    if (event.url) sess.lastPage = event.url;

    if (event.eventType === "add_to_cart") sess.hasCart = true;
    if (event.eventType === "begin_checkout") sess.hasCheckout = true;
    if (event.eventType === "purchase") sess.hasPurchase = true;

    if (event.eventData) {
      try {
        const data = typeof event.eventData === "string" ? JSON.parse(event.eventData) : event.eventData;
        if (event.eventType === "product_view" && data?.productId) {
          sess.productViews.set(data.productId, { name: data.productName || `SP #${data.productId}`, price: data.price || 0 });
        }
        if (event.eventType === "add_to_cart" && typeof data?.cartValue === "number") {
          sess.cartValue += data.cartValue;
        }
      } catch { /* ignore */ }
    }

    sessionMap.set(event.sessionId, sess);
  }

  // Filter: sessions with cart activity but no purchase
  const abandoned: AbandonedSession[] = [];
  const userIds = [...new Set([...sessionMap.values()].map(s => s.userId).filter(Boolean))] as number[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  for (const [sessionId, sess] of sessionMap.entries()) {
    if (!sess.hasCart || sess.hasPurchase) continue;

    const user = sess.userId ? userMap.get(sess.userId) : undefined;
    const durationMs = sess.lastSeen.getTime() - sess.firstSeen.getTime();

    let farthestStage = "Xem sản phẩm";
    if (sess.hasCheckout) farthestStage = "Bắt đầu thanh toán";
    else if (sess.hasCart) farthestStage = "Thêm giỏ hàng";

    abandoned.push({
      sessionId,
      userId: sess.userId,
      userName: user?.name || undefined,
      email: user?.email || undefined,
      lastPage: sess.lastPage,
      farthestStage,
      productsViewed: [...sess.productViews.entries()].map(([id, p]) => ({ id, ...p })).slice(0, 5),
      cartValue: Math.round(sess.cartValue * 100) / 100,
      durationMinutes: Math.max(1, Math.round(durationMs / 60000)),
      lastActivity: sess.lastSeen.toISOString(),
    });
  }

  return abandoned
    .sort((a, b) => b.cartValue - a.cartValue)
    .slice(0, limit);
}

// ─── Search Intent Analysis ──────────────────────────────────

export interface SearchIntent {
  query: string;
  count: number;
  avgResultsCount: number;
  clickThroughRate: number;
  hasResults: boolean;
}

export async function getSearchIntents(days = 30, limit = 20): Promise<SearchIntent[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const searchEvents = await prisma.behaviorEvent.findMany({
    where: { eventType: { in: ["search_query", "search_result_click"] }, createdAt: { gte: since } },
    select: { eventType: true, eventData: true },
    take: 3000,
  });

  const queryMap = new Map<string, { count: number; totalResults: number; clicks: number }>();

  for (const event of searchEvents) {
    try {
      const data = typeof event.eventData === "string" ? JSON.parse(event.eventData) : event.eventData;
      const query = (data?.query as string)?.toLowerCase()?.trim();
      if (!query) continue;

      const entry = queryMap.get(query) ?? { count: 0, totalResults: 0, clicks: 0 };

      if (event.eventType === "search_query") {
        entry.count += 1;
        entry.totalResults += (typeof data?.resultsCount === "number" ? data.resultsCount : 0);
      } else {
        entry.clicks += 1;
      }

      queryMap.set(query, entry);
    } catch { /* ignore */ }
  }

  return [...queryMap.entries()]
    .map(([query, data]) => ({
      query,
      count: data.count,
      avgResultsCount: data.count > 0 ? Math.round(data.totalResults / data.count) : 0,
      clickThroughRate: data.count > 0 ? Math.round((data.clicks / data.count) * 100) : 0,
      hasResults: data.totalResults > 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ─── Retention Cohort Analysis ───────────────────────────────

export async function getRetentionCohorts(months = 3): Promise<RetentionCohort[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  // Get users who made their first event in each month
  const allEvents = await prisma.behaviorEvent.findMany({
    where: { createdAt: { gte: since }, userId: { not: null } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group first-seen month per user
  const userFirstMonth = new Map<number, string>();
  for (const event of allEvents) {
    if (!event.userId) continue;
    const month = event.createdAt.toISOString().slice(0, 7); // "2026-01"
    if (!userFirstMonth.has(event.userId)) {
      userFirstMonth.set(event.userId, month);
    }
  }

  // Group all activity months per user
  const userActiveMonths = new Map<number, Set<string>>();
  for (const event of allEvents) {
    if (!event.userId) continue;
    const month = event.createdAt.toISOString().slice(0, 7);
    const existing = userActiveMonths.get(event.userId) ?? new Set();
    existing.add(month);
    userActiveMonths.set(event.userId, existing);
  }

  // Build cohorts
  const cohortMonths = new Set([...userFirstMonth.values()]);
  const sortedMonths = [...cohortMonths].sort();
  const allMonthsSorted = [...new Set(allEvents.map(e => e.createdAt.toISOString().slice(0, 7)))].sort();

  const cohorts: RetentionCohort[] = [];

  for (const cohortMonth of sortedMonths) {
    const usersInCohort = [...userFirstMonth.entries()]
      .filter(([, m]) => m === cohortMonth)
      .map(([userId]) => userId);

    const totalUsers = usersInCohort.length;
    if (totalUsers === 0) continue;

    const monthIndex = allMonthsSorted.indexOf(cohortMonth);
    const retained: number[] = [];
    const retentionRates: number[] = [];

    for (let i = 0; i <= Math.min(months, allMonthsSorted.length - monthIndex - 1); i++) {
      const targetMonth = allMonthsSorted[monthIndex + i];
      if (!targetMonth) break;

      const retainedCount = usersInCohort.filter(userId => {
        const activeMonths = userActiveMonths.get(userId);
        return activeMonths?.has(targetMonth);
      }).length;

      retained.push(retainedCount);
      retentionRates.push(Math.round((retainedCount / totalUsers) * 100));
    }

    cohorts.push({ cohortMonth, totalUsers, retained, retentionRates });
  }

  return cohorts;
}
