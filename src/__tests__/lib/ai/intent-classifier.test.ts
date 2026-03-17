/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { describe, it, expect } from "vitest";
import { classifyIntent, getIntentDisplayName } from "@/lib/ai/intent-classifier";

describe("intent-classifier", () => {
  describe("classifyIntent", () => {
    it("should classify PRODUCT_SEARCH intent", () => {
      const result = classifyIntent("Tôi muốn mua trà sen");
      expect(result.intent).toBe("PRODUCT_SEARCH");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify PRODUCT_SEARCH with English keywords", () => {
      const result = classifyIntent("I am looking for Vietnamese coffee");
      expect(result.intent).toBe("PRODUCT_SEARCH");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify ORDER_STATUS intent", () => {
      const result = classifyIntent("Tình trạng đơn hàng của tôi");
      expect(result.intent).toBe("ORDER_STATUS");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify SHIPPING_INQUIRY intent", () => {
      const result = classifyIntent("Phí ship bao nhiêu?");
      expect(result.intent).toBe("SHIPPING_INQUIRY");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify PAYMENT_HELP intent", () => {
      const result = classifyIntent("Cách thanh toán qua thẻ?");
      expect(result.intent).toBe("PAYMENT_HELP");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify ACCOUNT_HELP intent", () => {
      const result = classifyIntent("đăng nhập tài khoản");
      expect(result.intent).toBe("ACCOUNT_HELP");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify PROMOTION_INQUIRY intent", () => {
      const result = classifyIntent("Có mã giảm giá nào đang khuyến mãi không?");
      expect(result.intent).toBe("PROMOTION_INQUIRY");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify GREETING intent", () => {
      const result = classifyIntent("Xin chào");
      expect(result.intent).toBe("GREETING");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify GREETING with English keywords", () => {
      const result = classifyIntent("Hello");
      expect(result.intent).toBe("GREETING");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify THANKS intent", () => {
      const result = classifyIntent("Cảm ơn bạn!");
      expect(result.intent).toBe("THANKS");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should classify THANKS with English keywords", () => {
      const result = classifyIntent("Thank you");
      expect(result.intent).toBe("THANKS");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should return UNKNOWN for empty message", () => {
      const result = classifyIntent("");
      expect(result.intent).toBe("UNKNOWN");
    });

    it("should return entities object", () => {
      const result = classifyIntent("Tôi muốn mua trà sen");
      expect(result.entities).toBeDefined();
      expect(typeof result.entities).toBe("object");
    });

    it("should handle mixed Vietnamese and English", () => {
      const result = classifyIntent("I want to buy tra sua");
      expect(result.intent).toBe("PRODUCT_SEARCH");
    });

    it("should handle special characters", () => {
      const result = classifyIntent("!!! tìm sản phẩm ???");
      expect(result.intent).toBe("PRODUCT_SEARCH");
    });

    it("should always return confidence between 0 and 1", () => {
      const messages = [
        "Tìm sản phẩm",
        "Đơn hàng của tôi đâu?",
        "Ship hàng đi",
        "Cảm ơn",
      ];

      messages.forEach((message) => {
        const result = classifyIntent(message);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("getIntentDisplayName", () => {
    it("should return Vietnamese display name", () => {
      const name = getIntentDisplayName("PRODUCT_SEARCH", "vi");
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    it("should return English display name", () => {
      const name = getIntentDisplayName("PRODUCT_SEARCH", "en");
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });

    it("should return different names for different languages", () => {
      const viName = getIntentDisplayName("GREETING", "vi");
      const enName = getIntentDisplayName("GREETING", "en");
      expect(viName).not.toBe(enName);
    });

    it("should handle all intent types", () => {
      const intents = [
        "PRODUCT_SEARCH",
        "PRODUCT_DETAILS",
        "ORDER_STATUS",
        "SHIPPING_INQUIRY",
        "PAYMENT_HELP",
        "RETURN_REFUND",
        "ACCOUNT_HELP",
        "PROMOTION_INQUIRY",
        "COMPLAINT",
        "GENERAL_QUESTION",
        "RECOMMENDATION_REQUEST",
        "ORDER_PLACING",
        "GREETING",
        "THANKS",
        "UNKNOWN",
      ] as const;

      intents.forEach((intent) => {
        const name = getIntentDisplayName(intent, "vi");
        expect(name).toBeDefined();
      });
    });
  });
});
