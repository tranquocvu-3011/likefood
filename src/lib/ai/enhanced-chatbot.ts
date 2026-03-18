"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Enhanced AI Chatbot - Nâng cấp 50 lần
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { callGPT } from "@/lib/ai/ai-provider";
import { classifyIntent, type Intent, type IntentResult } from "./intent-classifier";
import { addMessage, getConversationHistory, getContextSummary, isNewSession, updateEntities, getContext } from "./context-manager";
import { getActivePromotions, getCategories, getFlashSaleProducts, getShippingInfo, getTrendingProducts, searchProducts } from "./product-service";
import { assessConfidence, getFallbackResponse, getSafeResponse, shouldEscalate, validateResponse } from "./safety-guard";
import { searchKnowledge, type KnowledgeItem } from "./knowledge-base";
import { buildAIContext, getSmartRecommendations } from "./ai-data-reader";
import { notifyOwnerNewChat } from "@/lib/chat/owner-notification";
import { getComboSuggestions } from "./combo-engine";
import { getAdvisorResponse } from "./product-advisor";

interface ChatRequest {
  message: string;
  sessionId: string;
  userId?: string;
}

interface SuggestionItem {
  id: string | number;
  name: string;
  price?: number;
  slug?: string;
}

interface SuggestionGroup {
  type: "product" | "category" | "action" | "quickreply";
  items: SuggestionItem[];
}

interface ChatResponse {
  message: string;
  intent: string;
  confidence: number;
  language: "vi" | "en";
  suggestions?: SuggestionGroup[];
  shouldEscalate?: boolean;
  isNewUser?: boolean;
  productContext?: {
    id?: number;
    name?: string;
    price?: number;
  }[];
  quickReplies?: string[];
}

interface ContextSummary {
  messageCount: number;
  lastIntent?: string;
  language?: "vi" | "en";
  categories?: string[];
  entities?: Record<string, string>;
}

import { detectLanguage } from "@/lib/text-utils";

