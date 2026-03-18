/**
 * LIKEFOOD - Behavior Track API v2
 * ─────────────────────────────────────────────────────────────
 * Security: userId resolved from server session (never trusted from client)
 * Batch: accepts single event or batch of events
 * Validation: strict payload validation with size limits
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { trackEvent, type EventType } from "@/lib/analytics/behavior";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";

// ─── Constants ───────────────────────────────────────────────

const MAX_BATCH_SIZE = 25;
const MAX_EVENT_DATA_SIZE = 4096; // bytes
const MAX_URL_LENGTH = 500;

const VALID_EVENT_TYPES = new Set([
  "page_view", "product_view", "product_click",
  "add_to_wishlist", "remove_from_wishlist",
  "add_to_cart", "remove_from_cart", "update_cart_quantity",
  "view_cart", "begin_checkout", "add_payment_info", "purchase",
  "search_query", "search_result_click",
  "chatbot_message", "chatbot_feedback",
  "notification_click", "email_open", "email_click",
  "signup", "login", "logout",
]);

const VALID_DEVICE_TYPES = new Set(["mobile", "desktop", "tablet"]);

// ─── Helpers ─────────────────────────────────────────────────

function isValidEventType(value: string): boolean {
  return VALID_EVENT_TYPES.has(value);
}

function sanitizeString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, maxLen) || undefined;
}

function sanitizeEventData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const str = JSON.stringify(data);
  if (str.length > MAX_EVENT_DATA_SIZE) return {};
  return data as Record<string, unknown>;
}

interface RawEvent {
  eventType?: string;
  eventData?: unknown;
  url?: unknown;
  referrer?: unknown;
  deviceType?: unknown;
  sessionId?: string;
  anonymousId?: string;
  timestamp?: number;
}

// ─── POST Handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit: 120 events per minute per IP (batches count as 1 request)
  const identifier = getRateLimitIdentifier(req);
  const rateResult = await applyRateLimit(identifier, apiRateLimit, {
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();

    // ── Resolve userId server-side (NEVER trust client) ──
    let serverUserId: number | undefined;
    try {
      const session = await getServerSession(authOptions);
      serverUserId = session?.user?.id ? Number(session.user.id) : undefined;
    } catch {
      // If session check fails, proceed as anonymous
    }

    // ── Support single event or batch ──
    const rawEvents: RawEvent[] = Array.isArray(body.events)
      ? body.events.slice(0, MAX_BATCH_SIZE)
      : [body];

    const results: Array<{ eventId: number; eventType: string }> = [];

    for (const raw of rawEvents) {
      const eventType = raw.eventType;
      const sessionId = raw.sessionId;

      // Validate required fields
      if (!eventType || !sessionId || typeof eventType !== "string" || typeof sessionId !== "string") {
        continue; // Skip invalid events in batch
      }

      if (!isValidEventType(eventType)) {
        continue;
      }

      // Validate & sanitize
      const deviceType = VALID_DEVICE_TYPES.has(String(raw.deviceType))
        ? (String(raw.deviceType) as "mobile" | "desktop" | "tablet")
        : "desktop";

      const eventId = await trackEvent({
        userId: serverUserId, // Always from server session
        sessionId: sessionId.slice(0, 100),
        eventType: eventType as EventType,
        eventData: sanitizeEventData(raw.eventData),
        url: sanitizeString(raw.url, MAX_URL_LENGTH),
        referrer: sanitizeString(raw.referrer, MAX_URL_LENGTH),
        deviceType,
      });

      results.push({ eventId, eventType });
    }

    return NextResponse.json({
      success: true,
      tracked: results.length,
      results,
    });
  } catch (error) {
    logger.error("Error tracking event", error as Error, { context: "behavior-track-api" });
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}

// ─── GET Handler ─────────────────────────────────────────────

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

    // If querying by userId, require auth
    if (userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (String(session.user.id) !== String(userId) && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { getRecentEvents } = await import("@/lib/analytics/behavior");
    const events = await getRecentEvents(sessionId || userId!, limit);

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
    return NextResponse.json({ error: "Failed to get events" }, { status: 500 });
  }
}
