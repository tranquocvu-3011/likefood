/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { describe, it, expect } from "vitest";
import { 
  assessConfidence, 
  getFallbackResponse, 
  shouldEscalate, 
  validateResponse,
  getSafeResponse,
  type ConfidenceLevel as _ConfidenceLevel
} from "@/lib/ai/safety-guard";

describe("safety-guard", () => {
  describe("assessConfidence", () => {
    it("should return very_low for UNKNOWN intent", () => {
      const result = assessConfidence("UNKNOWN", 0.5, false, false);
      expect(result).toBe("very_low");
    });

    it("should return very_low for low AI confidence", () => {
      const result = assessConfidence("PRODUCT_SEARCH", 0.2, false, false);
      expect(result).toBe("very_low");
    });

    it("should return low for medium AI confidence", () => {
      const result = assessConfidence("PRODUCT_SEARCH", 0.4, false, false);
      expect(result).toBe("low");
    });

    it("should return medium when has entities but no context", () => {
      const result = assessConfidence("PRODUCT_SEARCH", 0.6, true, false);
      expect(result).toBe("medium");
    });

    it("should return high for high confidence with entities or context", () => {
      const result = assessConfidence("PRODUCT_SEARCH", 0.8, true, true);
      expect(result).toBe("high");
    });

    it("should return medium for high confidence without entities or context", () => {
      const result = assessConfidence("PRODUCT_SEARCH", 0.8, false, false);
      expect(result).toBe("medium");
    });
  });

  describe("getFallbackResponse", () => {
    it("should return Vietnamese fallback response", () => {
      const response = getFallbackResponse("PRODUCT_SEARCH", "vi");
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });

    it("should return English fallback response", () => {
      const response = getFallbackResponse("PRODUCT_SEARCH", "en");
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });

    it("should return different responses for different intents", () => {
      const productResponse = getFallbackResponse("PRODUCT_SEARCH", "vi");
      const orderResponse = getFallbackResponse("ORDER_STATUS", "vi");
      expect(productResponse).not.toBe(orderResponse);
    });
  });

  describe("shouldEscalate", () => {
    it("should not escalate for product search with high confidence", () => {
      const result = shouldEscalate("PRODUCT_SEARCH", "high", 0);
      expect(result.shouldEscalate).toBe(false);
    });

    it("should not escalate for general questions", () => {
      const result = shouldEscalate("GENERAL_QUESTION", "medium", 0);
      expect(result.shouldEscalate).toBe(false);
    });

    it("should escalate for complaint with very_low confidence", () => {
      const result = shouldEscalate("COMPLAINT", "very_low", 0);
      expect(result.shouldEscalate).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it("should escalate after multiple unresolved turns", () => {
      const result = shouldEscalate("PRODUCT_SEARCH", "medium", 2);
      expect(result.shouldEscalate).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it("should escalate for sensitive intents with very_low confidence", () => {
      const result = shouldEscalate("ORDER_STATUS", "very_low", 0);
      expect(result.shouldEscalate).toBe(true);
    });
  });

  describe("validateResponse", () => {
    it("should validate proper response", () => {
      const result = validateResponse("Xin chào! Tôi có thể giúp gì cho bạn?");
      expect(result.isValid).toBe(true);
    });

    it("should handle harmful content", () => {
      const result = validateResponse("This is a hack attempt");
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should return empty issues for safe content", () => {
      const result = validateResponse("Xin chào!");
      expect(result.issues).toHaveLength(0);
    });
  });

  describe("getSafeResponse", () => {
    it("should return product_not_found response in Vietnamese", () => {
      const result = getSafeResponse("product_not_found", "vi");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return product_not_found response in English", () => {
      const result = getSafeResponse("product_not_found", "en");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return order_not_found response", () => {
      const result = getSafeResponse("order_not_found", "vi");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return general_error response", () => {
      const result = getSafeResponse("general_error", "vi");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return different responses for different types", () => {
      const productResponse = getSafeResponse("product_not_found", "vi");
      const orderResponse = getSafeResponse("order_not_found", "vi");
      expect(productResponse).not.toBe(orderResponse);
    });
  });
});
