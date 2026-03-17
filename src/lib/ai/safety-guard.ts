/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Intent } from "./intent-classifier";

export type ConfidenceLevel = "high" | "medium" | "low" | "very_low";

export interface SafetyResult {
  isSafe: boolean;
  confidence: ConfidenceLevel;
  fallbackResponse: string;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export function assessConfidence(
  intent: Intent,
  aiConfidence: number,
  hasEntities: boolean,
  hasContext: boolean
): ConfidenceLevel {
  if (intent === "UNKNOWN") return "very_low";
  if (aiConfidence < 0.3) return "very_low";
  if (aiConfidence < 0.5) return "low";
  if (hasEntities && !hasContext) return "medium";
  if (aiConfidence >= 0.7 && (hasEntities || hasContext)) return "high";
  return "medium";
}

export function getFallbackResponse(intent: Intent, language: "vi" | "en"): string {
  const fallbacks: Record<Intent, { vi: string; en: string }> = {
    PRODUCT_SEARCH: {
      vi: "Bạn muốn xem nhóm nào nhé? Ví dụ: trà, cà phê, cá khô, tôm khô, gia vị, bánh kẹo, quà biếu, đồ ăn vặt. Bạn gõ tên món hoặc dịp (quà biếu, ăn vặt) mình gợi ý chi tiết hơn.",
      en: "Which category are you looking for? For example: tea, coffee, dried fish, shrimp, spices, snacks, gifts. Type a product name or occasion and I’ll suggest options.",
    },
    PRODUCT_DETAILS: {
      vi: "Mình có thể tìm chi tiết sản phẩm cho bạn. Cho mình tên hoặc link sản phẩm cụ thể nhé.",
      en: "I can look up the product details for you. Please share the product name or link.",
    },
    ORDER_STATUS: {
      vi: "Để kiểm tra đơn hàng, bạn có thể vào Tài khoản > Đơn hàng, hoặc gửi cho mình mã đơn hàng.",
      en: "To check your order, open Account > Orders, or send me the order number.",
    },
    SHIPPING_INQUIRY: {
      vi: "Mình có thể giải thích phí ship và thời gian giao hàng. Nếu bạn cần chính xác hơn, hãy cho mình biết khu vực giao hàng.",
      en: "I can explain shipping cost and delivery time. If you want a more precise answer, tell me the delivery area.",
    },
    PAYMENT_HELP: {
      vi: "LIKEFOOD hỗ trợ thẻ, COD và các hình thức thanh toán được cấu hình trong checkout. Bạn đang cần hỗ trợ cách thanh toán nào?",
      en: "LIKEFOOD supports card payments, COD, and the checkout options configured for the store. Which payment method do you need help with?",
    },
    RETURN_REFUND: {
      vi: "Mình có thể giải thích quy trình đổi trả, hoàn tiền. Bạn hãy mô tả vấn đề hoặc sản phẩm cần hỗ trợ.",
      en: "I can walk you through returns and refunds. Please describe the issue or the product involved.",
    },
    ACCOUNT_HELP: {
      vi: "Mình có thể hỗ trợ đăng nhập, đăng ký hoặc đặt lại mật khẩu. Bạn đang gặp bước nào?",
      en: "I can help with login, sign-up, or password reset. Which step are you stuck on?",
    },
    PROMOTION_INQUIRY: {
      vi: "Mình sẽ ưu tiên thông tin khuyến mãi đang hoạt động. Nếu bạn muốn, mình có thể gợi ý coupon hoặc trang deals phù hợp.",
      en: "I will focus on active promotions only. If you want, I can point you to a relevant coupon or deals page.",
    },
    COMPLAINT: {
      vi: "Mình rất tiếc vì trải nghiệm này. Hãy cho mình biết chi tiết hơn để mình hướng dẫn bước xử lý phù hợp.",
      en: "I am sorry about that experience. Share a bit more detail and I will guide you to the right next step.",
    },
    GENERAL_QUESTION: {
      vi: "Bạn có thể diễn đạt cụ thể hơn một chút không? Mình sẽ trả lời ngắn gọn và đúng thông tin hơn.",
      en: "Can you make the question a bit more specific? I will give you a clearer and more accurate answer.",
    },
    RECOMMENDATION_REQUEST: {
      vi: "Mình có thể gợi ý món phù hợp nếu biết mục đích mua, ngân sách và khẩu vị của bạn.",
      en: "I can recommend a better match if I know the occasion, budget, and flavor preference.",
    },
    ORDER_PLACING: {
      vi: "Nếu bạn đã có sản phẩm muốn mua, mình sẽ hướng dẫn bạn vào giỏ và checkout nhanh hơn.",
      en: "If you already know what you want, I can guide you through cart and checkout quickly.",
    },
    PRODUCT_BENEFITS: {
      vi: "Mình có thể cung cấp thông tin về lợi ích sức khỏe và giá trị dinh dưỡng của sản phẩm. Bạn quan tâm sản phẩm nào?",
      en: "I can provide health benefits and nutritional value information. Which product are you interested in?",
    },
    PRODUCT_USAGE: {
      vi: "Mình có thể hướng dẫn cách sử dụng và pha chế sản phẩm. Bạn cần hướng dẫn cho sản phẩm nào?",
      en: "I can guide you on how to use and prepare the product. Which product do you need instructions for?",
    },
    PRODUCT_STORAGE: {
      vi: "Mình có thể tư vấn cách bảo quản để giữ được chất lượng tốt nhất. Bạn cần hướng dẫn bảo quản sản phẩm nào?",
      en: "I can advise on proper storage to maintain the best quality. Which product do you need storage tips for?",
    },
    PRODUCT_NUTRITION: {
      vi: "Mình có thể cung cấp thông tin thành phần dinh dưỡng của sản phẩm. Bạn muốn xem thông tin dinh dưỡng của sản phẩm nào?",
      en: "I can provide nutritional information for our products. Which product's nutrition facts do you want to see?",
    },
    PRODUCT_ORIGIN: {
      vi: "LIKEFOOD chuyên cung cấp đặc sản từ các vùng miền Việt Nam. Bạn muốn biết nguồn gốc của sản phẩm nào?",
      en: "LIKEFOOD specializes in specialties from regions across Vietnam. Which product's origin do you want to know?",
    },
    COMPARISON: {
      vi: "Mình có thể so sánh các sản phẩm để giúp bạn chọn lựa phù hợp hơn. Bạn muốn so sánh những sản phẩm nào?",
      en: "I can compare products to help you make a better choice. Which products would you like to compare?",
    },
    DIET_SPECIFIC: {
      vi: "LIKEFOOD có nhiều sản phẩm phù hợp với các chế độ ăn đặc biệt. Bạn đang theo chế độ ăn nào?",
      en: "LIKEFOOD has many products suitable for special diets. Which dietary requirement do you follow?",
    },
    GIFT_IDEA: {
      vi: "Mình có thể gợi ý các set quà tặng phù hợp theo dịp và ngân sách. Bạn cần quà cho dịp nào và ngân sách bao nhiêu?",
      en: "I can suggest gift sets suitable for any occasion and budget. What occasion and budget do you have in mind?",
    },
    COOKING_HELP: {
      vi: "Mình có thể hướng dẫn công thức và cách chế biến các món từ đặc sản Việt. Bạn muốn nấu món gì?",
      en: "I can share recipes and cooking instructions using Vietnamese specialties. What dish would you like to make?",
    },
    CHITCHAT: {
      vi: "Mình là trợ lý AI của LIKEFOOD, luôn sẵn sàng hỗ trợ bạn. Bạn cần mình giúp gì về sản phẩm hoặc đơn hàng không?",
      en: "I'm LIKEFOOD's AI assistant, always ready to help. Is there anything about our products or your order I can assist with?",
    },
    GREETING: {
      vi: "Xin chào! Mình là trợ lý AI của LIKEFOOD. Mình có thể gợi ý sản phẩm, giao hàng và hỗ trợ đặt hàng.",
      en: "Hello, I am LIKEFOOD's AI assistant. I can help with product discovery, shipping, and checkout guidance.",
    },
    THANKS: {
      vi: "Rất vui được hỗ trợ bạn. Nếu cần, mình có thể tiếp tục gợi ý sản phẩm hoặc giải thích đơn hàng.",
      en: "Happy to help. If you want, I can keep going with product suggestions or order guidance.",
    },
    COMBO_REQUEST: {
      vi: "Mình có thể gợi ý combo phù hợp! Bạn muốn combo ăn vặt, combo quà biếu, combo nấu ăn, hay combo tiết kiệm?",
      en: "I can suggest great combos! Would you like a snack combo, gift combo, cooking combo, or savings combo?",
    },
    PRODUCT_COMPARE: {
      vi: "Mình có thể so sánh chi tiết các sản phẩm cho bạn. Bạn muốn so sánh sản phẩm nào?",
      en: "I can compare products in detail for you. Which products would you like to compare?",
    },
    ADVISOR_REQUEST: {
      vi: "Mình sẽ tư vấn sản phẩm phù hợp nhất. Bạn cho mình biết mục đích mua, ngân sách và sở thích nhé!",
      en: "I'll recommend the best products for you. Tell me your purpose, budget, and preferences!",
    },
    UNKNOWN: {
      vi: "Mình chưa hiểu rõ ý bạn. Bạn có thể hỏi về: sản phẩm (trà, quà biếu, đồ ăn vặt), phí giao hàng, theo dõi đơn hàng, hoặc khuyến mãi. Bạn cần mình hỗ trợ phần nào?",
      en: "I didn’t quite get that. You can ask about: products (tea, gifts, snacks), shipping cost, order tracking, or promotions. What do you need help with?",
    },
  };

  return fallbacks[intent][language];
}

export function shouldEscalate(
  intent: Intent,
  confidence: ConfidenceLevel,
  consecutiveUnresolved = 0
): { shouldEscalate: boolean; reason?: string } {
  if (intent === "COMPLAINT" && confidence === "very_low") {
    return {
      shouldEscalate: true,
      reason: "Customer complaint requires human review.",
    };
  }

  if (consecutiveUnresolved >= 2) {
    return {
      shouldEscalate: true,
      reason: "Multiple unresolved turns in a row.",
    };
  }

  if (
    confidence === "very_low" &&
    (intent === "ORDER_STATUS" || intent === "RETURN_REFUND" || intent === "ACCOUNT_HELP")
  ) {
    return {
      shouldEscalate: true,
      reason: "Sensitive support flow needs a human fallback.",
    };
  }

  return { shouldEscalate: false };
}

export function getEscalationResponse(language: "vi" | "en"): string {
  return language === "vi"
    ? "Để được hỗ trợ nhanh và chính xác hơn, bạn có thể liên hệ tranquocvu3011@gmail.com hoặc để lại nội dung để đội ngũ LIKEFOOD tiếp nhận."
    : "For faster and more precise support, please contact tranquocvu3011@gmail.com or leave your message for the LIKEFOOD team.";
}

export function validateResponse(response: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const harmfulPatterns = [/hack/i, /bypass/i, /illegal/i, /fraud/i];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(response)) {
      issues.push("Potentially harmful content detected.");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function getSafeResponse(
  type: "product_not_found" | "order_not_found" | "general_error",
  language: "vi" | "en"
): string {
  const responses = {
    product_not_found: {
      vi: "Mình chưa tìm thấy sản phẩm đúng như bạn mô tả. Bạn thử đổi từ khóa tìm kiếm hoặc cho mình biết ngân sách và nhu cầu.",
      en: "I could not find the exact product yet. Try a different keyword, or tell me the budget and use case.",
    },
    order_not_found: {
      vi: "Mình chưa tìm thấy đơn hàng này. Bạn kiểm tra lại mã đơn hoặc vào mục Tài khoản > Đơn hàng nhé.",
      en: "I could not find that order yet. Please double-check the order number or open Account > Orders.",
    },
    general_error: {
      vi: "Hệ thống AI đang cần thêm một chút để xử lý. Bạn thử lại sau, hoặc hỏi mình theo cách cụ thể hơn nhé.",
      en: "The AI assistant needs another moment to respond. Please try again, or ask in a more specific way.",
    },
  };

  return responses[type][language];
}