function trimProductQuery(message: string): string {
  return message
    .replace(/\b(co ban|muon mua|can mua|mua|tim|can tim|san pham|product|buy|have|recommend|goi y|cho toi|cho minh|cua|shop|store)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
  const positiveWords = ["ngon", "tuyệt", "tốt", " tuyệt vời", "awesome", "great", "good", "love", "perfect", "excellent", "happy", "hài lòng", "thích", "ưng ý", "ok", "okay", "được", "nice", "wonderful", "fantastic"];
  const negativeWords = ["tệ", "kém", "không", "bad", "poor", "terrible", "hate", "disappointed", "thất vọng", "không hài lòng", "tức", "bực", "mệt", "chán", "điên", "đập", "hét", "mắng", "quát", "mắng", "wrong", "issue", "problem", "lỗi", "sai", "hỏng", "hư", "bay giờ", "never", "waste", "tiếc"];
  
  const hasPositive = positiveWords.some(w => lower.includes(w));
  const hasNegative = negativeWords.some(w => lower.includes(w));
  
  if (hasNegative && !hasPositive) return "negative";
  if (hasPositive && !hasNegative) return "positive";
  return "neutral";
}

function buildEnhancedPrompt(
  message: string,
  history: string,
  language: "vi" | "en",
  intent: Intent,
  contextSummary: ContextSummary,
  knowledgeResults: KnowledgeItem[],
  productContext?: { name: string; price: number; description: string }[],
  sqlDataContext?: string
): string {
  const languageInstruction =
    language === "vi"
      ? "Trả lời bằng tiếng Việt. Luôn dùng đầy đủ dấu câu (dấu thanh, dấu hỏi, phẩy, chấm). Giọng tự nhiên như một người thật: thân thiện, ấm áp, ngắn gọn nhưng đầy đủ thông tin. Dùng 'mình' thay vì 'tôi', 'bạn' đúng chính tả. Không quá formal."
      : "Respond in English. Use proper punctuation. Sound natural and warm, like a real person. Keep it conversational but informative.";

  const contextLine = contextSummary.messageCount > 0
    ? `Conversation history:\n${history || "New conversation."}`
    : "This is the first message in the session.";

  const knowledgeBlock = knowledgeResults.length > 0
    ? `📚 Reference knowledge:\n${knowledgeResults.map(k => `Q: ${k.question}\nA: ${k.answer}`).join("\n\n")}`
    : "No reference note matched exactly.";

  const productContextBlock = productContext && productContext.length > 0
    ? `🛍️ Product context:\n${productContext.map(p => `- ${p.name} ($${p.price.toFixed(2)}): ${p.description.substring(0, 100)}...`).join("\n")}`
    : "";

  const sqlBlock = sqlDataContext
    ? `\n📊 DỮ LIỆU THẬT TỪ DATABASE (dùng để tư vấn chính xác):\n${sqlDataContext}`
    : "";

  const intentGuidance = getIntentGuidance(intent, language);

  return [
    "You are LIKEFOOD's AI shopping consultant powered by GPT — a knowledgeable Vietnamese food expert helping customers shop for authentic Vietnamese specialty foods in the USA.",
    languageInstruction,
    intentGuidance,
    "Your role: Help customers find products, answer questions about benefits/usage/storage/nutrition, explain shipping/payment/orders, and provide personalized recommendations based on REAL store data.",
    "Communication style: Concise (2-4 sentences max), warm, use emojis sparingly. Include product names, REAL prices. Ask 1 follow-up.",
    "Rules: Use ONLY real data below. Never invent. If sale price exists, show both. Suggest next step. Include product slug for links.",
    `Detected intent: ${intent}`,
    contextLine,
    knowledgeBlock,
    productContextBlock ? productContextBlock : "",
    sqlBlock,
    `Current customer message: ${message}`,
  ].filter(Boolean).join("\n\n");
}

function getIntentGuidance(intent: Intent, lang: "vi" | "en"): string {
  const guidance: Record<Intent, { vi: string; en: string }> = {
    PRODUCT_SEARCH: {
      vi: "→ Tìm sản phẩm phù hợp, gợi ý danh mục cụ thể, có thể hỏi về ngân sách hoặc sở thích.",
      en: "→ Find suitable products, suggest specific categories, ask about budget or preferences."
    },
    PRODUCT_BENEFITS: {
      vi: "→ Cung cấp thông tin chi tiết về lợi ích sức khỏe của sản phẩm, giải thích rõ ràng và hữu ích.",
      en: "→ Provide detailed health benefits, explain clearly and helpfully."
    },
    PRODUCT_USAGE: {
      vi: "→ Hướng dẫn cách sử dụng/chế biến sản phẩm, đưa ra công thức hoặc gợi ý món ăn.",
      en: "→ Guide how to use/cook the product, provide recipes or dish suggestions."
    },
    PRODUCT_STORAGE: {
      vi: "→ Giải thích cách bảo quản, thời hạn sử dụng, điều kiện bảo quản tốt nhất.",
      en: "→ Explain storage methods, shelf life, best storage conditions."
    },
    PRODUCT_NUTRITION: {
      vi: "→ Cung cấp thông tin dinh dưỡng, calorie, vitamin, chất có trong sản phẩm.",
      en: "→ Provide nutritional info, calories, vitamins, nutrients in the product."
    },
    PRODUCT_ORIGIN: {
      vi: "→ Nói rõ nguồn gốc, xuất xứ, vùng sản xuất của sản phẩm.",
      en: "→ Clearly state origin, source, production region of the product."
    },
    PRODUCT_DETAILS: {
      vi: "→ Cung cấp thông tin chi tiết về sản phẩm: thành phần, giá cả, đặc điểm.",
      en: "→ Provide detailed product info: ingredients, price, characteristics."
    },
    ORDER_STATUS: {
      vi: "→ Hướng dẫn xem trạng thái đơn hàng, hoặc yêu cầu mã đơn để kiểm tra.",
      en: "→ Guide to check order status, or ask for order ID to check."
    },
    SHIPPING_INQUIRY: {
      vi: "→ Giải thích rõ về phí giao hàng, thời gian giao, điều kiện freeship.",
      en: "→ Clearly explain shipping fees, delivery time, free shipping conditions."
    },
    PAYMENT_HELP: {
      vi: "→ Liệt kê các phương thức thanh toán, giải thích cách thanh toán an toàn.",
      en: "→ List payment methods, explain secure payment process."
    },
    RETURN_REFUND: {
      vi: "→ Giải thích chính sách đổi trả, quy trình hoàn tiền một cách rõ ràng.",
      en: "→ Explain return policy, refund process clearly."
    },
    ACCOUNT_HELP: {
      vi: "→ Hướng dẫn các vấn đề về tài khoản: đăng nhập, đăng ký, quên mật khẩu.",
      en: "→ Guide account issues: login, register, forgot password."
    },
    PROMOTION_INQUIRY: {
      vi: "→ Thông báo về các khuyến mãi hiện có, coupon, flash sale đang diễn ra.",
      en: "→ Inform about current promotions, coupons, flash sales."
    },
    COMPLAINT: {
      vi: "→ Lắng nghe và thông cảm, hỏi chi tiết vấn đề, đề xuất giải pháp cụ thể.",
      en: "→ Listen empathetically, ask about the issue, propose specific solutions."
    },
    GENERAL_QUESTION: {
      vi: "→ Trả lời thân thiện, có thể hỏi thêm để hiểu rõ nhu cầu.",
      en: "→ Answer friendly, can ask follow-ups to understand needs better."
    },
    RECOMMENDATION_REQUEST: {
      vi: "→ Đưa ra gợi ý cụ thể dựa trên sở thích, ngân sách, hoặc dịp sử dụng.",
      en: "→ Give specific suggestions based on preferences, budget, or occasion."
    },
    ORDER_PLACING: {
      vi: "→ Hướng dẫn đặt hàng từng bước, có thể giúp thêm sản phẩm vào giỏ.",
      en: "→ Guide step-by-step ordering, can help add products to cart."
    },
    GREETING: {
      vi: "→ Chào hỏi ấm áp, tự giới thiệu, hỏi xem có thể giúp gì.",
      en: "→ Warm greeting, introduce yourself, ask how you can help."
    },
    THANKS: {
      vi: "→ Cảm ơn chân thành, giữ mở cuộc hội thoại, hỏi có cần giúp gì thêm không.",
      en: "→ Thank sincerely, keep conversation open, ask if need more help."
    },
    CHITCHAT: {
      vi: "→ Trả lời thân thiện, có thể chia sẻ đôi chút về bản thân (AI assistant của LIKEFOOD).",
      en: "→ Reply friendly, can share a bit about yourself (LIKEFOOD's AI assistant)."
    },
    COMPARISON: {
      vi: "→ So sánh khách quan, chỉ ra ưu nhược điểm của từng lựa chọn.",
      en: "→ Compare objectively, point out pros and cons of each option."
    },
    DIET_SPECIFIC: {
      vi: "→ Cung cấp thông tin về sản phẩm phù hợp với chế độ ăn đặc biệt (chay, gluten-free, organic, giảm cân...).",
      en: "→ Provide info on products suitable for special diets (vegetarian, gluten-free, organic, weight loss...)."
    },
    GIFT_IDEA: {
      vi: "→ Gợi ý quà tặng phù hợp với đối tượng, ngân sách, và dịp.",
      en: "→ Suggest gift ideas suitable for recipient, budget, and occasion."
    },
    COOKING_HELP: {
      vi: "→ Hướng dẫn công thức nấu ăn, gợi ý món ăn từ nguyên liệu có sẵn.",
      en: "→ Guide cooking recipes, suggest dishes from available ingredients."
    },
    COMBO_REQUEST: {
      vi: "→ Gợi ý combo sản phẩm phù hợp, bao gồm giá gốc, giá giảm, và lý do chọn. Hiển thị tên sản phẩm, giá, và % tiết kiệm.",
      en: "→ Suggest product combos with original price, discount, and reason for selection. Show product names, prices, and savings %."
    },
    PRODUCT_COMPARE: {
      vi: "→ So sánh chi tiết các sản phẩm: điểm mạnh, điểm yếu, phù hợp cho ai, gợi ý chọn.",
      en: "→ Compare products in detail: strengths, weaknesses, best for whom, recommend choice."
    },
    ADVISOR_REQUEST: {
      vi: "→ Tư vấn chuyên sâu dựa trên nhu cầu, ngân sách, sở thích. Gợi ý sản phẩm cụ thể.",
      en: "→ Provide expert advice based on needs, budget, preferences. Suggest specific products."
    },
    UNKNOWN: {
      vi: "→ Hỏi lại để hiểu rõ hơn, hoặc gợi ý các chủ đề phổ biến.",
      en: "→ Ask clarifying question or suggest popular topics."
    },
  };

  return guidance[intent]?.[lang] || guidance.UNKNOWN[lang];
}

async function generateResponse(prompt: string): Promise<string | null> {
  try {
    const result = await callGPT(prompt, {
      task: "chatbot",
      temperature: 0.6,
      maxTokens: 500,
      topP: 0.9,
    });
    return result?.text?.trim() || null;
  } catch (error) {
    console.error("[AI Chatbot] GPT error:", error);
    return null;
  }
}

function formatProductSuggestions(products: { id: string | number; name: string; price: number; slug?: string }[], language: "vi" | "en"): SuggestionGroup {
  return {
    type: "product",
    items: products.slice(0, 6).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      slug: p.slug
    }))
  };
}

