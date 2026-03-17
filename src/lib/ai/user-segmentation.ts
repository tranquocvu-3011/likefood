/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type UserSegment =
  | "new_visitor"
  | "browser"
  | "cart_abandoner"
  | "high_intent"
  | "first_time_buyer"
  | "repeat_customer"
  | "vip_customer"
  | "churned_user"
  | "deal_seeker"
  | "voucher_collector"
  | "wishlister"
  | "searcher";

export interface UserSegmentData {
  userId: number;
  segment: UserSegment;
  score: number;
  calculatedAt: Date;
  expiresAt: Date;
  attributes: Record<string, unknown>;
}

interface UserBehaviorData {
  userId: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  firstVisitDate: Date;
  lastActiveDate: Date;
  productsViewed: number;
  productsAddedToCart: number;
  vouchersUsed: number;
  vouchersSaved: number;
  wishlistCount: number;
  searchCount: number;
  categoriesViewed: string[];
  averageOrderValue: number;
}

function toRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

class UserSegmenter {
  async determineSegments(userId: number): Promise<UserSegmentData[]> {
    try {
      const behaviorData = await this.getUserBehaviorData(userId);
      const segments = [
        this.checkNewVisitor(behaviorData),
        this.checkBrowser(behaviorData),
        this.checkCartAbandoner(behaviorData),
        this.checkHighIntent(behaviorData),
        this.checkFirstTimeBuyer(behaviorData),
        this.checkRepeatCustomer(behaviorData),
        this.checkVIPCustomer(behaviorData),
        this.checkChurnedUser(behaviorData),
        this.checkDealSeeker(behaviorData),
        this.checkVoucherCollector(behaviorData),
        this.checkWishlister(behaviorData),
        this.checkSearcher(behaviorData),
      ].filter((segment): segment is UserSegmentData => Boolean(segment));

      await this.saveSegments(userId, segments);
      return segments;
    } catch (error) {
      logger.error("Error determining segments", error as Error);
      return [];
    }
  }

