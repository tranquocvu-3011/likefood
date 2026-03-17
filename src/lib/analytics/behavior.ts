"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";

const EVENT_TYPES = [
  "page_view",
  "product_view",
  "product_click",
  "add_to_wishlist",
  "remove_from_wishlist",
  "add_to_cart",
  "remove_from_cart",
  "update_cart_quantity",
  "view_cart",
  "begin_checkout",
  "add_payment_info",
  "purchase",
  "search_query",
  "search_result_click",
  "chatbot_message",
  "chatbot_feedback",
  "notification_click",
  "email_open",
  "email_click",
  "signup",
  "login",
  "logout",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface BehaviorEvent {
  id?: number;
  userId?: number;
  sessionId: string;
  eventType: EventType;
  eventData: Record<string, unknown>;
  url?: string;
  referrer?: string;
  deviceType: "mobile" | "desktop" | "tablet";
  createdAt?: Date;
}

function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

function normalizeEventType(value: string): EventType {
  return isEventType(value) ? value : "page_view";
}

function toInputJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

function toRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function trackEvent(event: Omit<BehaviorEvent, "id" | "createdAt">): Promise<number> {
  try {
    const createdEvent = await prisma.behaviorEvent.create({
      data: {
        userId: event.userId ?? null,
        sessionId: event.sessionId,
        eventType: event.eventType,
        eventData: JSON.stringify(event.eventData),
        url: event.url,
        referrer: event.referrer,
        deviceType: event.deviceType,
      },
    });

    return createdEvent.id;
  } catch (error) {
    console.error("trackEvent error:", error);
    return 0;
  }
}

export async function trackPageView(
  sessionId: string,
  userId: number | undefined,
  url: string,
  referrer?: string
): Promise<void> {
  await trackEvent({
    sessionId,
    userId: userId ?? undefined,
    eventType: "page_view",
    eventData: {},
    url,
    referrer,
    deviceType: getDeviceType(),
  });
}

export async function trackProductView(
  sessionId: string,
  userId: number | undefined,
  productId: number,
  productName: string,
  category: string,
  price: number,
  url: string
): Promise<void> {
  await trackEvent({
    sessionId,
    userId,
    eventType: "product_view",
    eventData: {
      productId,
      productName,
      category,
      price,
    },
    url,
    deviceType: getDeviceType(),
  });
}

export async function trackAddToCart(
  sessionId: string,
  userId: number | undefined,
  productId: number,
  productName: string,
  price: number,
  category: string,
  variantId?: number,
  quantity = 1
): Promise<void> {
  await trackEvent({
    sessionId,
    userId,
    eventType: "add_to_cart",
    eventData: {
      productId,
      productName,
      variantId,
      quantity,
      price,
      category,
      cartValue: price * quantity,
    },
    deviceType: getDeviceType(),
  });
}

export async function trackPurchase(
  sessionId: string,
  userId: number,
  orderId: number,
  total: number,
  items: { productId: number; quantity: number; price: number }[],
  currency = "USD"
): Promise<void> {
  await trackEvent({
    sessionId,
    userId,
    eventType: "purchase",
    eventData: {
      orderId,
      total,
      items,
      currency,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    },
    deviceType: getDeviceType(),
  });
}

export async function trackSearch(
  sessionId: string,
  userId: number | undefined,
  query: string,
  resultsCount: number
): Promise<void> {
  await trackEvent({
    sessionId,
    userId,
    eventType: "search_query",
    eventData: {
      query,
      resultsCount,
    },
    deviceType: getDeviceType(),
  });
}

export async function trackChatbotMessage(
  sessionId: string,
  userId: number | undefined,
  message: string,
  intent: string,
  response: string,
  feedback?: "positive" | "negative"
): Promise<void> {
  await trackEvent({
    sessionId,
    userId,
    eventType: "chatbot_message",
    eventData: {
      message,
      intent,
      response,
      feedback,
    },
    deviceType: getDeviceType(),
  });
}

export async function getRecentEvents(sessionId: string, limit = 50): Promise<BehaviorEvent[]> {
  const events = await prisma.behaviorEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return events.map((event) => ({
    ...event,
    userId: event.userId ?? undefined,
    url: event.url ?? undefined,
    referrer: event.referrer ?? undefined,
    eventType: normalizeEventType(event.eventType),
    eventData: toRecord(event.eventData),
    deviceType: (event.deviceType as 'mobile' | 'desktop' | 'tablet') ?? 'desktop',
  }));
}

export async function calculateUserSegment(userId: number): Promise<string[]> {
  const events = await prisma.behaviorEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const segments: string[] = [];
  const eventCounts = events.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.eventType] = (accumulator[event.eventType] || 0) + 1;
    return accumulator;
  }, {});

  if ((eventCounts.purchase || 0) >= 5) {
    segments.push("repeat_customer");
  } else if ((eventCounts.purchase || 0) >= 1) {
    segments.push("first_time_buyer");
  }

  if ((eventCounts.add_to_cart || 0) > 0 && (eventCounts.purchase || 0) === 0) {
    segments.push("cart_abandoner");
  }

  if ((eventCounts.view_cart || 0) > 0 && (eventCounts.begin_checkout || 0) === 0) {
    segments.push("high_intent");
  }

  if ((eventCounts.search_query || 0) >= 3) {
    segments.push("active_searcher");
  }

  const cartEvents = events.filter((event) => event.eventType === "add_to_cart");
  const totalCartValue = cartEvents.reduce((sum, event) => {
    const eventData = toRecord(event.eventData);
    const cartValue = eventData.cartValue;
    return sum + (typeof cartValue === "number" ? cartValue : 0);
  }, 0);
  const avgCartValue = cartEvents.length > 0 ? totalCartValue / cartEvents.length : 0;

  if (cartEvents.length > 0 && avgCartValue < 30) {
    segments.push("deal_seeker");
  }

  return segments;
}

function getDeviceType(): "mobile" | "desktop" | "tablet" {
  return "desktop";
}