function getQuickReplies(intent: Intent, language: "vi" | "en"): string[] {
  const quickReplies: Partial<Record<Intent, { vi: string[]; en: string[] }>> = {
    GREETING: {
      vi: ["Tìm đặc sản ngon", "Điểm thưởng & Giới thiệu", "Thời gian giao hàng"],
      en: ["Find specialties", "Rewards & Referral", "Delivery time"]
    },
    PRODUCT_SEARCH: {
      vi: ["Xem gợi ý sản phẩm", "Tìm theo danh mục", "Sản phẩm giảm giá"],
      en: ["View product suggestions", "Browse by category", "On sale items"]
    },
    PRODUCT_BENEFITS: {
      vi: ["Cách sử dụng", "Cách bảo quản", "Giá và mua hàng"],
      en: ["How to use", "How to store", "Price and purchase"]
    },
    SHIPPING_INQUIRY: {
      vi: ["Phí giao hàng", "Thời gian giao", "Miễn phí vận chuyển"],
      en: ["Shipping cost", "Delivery time", "Free shipping"]
    },
    PAYMENT_HELP: {
      vi: ["Thanh toán online", "Thanh toán khi nhận hàng", "Các phương thức thanh toán"],
      en: ["Online payment", "Cash on delivery", "Payment methods"]
    },
    ORDER_STATUS: {
      vi: ["Xem đơn hàng của tôi", "Hủy đơn hàng", "Đổi/trả sản phẩm"],
      en: ["View my order", "Cancel order", "Return product"]
    },
    RECOMMENDATION_REQUEST: {
      vi: ["Quà biếu Tết", "Đồ ăn vặt", "Trà & Cà phê", "Gợi ý combo"],
      en: ["Tet gift ideas", "Snacks", "Tea & Coffee", "Suggest combos"]
    },
    COMBO_REQUEST: {
      vi: ["Combo ăn vặt", "Combo quà biếu", "Combo tiết kiệm", "Combo nấu ăn"],
      en: ["Snack combo", "Gift combo", "Savings combo", "Cooking combo"]
    },
    PRODUCT_COMPARE: {
      vi: ["So sánh khô bò & khô gà", "Xem sản phẩm", "Tư vấn cho tôi"],
      en: ["Compare products", "View products", "Advise me"]
    },
    ADVISOR_REQUEST: {
      vi: ["Mua cho gia đình", "Mua quà tặng", "Đồ ăn vặt ngon", "Ngân sách dưới $30"],
      en: ["For family", "For gifts", "Best snacks", "Budget under $30"]
    },
    UNKNOWN: {
      vi: ["Xem sản phẩm", "Điểm thưởng thành viên", "Phí giao hàng"],
      en: ["View products", "Member rewards", "Shipping fees"]
    }
  };

  return quickReplies[intent]?.[language] ?? (language === "vi"
    ? ["Xem sản phẩm", "Liên hệ hỗ trợ", "Khuyến mãi hiện có"]
    : ["View products", "Contact support", "Current promotions"]);
}

