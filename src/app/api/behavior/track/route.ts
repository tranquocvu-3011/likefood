/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { trackEvent, type EventType } from "@/lib/analytics/behavior";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

// Validate event type
function isValidEventType(value: string): boolean {
  const validTypes = [
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
  ];
  return validTypes.includes(value);
}

export async function POST(req: NextRequest) {
  // Rate limit: 60 events per minute per IP to prevent analytics flooding
  const identifier = getRateLimitIdentifier(req);
  const rateResult = await applyRateLimit(identifier, apiRateLimit, { windowMs: 60 * 1000, maxRequests: 60 });
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      eventType,
      sessionId,
      userId,
      eventData,
      url,
      referrer,
      deviceType,
    } = body;

    // Validate required fields
    if (!eventType || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: eventType, sessionId" },
        { status: 400 }
      );
    }

    // Validate event type
    if (!isValidEventType(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${eventType}` },
        { status: 400 }
      );
    }

    // Validate device type
    const validDeviceTypes = ["mobile", "desktop", "tablet"];
    const validatedDeviceType = validDeviceTypes.includes(deviceType)
      ? deviceType
      : "desktop";

    // Track the event
    const eventId = await trackEvent({
      userId: userId || undefined,
      sessionId,
      eventType: eventType as EventType,
      eventData: eventData || {},
      url,
      referrer,
      deviceType: validatedDeviceType,
    });

    return NextResponse.json({
      success: true,
      eventId,
    });
  } catch (error) {
    logger.error("Error tracking event", error as Error, { context: "behavior-track-api" });
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const eventType = searchParams.get("eventType");
    let limit = parseInt(searchParams.get("limit") || "50");
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 200) limit = 200;

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: "Missing required parameter: sessionId or userId" },
        { status: 400 }
      );
    }

    // If querying by userId, require auth - user can only see their own events
    if (userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (String(session.user.id) !== String(userId) && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Import the function dynamically to avoid issues
    const { getRecentEvents } = await import("@/lib/analytics/behavior");

    const events = await getRecentEvents(sessionId || userId!, limit);

    // Filter by event type if specified
    const filteredEvents = eventType
      ? events.filter((e) => e.eventType === eventType)
      : events;

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      count: filteredEvents.length,
    });
  } catch (error) {
    logger.error("Error getting events", error as Error, { context: "behavior-track-api" });
    return NextResponse.json(
      { error: "Failed to get events" },
      { status: 500 }
    );
  }
}
