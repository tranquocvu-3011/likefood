/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Frontend Analytics SDK v2
 * ─────────────────────────────────────────────────────────────
 * Security: userId NEVER sent from client — resolved server-side via session
 * Batching: events queued and flushed in batches (max 10 / 2s)
 * sendBeacon: unload events sent via navigator.sendBeacon for reliability
 * Dedup: identical events within 500ms window are de-duplicated
 * AnonymousId: persistent across sessions for pre-login attribution
 */

type EventType =
  | "page_view"
  | "product_view"
  | "product_click"
  | "add_to_wishlist"
  | "remove_from_wishlist"
  | "add_to_cart"
  | "remove_from_cart"
  | "update_cart_quantity"
  | "view_cart"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase"
  | "search_query"
  | "search_result_click"
  | "chatbot_message"
  | "chatbot_feedback"
  | "notification_click"
  | "email_open"
  | "email_click"
  | "signup"
  | "login"
  | "logout";

interface EventData {
  [key: string]: unknown;
}

interface QueuedEvent {
  eventType: EventType;
  eventData: EventData;
  url: string;
  referrer: string;
  deviceType: "mobile" | "desktop" | "tablet";
  sessionId: string;
  anonymousId: string;
  timestamp: number;
}

// ─── Constants ─────────────────────────────────────────────────
const API_BASE = "/api/behavior/track";
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 2000;
const DEDUP_WINDOW_MS = 500;
const SESSION_KEY = "lf_sid";
const ANON_KEY = "lf_aid";

// ─── SDK Class ─────────────────────────────────────────────────

class AnalyticsSDK {
  private sessionId: string = "";
  private anonymousId: string = "";
  private deviceType: "mobile" | "desktop" | "tablet" = "desktop";
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventHash: string = "";
  private lastEventTime: number = 0;
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.sessionId = this.getOrCreateId(SESSION_KEY, true);
    this.anonymousId = this.getOrCreateId(ANON_KEY, false);
    this.deviceType = this.detectDevice();

    // Flush on page unload via sendBeacon
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush(true);
      }
    });
    window.addEventListener("pagehide", () => this.flush(true));
  }

  // ─── ID Management ──────────────────────────────────────────

  private getOrCreateId(key: string, isSession: boolean): string {
    const storage = isSession ? sessionStorage : localStorage;
    try {
      let id = storage.getItem(key);
      if (!id) {
        id = `${isSession ? "s" : "a"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
        storage.setItem(key, id);
      }
      return id;
    } catch {
      return `${isSession ? "s" : "a"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    }
  }

  public getSessionId(): string { return this.sessionId; }
  public getAnonymousId(): string { return this.anonymousId; }

  // NOTE: userId is no longer managed client-side.
  // The API route resolves userId from the server session (next-auth).
  // setUserId/clearUserId are kept as no-ops for backward compatibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setUserId(_userId: number): void { /* no-op: resolved server-side */ }
  public clearUserId(): void { /* no-op */ }
  public getUserId(): string | undefined { return undefined; }

  // ─── Device Detection ───────────────────────────────────────

  private detectDevice(): "mobile" | "desktop" | "tablet" {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent;
    if (/iPad|tablet|playbook|silk/i.test(ua)) return "tablet";
    if (/Mobile|Android|iPhone|iPod|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return "mobile";
    return "desktop";
  }

  // ─── Event Queueing ─────────────────────────────────────────

  private enqueue(eventType: EventType, eventData: EventData = {}): void {
    if (typeof window === "undefined") return;
    if (!this.initialized) this.init();

    // Dedup: skip identical events within window
    const hash = `${eventType}:${JSON.stringify(eventData)}`;
    const now = Date.now();
    if (hash === this.lastEventHash && now - this.lastEventTime < DEDUP_WINDOW_MS) {
      return;
    }
    this.lastEventHash = hash;
    this.lastEventTime = now;

    this.queue.push({
      eventType,
      eventData,
      url: window.location.href,
      referrer: document.referrer,
      deviceType: this.deviceType,
      sessionId: this.sessionId,
      anonymousId: this.anonymousId,
      timestamp: now,
    });

    // Auto-flush when batch is full
    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  // ─── Flush ──────────────────────────────────────────────────

  private flush(useBeacon = false): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, BATCH_SIZE);
    const payload = JSON.stringify({ events: batch });

    if (useBeacon && typeof navigator?.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(API_BASE, blob);
    } else {
      fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => { /* silent — analytics should never break UX */ });
    }

    // If more events remain, schedule another flush
    if (this.queue.length > 0) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  // ─── Public API ─────────────────────────────────────────────

  public trackPageView(url?: string): void {
    this.enqueue("page_view", url ? { pageUrl: url } : {});
  }

  public trackProductView(productId: number, productName: string, category: string, price: number, url?: string): void {
    this.enqueue("product_view", { productId, productName, category, price, pageUrl: url });
  }

  public trackProductClick(productId: number, productName: string, category: string, position: number): void {
    this.enqueue("product_click", { productId, productName, category, position });
  }

  public trackAddToCart(productId: number, productName: string, price: number, category: string, quantity = 1, variantId?: string): void {
    this.enqueue("add_to_cart", { productId, productName, variantId, quantity, price, category, cartValue: price * quantity });
  }

  public trackRemoveFromCart(productId: number, productName: string, price: number, category: string, quantity = 1): void {
    this.enqueue("remove_from_cart", { productId, productName, quantity, price, category });
  }

  public trackUpdateCartQuantity(productId: number, quantity: number, price: number): void {
    this.enqueue("update_cart_quantity", { productId, quantity, price });
  }

  public trackViewCart(cartValue: number, itemCount: number): void {
    this.enqueue("view_cart", { cartValue, itemCount });
  }

  public trackBeginCheckout(cartValue: number, itemCount: number, products: Array<{ id: string; name: string; price: number; quantity: number }>): void {
    this.enqueue("begin_checkout", { cartValue, itemCount, products });
  }

  public trackPurchase(orderId: number, total: number, currency = "USD", items: Array<{ productId: number; quantity: number; price: number }>): void {
    this.enqueue("purchase", { orderId, total, currency, items, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
  }

  public trackSearch(query: string, resultsCount: number): void {
    this.enqueue("search_query", { query, resultsCount });
  }

  public trackSearchResultClick(query: string, productId: number, position: number): void {
    this.enqueue("search_result_click", { query, productId, position });
  }

  public trackAddToWishlist(productId: number, productName: string): void {
    this.enqueue("add_to_wishlist", { productId, productName });
  }

  public trackRemoveFromWishlist(productId: number, productName: string): void {
    this.enqueue("remove_from_wishlist", { productId, productName });
  }

  public trackChatbotMessage(message: string, intent: string, response: string): void {
    this.enqueue("chatbot_message", { message, intent, response });
  }

  public trackChatbotFeedback(message: string, intent: string, feedback: "positive" | "negative"): void {
    this.enqueue("chatbot_feedback", { message, intent, feedback });
  }

  public trackSignup(method = "email"): void { this.enqueue("signup", { method }); }
  public trackLogin(method = "email"): void { this.enqueue("login", { method }); }
  public trackLogout(): void { this.enqueue("logout", {}); }

  public track(eventType: EventType, eventData: EventData = {}): void {
    this.enqueue(eventType, eventData);
  }

  public async getRecentEvents(limit = 50): Promise<unknown[]> {
    try {
      const response = await fetch(`${API_BASE}?sessionId=${this.sessionId}&limit=${limit}`);
      const data = await response.json();
      return data.events || [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsSDK();

// Export class for custom instances
export { AnalyticsSDK };
export type { EventType, EventData };