async function handleEnhancedIntent(
  intent: Intent,
  message: string,
  language: "vi" | "en",
  contextSummary: ContextSummary
): Promise<{ response: string; suggestions?: SuggestionGroup[]; quickReplies?: string[] }> {
  const lowerMessage = message.toLowerCase();

  // ── COMBO_REQUEST — gợi ý combo ──
  if (intent === "COMBO_REQUEST") {
    const typeMap: Record<string, string> = {
      "an vat": "snack", "snack": "snack", "qua": "gift", "gift": "gift",
      "tiet kiem": "savings", "savings": "savings", "nau": "cooking", "cooking": "cooking",
      "ban chay": "bestseller", "bestseller": "bestseller", "flash": "flashsale",
    };
    const normalizedMsg = lowerMessage.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d");
    let comboType = "bestseller";
    for (const [kw, t] of Object.entries(typeMap)) {
      if (normalizedMsg.includes(kw)) { comboType = t; break; }
    }
    
    try {
      const combos = await getComboSuggestions({ type: comboType as "snack", limit: 2 });
      if (combos.length > 0) {
        const comboLines = combos.map(c =>
          `🎁 **${c.name}** (${c.products.length} sản phẩm)\n` +
          c.products.map(p => `   • ${p.name} — $${p.price.toFixed(2)}`).join("\n") +
          `\n   💰 Giá gốc: $${c.totalPrice.toFixed(2)} → **$${c.finalPrice.toFixed(2)}** (giảm ${c.discountPct}%)\n` +
          `   💡 ${c.reason}`
        ).join("\n\n");
        return {
          response: language === "vi"
            ? `Đây là combo mình gợi ý cho bạn:\n\n${comboLines}\n\nBạn muốn thêm combo nào vào giỏ hàng?`
            : `Here are my combo suggestions:\n\n${comboLines}\n\nWould you like to add any combo to your cart?`,
          quickReplies: language === "vi"
            ? ["Combo khác", "Thêm vào giỏ", "Xem sản phẩm"]
            : ["Other combos", "Add to cart", "View products"],
        };
      }
    } catch (e) { console.error("[CHATBOT] Combo error:", e); }
  }

  // ── PRODUCT_COMPARE — so sánh sản phẩm ──
  if (intent === "PRODUCT_COMPARE") {
    try {
      const advisorResult = await getAdvisorResponse(message, undefined, language);
      if (advisorResult.comparison) {
        const comp = advisorResult.comparison;
        const compLines = comp.products.map(p =>
          `📊 **${p.name}** ($${p.price})\n` +
          `   ⭐ ${p.rating}/5 (${p.reviewCount} reviews) | 📦 ${p.soldCount} sold\n` +
          `   ✅ Mạnh: ${p.strengths.join(", ")}\n` +
          (p.weaknesses.length ? `   ⚠️ Lưu ý: ${p.weaknesses.join(", ")}\n` : "") +
          `   👤 Phù hợp: ${p.bestFor.join(", ")}`
        ).join("\n\n");
        return {
          response: `${comp.summary}\n\n${compLines}\n\n💡 ${comp.recommendation}`,
          quickReplies: language === "vi"
            ? ["Tư vấn thêm", "Xem combo", "Mua ngay"]
            : ["More advice", "View combos", "Buy now"],
        };
      }
      return { response: advisorResult.content };
    } catch (e) { console.error("[CHATBOT] Compare error:", e); }
  }

  // ── ADVISOR_REQUEST — tư vấn chuyên sâu ──
  if (intent === "ADVISOR_REQUEST") {
    try {
      const advisorResult = await getAdvisorResponse(message, undefined, language);
      let response = advisorResult.content;
      if (advisorResult.products && advisorResult.products.length > 0) {
        response += "\n\n" + (language === "vi" ? "Sản phẩm gợi ý:" : "Suggested products:");
        for (const p of advisorResult.products.slice(0, 5)) {
          response += `\n• ${p.name} — $${p.price.toFixed(2)}`;
        }
      }
      return {
        response,
        suggestions: advisorResult.products?.length ? [{
          type: "product" as const,
          items: advisorResult.products.slice(0, 5).map(p => ({
            id: p.id, name: p.name, price: p.price, slug: p.slug,
          })),
        }] : undefined,
        quickReplies: language === "vi"
          ? ["So sánh sản phẩm", "Gợi ý combo", "Mua ngay"]
          : ["Compare products", "Suggest combo", "Buy now"],
      };
    } catch (e) { console.error("[CHATBOT] Advisor error:", e); }
  }

  // PRODUCT_BENEFITS - Lợi ích sản phẩm
  if (intent === "PRODUCT_BENEFITS") {
    const keywords = trimProductQuery(message);
    const products = keywords ? await searchProducts(keywords, 5) : await getTrendingProducts(5);
    
    if (products.length > 0) {
      const _productDetails = products.slice(0, 3).map(p => ({
        name: p.name,
        price: p.price,
        description: p.description.substring(0, 150)
      }));
      
      // Search knowledge base for specific product benefits
      const knowledgeResults = await searchKnowledge(keywords, language, 3);
      
      if (knowledgeResults.length > 0) {
        const answer = knowledgeResults[0].answer;
        return {
          response: answer,
          suggestions: [formatProductSuggestions(products, language)],
          quickReplies: getQuickReplies(intent, language)
        };
      }
      
      return {
        response: language === "vi"
          ? `Về lợi ích của ${keywords || "sản phẩm này"}: Đây là sản phẩm chất lượng cao với nhiều tác dụng tốt cho sức khỏe. Bạn có thể xem chi tiết từng sản phẩm để biết thêm thông tin cụ thể.`
          : `Regarding benefits of ${keywords || "this product"}: This is a high-quality product with many health benefits. You can view each product for more specific information.`,
        suggestions: [formatProductSuggestions(products, language)],
        quickReplies: getQuickReplies(intent, language)
      };
    }
  }

  // PRODUCT_USAGE - Cách sử dụng
  if (intent === "PRODUCT_USAGE") {
    const keywords = trimProductQuery(message);
    const knowledgeResults = await searchKnowledge(keywords, language, 3);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
    
    return {
      response: language === "vi"
        ? `Cách sử dụng sẽ tùy thuộc vào từng sản phẩm cụ thể. Bạn có thể cho mình biết sản phẩm cụ thể nào bạn quan tâm không?`
        : `Usage depends on the specific product. Can you tell me which specific product you're interested in?`,
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // PRODUCT_STORAGE - Bảo quản
  if (intent === "PRODUCT_STORAGE") {
    const keywords = trimProductQuery(message);
    const knowledgeResults = await searchKnowledge(keywords, language, 3);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
  }

  // PRODUCT_NUTRITION - Dinh dưỡng
  if (intent === "PRODUCT_NUTRITION") {
    const keywords = trimProductQuery(message);
    const knowledgeResults = await searchKnowledge(keywords, language, 3);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
  }

  // PRODUCT_ORIGIN - Nguồn gốc
  if (intent === "PRODUCT_ORIGIN") {
    const keywords = trimProductQuery(message);
    const knowledgeResults = await searchKnowledge(keywords, language, 3);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
  }

  // PRODUCT_SEARCH & RECOMMENDATION_REQUEST — let GPT enhance with SQL context
  if (intent === "PRODUCT_SEARCH" || intent === "RECOMMENDATION_REQUEST") {
    const keywords = trimProductQuery(message);
    try {
      const recs = await getSmartRecommendations(keywords || message, undefined, 6);
      if (recs.products.length > 0) {
        // Build product data for GPT to use as context (not as direct response)
        const _productList = recs.products.map((p, i) =>
          `${i + 1}. ${p.name} — $${p.price}${p.salePrice ? ` (sale $${p.salePrice})` : ''} | ⭐${p.rating.toFixed(1)} | Sold: ${p.soldCount} | slug: ${p.slug}`
        ).join('\n');
        // Return empty → main flow will use GPT with buildAIContext for natural response
        // But attach product suggestions for UI
        return {
          response: "", // empty → main flow + GPT
          suggestions: [formatProductSuggestions(recs.products, language)],
          quickReplies: getQuickReplies(intent, language),
          // Store product data in a way the main flow can use (via returned empty response)
        };
      }
    } catch (recErr) {
      console.error('Smart recommendations error (non-blocking):', recErr);
    }

    // No products found → fallback categories
    const categories = await getCategories();
    const categoryList = categories.length > 0
      ? categories.slice(0, 8).map(c => c.name).join(', ')
      : language === 'vi' ? 'trà, cà phê, cá khô, gia vị, bánh kẹo' : 'tea, coffee, dried seafood, spices, snacks';
    return {
      response: language === 'vi'
        ? `Mình chưa tìm thấy sản phẩm khớp chính xác. Bạn thử xem các danh mục: ${categoryList} hoặc mô tả rõ hơn nhé!`
        : `I didn't find exact matches. Try browsing categories: ${categoryList} or describe more specifically!`,
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // PROMOTION_INQUIRY
  if (intent === "PROMOTION_INQUIRY") {
    return {
      response: language === "vi"
        ? "LIKEFOOD hiện có chương trình tích điểm thưởng cực hấp dẫn ($1 = 2 điểm) và thưởng khi giới thiệu bạn bè thành công. Bạn có thể dùng điểm để đổi các phần quà đặc biệt trong tài khoản của mình nhé!"
        : "LIKEFOOD currently offers a great Reward Point program ($1 = 2 points) and rewards for successful friend referrals. You can use your points to redeem special gifts in your account!",
      suggestions: [
        { type: "action", items: [{ id: "points", name: language === "vi" ? "Xem điểm thưởng" : "View rewards" }] }
      ],
      quickReplies: ["Cách tích điểm", "Giới thiệu bạn bè", "Xem sản phẩm"]
    };
  }

  // SHIPPING_INQUIRY
  if (intent === "SHIPPING_INQUIRY") {
    return {
      response: language === "vi"
        ? `📦 Phí giao hàng tại LIKEFOOD:\n1. Đến cửa hàng nhận: Miễn phí\n2. Tiêu chuẩn (3-5 ngày): $5.99\n3. Nhanh (1-2 ngày): $12.99\n4. Trong ngày: $24.99\nChúng mình giao hàng toàn bộ 50 bang Hoa Kỳ nhé!`
        : `📦 Shipping fees at LIKEFOOD:\n1. Store Pickup: Free\n2. Standard (3-5 days): $5.99\n3. Express (1-2 days): $12.99\n4. Same Day: $24.99\nWe ship to all 50 US states!`,
      quickReplies: ["Thời gian giao hàng", "Nhận tại cửa hàng", "Xem sản phẩm"]
    };
  }

  // ORDER_STATUS
  if (intent === "ORDER_STATUS") {
    return {
      response: language === "vi"
        ? "Để xem đơn hàng, bạn đăng nhập vào Tài khoản > Đơn hàng nhé. Ở đó bạn sẽ thấy trạng thái, mã vận đơn và chi tiết đơn hàng. Bạn có mã đơn cần mình kiểm tra không?"
        : "To check your order, sign in to Account > Orders. You'll see status, tracking code and order details. Do you have an order number you'd like me to check?",
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // GREETING
  if (intent === "GREETING") {
    const isReturning = contextSummary.messageCount > 2;
    
    return {
      response: language === "vi"
        ? isReturning
          ? "Chào bạn! Rất vui được tiếp tục hỗ trợ bạn. Bạn đang tìm gì hôm nay?"
          : "Xin chào! Mình là trợ lý mua hàng của LIKEFOOD. Bạn đang tìm đặc sản Việt, quà biếu, hay cần tư vấn gì về sản phẩm nào đó?"
        : isReturning
          ? "Hello! Nice to continue helping you. What are you looking for today?"
          : "Hello! I'm LIKEFOOD's shopping assistant. Are you looking for Vietnamese specialties, gift ideas, or need advice on any products?",
      suggestions: [
        {
          type: "category",
          items: language === "vi"
            ? [
                { id: "tra", name: "Trà & Cà phê" },
                { id: "hai_san_kho", name: "Hải sản khô" },
                { id: "gia_vi", name: "Gia vị" },
                { id: "trai_cay_say", name: "Trái cây sấy" },
              ]
            : [
                { id: "tea_coffee", name: "Tea & Coffee" },
                { id: "dried_seafood", name: "Dried Seafood" },
                { id: "spices", name: "Spices" },
                { id: "dried_fruit", name: "Dried Fruit" },
              ]
        }
      ],
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // THANKS
  if (intent === "THANKS") {
    return {
      response: language === "vi"
        ? "Không có chi! Rất vui được giúp bạn. Nếu cần gì thêm, cứ nhắn mình nhé! 😊"
        : "You're welcome! Happy to help. Feel free to message me if you need anything else! 😊",
      quickReplies: getQuickReplies("UNKNOWN", language)
    };
  }

  // COMPLAINT
  if (intent === "COMPLAINT") {
    return {
      response: language === "vi"
        ? "Mình rất xin lỗi vì trải nghiệm không tốt của bạn. Bạn có thể cho mình biết chi tiết vấn đề không? Mình sẽ cố gắng hỗ trợ và đưa ra giải pháp tốt nhất."
        : "I'm very sorry about your bad experience. Can you tell me the details of the issue? I'll try my best to help and find the best solution.",
      quickReplies: ["Liên hệ hỗ trợ", "Xem chính sách đổi trả", "Theo dõi đơn hàng"]
    };
  }

  // GIFT_IDEA
  if (intent === "GIFT_IDEA") {
    return {
      response: language === "vi"
        ? "Quà biếu ý nghĩa thì LIKEFOOD có nhiều lựa chọn tuyệt vời: Set trà + bánh, Hải sản khô cao cấp, Hộp quà Tết sang trọng. Bạn tặng cho ai và ngân sách khoảng bao nhiêu?"
        : "LIKEFOOD has wonderful gift options: Tea + cake sets, Premium dried seafood, Luxury Tet gift boxes. Who is it for and what's your budget?",
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // COMPARISON
  if (intent === "COMPARISON") {
    const keywords = trimProductQuery(message);
    const knowledgeResults = await searchKnowledge(keywords, language, 3);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
    
    return {
      response: language === "vi"
        ? "Mỗi sản phẩm đều có ưu điểm riêng. Bạn đang so sánh những sản phẩm nào? Mình sẽ giúp bạn hiểu rõ hơn!"
        : "Each product has its own advantages. Which products are you comparing? I'll help you understand better!",
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // DIET_SPECIFIC
  if (intent === "DIET_SPECIFIC") {
    const knowledgeResults = await searchKnowledge("chay gluten organic", language, 5);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
    
    return {
      response: language === "vi"
        ? "LIKEFOOD có nhiều sản phẩm phù hợp với chế độ ăn đặc biệt: trà, cà phê, gia vị, hoa quả sấy, hạt (không chất bảo quản). Bạn đang quan tâm chế độ ăn nào cụ thể?"
        : "LIKEFOOD has many products suitable for special diets: tea, coffee, spices, dried fruits, nuts (no preservatives). Which diet are you interested in?",
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // COOKING_HELP
  if (intent === "COOKING_HELP") {
    const knowledgeResults = await searchKnowledge("nấu canh chua công thức", language, 3);
    
    if (knowledgeResults.length > 0) {
      return {
        response: knowledgeResults[0].answer,
        quickReplies: getQuickReplies(intent, language)
      };
    }
    
    return {
      response: language === "vi"
        ? "Mình có thể hướng dẫn bạn chế biến nhiều món từ đặc sản Việt. Bạn muốn nấu món gì hoặc cần nguyên liệu nào?"
        : "I can guide you to cook many dishes from Vietnamese specialties. What dish do you want to make or what ingredients do you need?",
      quickReplies: getQuickReplies(intent, language)
    };
  }

  // CHITCHAT
  if (intent === "CHITCHAT") {
    if (lowerMessage.includes("ai") || lowerMessage.includes("robot") || lowerMessage.includes("bot") || lowerMessage.includes("người")) {
      return {
        response: language === "vi"
          ? "Mình là trợ lý AI của LIKEFOOD, được thiết kế để hỗ trợ bạn tìm sản phẩm, giải đáp thắc mắc và tư vấn mua hàng. Mình có thể giúp gì cho bạn?"
          : "I'm LIKEFOOD's AI assistant, designed to help you find products, answer questions and provide shopping advice. How can I help you?",
        quickReplies: getQuickReplies("GREETING", language)
      };
    }
  }

  return { response: "" };
}

export async function enhancedChat(request: ChatRequest): Promise<ChatResponse> {
  const { message, sessionId, userId } = request;
  const language = detectLanguage(message);
  const sentiment = detectSentiment(message);

  const safeFallback = (): ChatResponse => ({
    message: getSafeResponse("general_error", language),
    intent: "UNKNOWN",
    confidence: 0,
    language,
    isNewUser: true,
  });

  try {
    // Phân loại intent
    const intentResult: IntentResult = classifyIntent(message);
    const { intent, confidence, entities } = intentResult;

    // Kiểm tra session
    const isNew = await isNewSession(sessionId);
    
    // Lưu tin nhắn người dùng
    await addMessage(sessionId, "user", message, intent);

    // n8n trigger: thông báo khi có chat mới (non-blocking)
    if (isNew) {
      import("@/lib/n8n-trigger")
        .then(({ triggerLiveChatStarted }) =>
          triggerLiveChatStarted({ chatId: Date.now(), userName: userId || "Guest", message })
        )
        .catch(() => {});
    }

    // Cập nhật entities
    if (Object.keys(entities).length > 0) {
      await updateEntities(sessionId, entities);
    }

    // Lấy context
    const history = await getConversationHistory(sessionId, 5);
    const contextSummary = await getContextSummary(sessionId);
    const _fullContext = await getContext(sessionId);

    // Tìm kiếm knowledge base
    const knowledgeResults = await searchKnowledge(message, language, 3);
    const knowledgeAnswers = knowledgeResults.map(item => item.answer);

    // Xử lý intent đặc biệt
    // Handle intent — may return empty response to let GPT enhance
    const intentResponse = await handleEnhancedIntent(intent, message, language, {
      messageCount: contextSummary.messageCount,
      lastIntent: contextSummary.lastIntent,
      language: contextSummary.language,
      entities
    });

    if (intentResponse.response) {
      await addMessage(sessionId, "assistant", intentResponse.response, intent);

      return {
        message: intentResponse.response,
        intent,
        confidence,
        language,
        suggestions: intentResponse.suggestions,
        isNewUser: isNew,
        quickReplies: intentResponse.quickReplies
      };
    }

    // Đánh giá confidence
    const confidenceLevel = assessConfidence(
      intent,
      confidence,
      Object.keys(entities).length > 0,
      contextSummary.messageCount > 0
    );

    // Confidence thấp - dùng fallback
    if (confidenceLevel === "very_low" || confidenceLevel === "low") {
      const fallbackResponse = getFallbackResponse(intent, language);
      await addMessage(sessionId, "assistant", fallbackResponse, intent);

      return {
        message: fallbackResponse,
        intent,
        confidence,
        language,
        isNewUser: isNew,
        quickReplies: getQuickReplies(intent, language)
      };
    }

    // ─── AI Smart Context: Đọc data thật từ SQL (CHỈ KHI CẦN) ──
    let sqlDataContext = "";
    const dataIntents = new Set<string>([
      "PRODUCT_SEARCH", "PRODUCT_DETAILS", "PRODUCT_BENEFITS", "PRODUCT_NUTRITION",
      "PRODUCT_ORIGIN", "PRODUCT_STORAGE", "PRODUCT_USAGE",
      "RECOMMENDATION_REQUEST", "ORDER_STATUS", "SHIPPING_INQUIRY",
      "PAYMENT_HELP", "PROMOTION_INQUIRY", "GENERAL_QUESTION",
      "COMPARISON", "DIET_SPECIFIC", "GIFT_IDEA",
    ]);
    if (dataIntents.has(intent)) {
      try {
        sqlDataContext = await buildAIContext(message, userId ? Number(userId) : undefined);
      } catch (ctxErr) {
        console.error("AI context build error (non-blocking):", ctxErr);
      }
    }

    // Tìm sản phẩm liên quan cho context (skip nếu buildAIContext đã fetch)
    let productContext: { name: string; price: number; description: string }[] = [];
    if (intent === "PRODUCT_BENEFITS" && !sqlDataContext) {
      const keywords = trimProductQuery(message);
      if (keywords) {
        const recs = await getSmartRecommendations(keywords, userId ? Number(userId) : undefined, 5);
        productContext = recs.products.map(p => ({
          name: p.name,
          price: p.price,
          description: p.description
        }));
      }
    }

    // Tạo prompt cho AI — bao gồm SQL data context
    const prompt = buildEnhancedPrompt(
      message,
      history,
      language,
      intent,
      { ...contextSummary, entities },
      knowledgeResults,
      productContext.length > 0 ? productContext : undefined,
      sqlDataContext
    );

    // Gọi AI (OpenAI GPT)
    const aiResponse = await generateResponse(prompt);

    if (aiResponse) {
      // Validate response
      const validation = validateResponse(aiResponse);
      if (!validation.isValid) {
        const safeResponse = getSafeResponse("general_error", language);
        await addMessage(sessionId, "assistant", safeResponse, intent);
        return {
          message: safeResponse,
          intent,
          confidence,
          language,
          shouldEscalate: true,
          isNewUser: isNew,
        };
      }

      // Kiểm tra escalation → thông báo chủ shop qua Telegram
      const escalation = shouldEscalate(intent, confidenceLevel, sentiment === "negative" ? 1 : 0);
      if (escalation.shouldEscalate) {
        notifyOwnerNewChat(message, { sessionId, userId, language }).catch(err =>
          console.error("Owner notification error (non-blocking):", err)
        );
      }

      await addMessage(sessionId, "assistant", aiResponse, intent);

      return {
        message: aiResponse,
        intent,
        confidence,
        language,
        shouldEscalate: escalation.shouldEscalate,
        isNewUser: isNew,
        quickReplies: getQuickReplies(intent, language)
      };
    }

    // Fallback cuối cùng — thử dùng SQL data nếu GPT fail
    let finalFallback = getSafeResponse("general_error", language);
    if (intent === "PRODUCT_SEARCH" || intent === "RECOMMENDATION_REQUEST" || intent === "GENERAL_QUESTION") {
      try {
        const recs = await getSmartRecommendations(message, userId ? Number(userId) : undefined, 4);
        if (recs.products.length > 0) {
          const productList = recs.products.map((p, i) =>
            `${i + 1}. ${p.name} — $${p.price}${p.salePrice ? ` (sale $${p.salePrice})` : ''}`
          ).join('\n');
          finalFallback = language === 'vi'
            ? `Mình tạm gợi ý các sản phẩm phù hợp:\n${productList}\n\nBạn quan tâm sản phẩm nào?`
            : `Here are some matching products:\n${productList}\n\nWhich one interests you?`;
        }
      } catch { /* ignore */ }
    }
    await addMessage(sessionId, "assistant", finalFallback, intent);

    return {
      message: finalFallback,
      intent,
      confidence,
      language,
      isNewUser: isNew,
      quickReplies: getQuickReplies(intent, language)
    };
  } catch (error) {
    console.error("Enhanced AI chat error:", error);
    return safeFallback();
  }
}

// Export the main function - named export for compatibility
export { enhancedChat as chat };
// Also keep default export
export default enhancedChat;