  private async getUserBehaviorData(userId: number): Promise<UserBehaviorData> {
    const [user, orders, behaviorEvents, wishlistCount, userVouchers] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
      prisma.order.findMany({
        where: { userId },
        select: { total: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.behaviorEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.wishlist.count({ where: { userId } }),
      prisma.uservoucher.findMany({ where: { userId }, select: { usedAt: true } }),
    ]);

    const completedOrders = orders.filter((order) => order.status === "DELIVERED" || order.status === "COMPLETED");
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const lastActiveDate = behaviorEvents[0]?.createdAt || orders[0]?.createdAt || user?.createdAt || new Date();

    const eventCounts = behaviorEvents.reduce<Record<string, number>>((accumulator, event) => {
      accumulator[event.eventType] = (accumulator[event.eventType] || 0) + 1;
      return accumulator;
    }, {});

    const viewedProductIds = behaviorEvents
      .filter((event) => event.eventType === "product_view")
      .map((event) => toRecord(event.eventData).productId)
      .filter((productId): productId is string => typeof productId === "string");

    const viewedProducts = viewedProductIds.length
      ? await prisma.product.findMany({
          where: { id: { in: viewedProductIds.map(Number) } },
          select: { category: true },
        })
      : [];

    const categoriesViewed = Array.from(new Set(viewedProducts.map((productRecord) => productRecord.category)));

    return {
      userId,
      totalOrders: completedOrders.length,
      totalSpent,
      lastOrderDate: completedOrders[0]?.createdAt || null,
      firstVisitDate: user?.createdAt || new Date(),
      lastActiveDate,
      productsViewed: eventCounts.product_view || 0,
      productsAddedToCart: eventCounts.add_to_cart || 0,
      vouchersUsed: userVouchers.filter((voucher) => voucher.usedAt !== null).length,
      vouchersSaved: userVouchers.filter((voucher) => voucher.usedAt === null).length,
      wishlistCount,
      searchCount: eventCounts.search_query || 0,
      categoriesViewed,
      averageOrderValue: completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
    };
  }

  private checkNewVisitor(data: UserBehaviorData): UserSegmentData | null {
    const isNewVisitor =
      data.totalOrders === 0 &&
      data.productsViewed < 5 &&
      Date.now() - data.firstVisitDate.getTime() < 7 * 24 * 60 * 60 * 1000;

    return isNewVisitor
      ? this.createSegment(data.userId, "new_visitor", 1, 7, { productsViewed: data.productsViewed })
      : null;
  }

  private checkBrowser(data: UserBehaviorData): UserSegmentData | null {
    const isBrowser = data.productsViewed >= 5 && data.productsAddedToCart === 0 && data.totalOrders === 0;
    return isBrowser
      ? this.createSegment(data.userId, "browser", Math.min(data.productsViewed / 10, 1), 1, { productsViewed: data.productsViewed })
      : null;
  }

  private checkCartAbandoner(data: UserBehaviorData): UserSegmentData | null {
    const inactiveForOneHour = Date.now() - data.lastActiveDate.getTime() > 60 * 60 * 1000;
    const isCartAbandoner = data.productsAddedToCart > 0 && data.totalOrders === 0 && inactiveForOneHour;
    return isCartAbandoner
      ? this.createSegment(data.userId, "cart_abandoner", 0.85, 1, { productsAddedToCart: data.productsAddedToCart })
      : null;
  }

  private checkHighIntent(data: UserBehaviorData): UserSegmentData | null {
    const isHighIntent = data.productsAddedToCart > 0 && data.totalOrders === 0;
    return isHighIntent ? this.createSegment(data.userId, "high_intent", 0.9, 1, { searchCount: data.searchCount }) : null;
  }

  private checkFirstTimeBuyer(data: UserBehaviorData): UserSegmentData | null {
    if (data.totalOrders !== 1 || !data.lastOrderDate) return null;
    const daysSinceOrder = (Date.now() - data.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceOrder <= 30
      ? this.createSegment(data.userId, "first_time_buyer", 1, 30, { lastOrderDate: data.lastOrderDate.toISOString() })
      : null;
  }

  private checkRepeatCustomer(data: UserBehaviorData): UserSegmentData | null {
    return data.totalOrders >= 2
      ? this.createSegment(data.userId, "repeat_customer", Math.min(data.totalOrders / 5, 1), 7, { totalOrders: data.totalOrders })
      : null;
  }

  private checkVIPCustomer(data: UserBehaviorData): UserSegmentData | null {
    const isVIP = data.totalSpent >= 500 || data.totalOrders >= 5;
    return isVIP
      ? this.createSegment(data.userId, "vip_customer", Math.max(data.totalSpent / 1000, 0.8), 30, {
          totalSpent: data.totalSpent,
          averageOrderValue: data.averageOrderValue,
        })
      : null;
  }

  private checkChurnedUser(data: UserBehaviorData): UserSegmentData | null {
    const daysSinceLastActive = (Date.now() - data.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastActive > 30 && data.totalOrders > 0
      ? this.createSegment(data.userId, "churned_user", Math.min(daysSinceLastActive / 60, 1), 7, {
          daysSinceLastActive: Math.floor(daysSinceLastActive),
        })
      : null;
  }

  private checkDealSeeker(data: UserBehaviorData): UserSegmentData | null {
    const isDealSeeker = data.searchCount > 10 || data.vouchersSaved > 3;
    return isDealSeeker
      ? this.createSegment(data.userId, "deal_seeker", 0.7, 7, {
          searchCount: data.searchCount,
          vouchersSaved: data.vouchersSaved,
        })
      : null;
  }

  private checkVoucherCollector(data: UserBehaviorData): UserSegmentData | null {
    return data.vouchersSaved >= 5
      ? this.createSegment(data.userId, "voucher_collector", Math.min(data.vouchersSaved / 10, 1), 7, { vouchersSaved: data.vouchersSaved })
      : null;
  }

  private checkWishlister(data: UserBehaviorData): UserSegmentData | null {
    return data.wishlistCount >= 3
      ? this.createSegment(data.userId, "wishlister", Math.min(data.wishlistCount / 10, 1), 7, { wishlistCount: data.wishlistCount })
      : null;
  }

  private checkSearcher(data: UserBehaviorData): UserSegmentData | null {
    return data.searchCount >= 5
      ? this.createSegment(data.userId, "searcher", Math.min(data.searchCount / 20, 1), 1, {
          searchCount: data.searchCount,
          categoriesViewed: data.categoriesViewed,
        })
      : null;
  }

  private async saveSegments(userId: number, segments: UserSegmentData[]): Promise<void> {
    await prisma.userSegment.deleteMany({ where: { userId } });

    if (!segments.length) return;

    await prisma.userSegment.createMany({
      data: segments.map((segment) => ({

        userId: segment.userId,
        segment: segment.segment,
        score: segment.score,
        calculatedAt: segment.calculatedAt,
        expiresAt: segment.expiresAt,
      })),
    });
  }

  async getAllSegments(userId: number): Promise<UserSegmentData[]> {
    const segments = await prisma.userSegment.findMany({ where: { userId } });
    return segments.map((segment) => ({
      userId: segment.userId,
      segment: segment.segment as UserSegment,
      score: segment.score,
      calculatedAt: segment.calculatedAt,
      expiresAt: segment.expiresAt || new Date(),
      attributes: {},
    }));
  }

  async isInSegment(userId: number, segment: UserSegment): Promise<boolean> {
    const userSegment = await prisma.userSegment.findFirst({
      where: {
        userId,
        segment,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return Boolean(userSegment);
  }

  async calculateChurnRisk(userId: number): Promise<number> {
    const segments = await this.getAllSegments(userId);
    if (segments.some((segment) => segment.segment === "churned_user")) {
      return 1;
    }

    const behaviorData = await this.getUserBehaviorData(userId);
    const daysSinceLastActive = (Date.now() - behaviorData.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);

    let churnScore = 0;
    if (daysSinceLastActive > 7) churnScore += 0.2;
    if (daysSinceLastActive > 14) churnScore += 0.2;
    if (daysSinceLastActive > 21) churnScore += 0.3;
    if (behaviorData.totalOrders === 0) churnScore += 0.2;
    else if (behaviorData.totalOrders === 1) churnScore += 0.1;
    if (behaviorData.averageOrderValue < 30) churnScore += 0.1;

    return Math.min(churnScore, 1);
  }

  async calculateLTV(userId: number): Promise<number> {
    const behaviorData = await this.getUserBehaviorData(userId);
    const expectedFutureOrders = Math.max(0, 5 - behaviorData.totalOrders);
    return behaviorData.totalSpent + expectedFutureOrders * behaviorData.averageOrderValue;
  }

  async getUsersBySegment(segment: UserSegment, limit = 100): Promise<string[]> {
    const segments = await prisma.userSegment.findMany({
      where: { segment },
      take: limit,
    });

    return segments.map((segmentRecord) => String(segmentRecord.userId));
  }

  async triggerSegmentAction(userId: number, segment: UserSegment): Promise<void> {
    logger.debug(`Segment action requested for user ${userId} in ${segment}.`);
  }

  private createSegment(
    userId: number,
    segment: UserSegment,
    score: number,
    durationDays: number,
    attributes: Record<string, unknown>
  ): UserSegmentData {
    return {
      userId,
      segment,
      score,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      attributes,
    };
  }
}

export const userSegmenter = new UserSegmenter();
