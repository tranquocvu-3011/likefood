/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

/**
 * Frontend Analytics SDK
 * Client-side SDK for tracking user behavior on LIKEFOOD
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

interface TrackOptions {
  userId?: string;
  sessionId?: string;
  url?: string;
  referrer?: string;
  deviceType?: "mobile" | "desktop" | "tablet";
}

interface EventData {
  [key: string]: unknown;
}

class AnalyticsSDK {
  private sessionId: string;
  private userId?: string;
  private deviceType: "mobile" | "desktop" | "tablet";
  private apiBase: string = "/api/behavior/track";
  private queue: Array<{ eventType: EventType; eventData: EventData; options: TrackOptions }> = [];
  private isProcessing: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.deviceType = this.getDeviceType();
    this.loadUserId();
  }

  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") {
      return this.generateId();
    }

    let sessionId = sessionStorage.getItem("likefood_session_id");
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem("likefood_session_id", sessionId);
    }
    return sessionId;
  }

  private loadUserId(): void {
    if (typeof window !== "undefined") {
      this.userId = localStorage.getItem("likefood_user_id") || undefined;
    }
  }

  public setUserId(userId: number): void {
    this.userId = String(userId);
    if (typeof window !== "undefined") {
      localStorage.setItem("likefood_user_id", String(userId));
    }
  }

  public clearUserId(): void {
    this.userId = undefined;
    if (typeof window !== "undefined") {
      localStorage.removeItem("likefood_user_id");
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getUserId(): string | undefined {
    return this.userId;
  }

  private getDeviceType(): "mobile" | "desktop" | "tablet" {
    if (typeof window === "undefined") {
      return "desktop";
    }

    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return "mobile";
    if (/tablet/i.test(ua)) return "tablet";
    return "desktop";
  }

  private getCurrentUrl(): string {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  }

  private getReferrer(): string {
    if (typeof document !== "undefined") {
      return document.referrer;
    }
    return "";
  }

  private async sendEvent(
    eventType: EventType,
    eventData: EventData = {},
    options: TrackOptions = {}
  ): Promise<void> {
    const payload = {
      eventType,
      sessionId: options.sessionId || this.sessionId,
      userId: options.userId || this.userId,
      eventData,
      url: options.url || this.getCurrentUrl(),
      referrer: options.referrer || this.getReferrer(),
      deviceType: options.deviceType || this.deviceType,
    };

    try {
      const response = await fetch(this.apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to track event:", response.statusText);
      }
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  }

  private queueEvent(
    eventType: EventType,
    eventData: EventData = {},
    options: TrackOptions = {}
  ): void {
    this.queue.push({ eventType, eventData, options });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        await this.sendEvent(event.eventType, event.eventData, event.options);
      }
    }

    this.isProcessing = false;
  }

  // Page tracking
  public trackPageView(url?: string): void {
    this.queueEvent("page_view", {}, { url });
  }

  // Product tracking
  public trackProductView(
    productId: number,
    productName: string,
    category: string,
    price: number,
    url?: string
  ): void {
    this.queueEvent(
      "product_view",
      { productId, productName, category, price },
      { url }
    );
  }

  public trackProductClick(
    productId: number,
    productName: string,
    category: string,
    position: number
  ): void {
    this.queueEvent("product_click", {
      productId,
      productName,
      category,
      position,
    });
  }

  // Cart tracking
  public trackAddToCart(
    productId: number,
    productName: string,
    price: number,
    category: string,
    quantity: number = 1,
    variantId?: string
  ): void {
    this.queueEvent(
      "add_to_cart",
      {
        productId,
        productName,
        variantId,
        quantity,
        price,
        category,
        cartValue: price * quantity,
      },
      {}
    );
  }

  public trackRemoveFromCart(
    productId: number,
    productName: string,
    price: number,
    category: string,
    quantity: number = 1
  ): void {
    this.queueEvent(
      "remove_from_cart",
      { productId, productName, quantity, price, category },
      {}
    );
  }

  public trackUpdateCartQuantity(
    productId: number,
    quantity: number,
    price: number
  ): void {
    this.queueEvent("update_cart_quantity", { productId, quantity, price }, {});
  }

  public trackViewCart(cartValue: number, itemCount: number): void {
    this.queueEvent("view_cart", { cartValue, itemCount }, {});
  }

  public trackBeginCheckout(
    cartValue: number,
    itemCount: number,
    products: Array<{ id: string; name: string; price: number; quantity: number }>
  ): void {
    this.queueEvent(
      "begin_checkout",
      { cartValue, itemCount, products },
      {}
    );
  }

  // Purchase tracking
  public trackPurchase(
    orderId: number,
    total: number,
    currency: string = "USD",
    items: Array<{ productId: number; quantity: number; price: number }>
  ): void {
    this.queueEvent(
      "purchase",
      {
        orderId,
        total,
        currency,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      },
      {}
    );
  }

  // Search tracking
  public trackSearch(query: string, resultsCount: number): void {
    this.queueEvent("search_query", { query, resultsCount }, {});
  }

  public trackSearchResultClick(
    query: string,
    productId: number,
    position: number
  ): void {
    this.queueEvent("search_result_click", { query, productId, position }, {});
  }

  // Wishlist tracking
  public trackAddToWishlist(productId: number, productName: string): void {
    this.queueEvent("add_to_wishlist", { productId, productName }, {});
  }

  public trackRemoveFromWishlist(productId: number, productName: string): void {
    this.queueEvent("remove_from_wishlist", { productId, productName }, {});
  }

  // Chatbot tracking
  public trackChatbotMessage(
    message: string,
    intent: string,
    response: string
  ): void {
    this.queueEvent("chatbot_message", { message, intent, response }, {});
  }

  public trackChatbotFeedback(
    message: string,
    intent: string,
    feedback: "positive" | "negative"
  ): void {
    this.queueEvent("chatbot_feedback", { message, intent, feedback }, {});
  }

  // Auth tracking
  public trackSignup(method: string = "email"): void {
    this.queueEvent("signup", { method }, {});
  }

  public trackLogin(method: string = "email"): void {
    this.queueEvent("login", { method }, {});
  }

  public trackLogout(): void {
    this.queueEvent("logout", {}, {});
  }

  // Generic event tracking
  public track(eventType: EventType, eventData: EventData = {}): void {
    this.queueEvent(eventType, eventData, {});
  }

  // Get recent events from server
  public async getRecentEvents(limit: number = 50): Promise<unknown[]> {
    try {
      const response = await fetch(
        `${this.apiBase}?sessionId=${this.sessionId}&limit=${limit}`
      );
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error("Error fetching recent events:", error);
      return [];
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsSDK();

// Export class for custom instances
export { AnalyticsSDK };
export type { EventType, EventData, TrackOptions };
