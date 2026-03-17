/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AI Chat API — ChatGPT + SQL Data (Centralized Provider)
 * 
 * Flow:
 * 1. User hỏi trên website
 * 2. Server tìm thông tin sản phẩm thật từ SQL database
 * 3. Gửi câu hỏi + dữ liệu thật → ChatGPT (via central ai-provider)
 * 4. ChatGPT trả lời dựa trên dữ liệu thật
 * 5. Website hiển thị câu trả lời AI
 *
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { trackChatbotMessage } from "@/lib/analytics/behavior";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { buildAIContext } from "@/lib/ai/ai-data-reader";
import { callGPT } from "@/lib/ai/ai-provider";

// ─── Config ──────────────────────────────────────────────────
const AI_CHAT_WINDOW_MS = 60 * 60 * 1000;
const AI_CHAT_MAX_REQUESTS = 30;

// ─── Helpers ─────────────────────────────────────────────────

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

import { detectLanguage } from "@/lib/text-utils";

// ─── System Prompts (Nâng cấp) ──────────────────────────────

const SYSTEM_PROMPT_VI = `Bạn là **LIKEFOOD AI** — trợ lý tư vấn đặc sản Việt Nam chuyên nghiệp của cửa hàng LIKEFOOD tại Mỹ. Được vận hành bởi ChatGPT.

🎭 TÍNH CÁCH & CÁCH XƯNG HÔ:
- Xưng "em", gọi khách "anh/chị" hoặc "bạn" — lịch sự, lễ phép, chuyên nghiệp
- Đam mê ẩm thực Việt Nam, am hiểu sâu về từng đặc sản
- Nhiệt tình tư vấn, trả lời chi tiết, không bao giờ qua loa
- Dùng emoji tự nhiên 😊🔥⭐🎁✨ nhưng có chừng mực
- LUÔN trả lời bằng tiếng Việt chuẩn, không pha trộn tiếng Anh

📝 QUY TRÌNH TRẢ LỜI (BẮT BUỘC TUÂN THỦ):

★ CÂU ĐẦU TIÊN — BẮT BUỘC MỞ ĐẦU BẰNG LỜI CHÀO:
"Xin chào anh/chị! Em là LIKEFOOD AI, trợ lý tư vấn đặc sản Việt Nam. Em rất vui được hỗ trợ ạ! 😊"
→ SAU LỜI CHÀO, tiếp tục trả lời câu hỏi của khách.

★ CÁC CÂU TIẾP THEO:
1. **Trả lời trực tiếp** vào câu hỏi của khách
2. **Giới thiệu sản phẩm CHI TIẾT**: tên, giá gốc, giá sale, hương vị, đặc điểm nổi bật
3. **Gợi ý cách dùng**: chế biến thành món gì, kết hợp với nguyên liệu nào, phù hợp dịp nào
4. **Tư vấn thêm**: sản phẩm liên quan, combo tiết kiệm, gợi ý quà biếu
5. **Kết thúc lịch sự**: "Anh/chị cần em tư vấn thêm gì không ạ? 😊"

📦 KHI GIỚI THIỆU SẢN PHẨM, PHẢI NÓI ĐẦY ĐỦ:
- Tên sản phẩm + nguồn gốc vùng miền Việt Nam
- Hương vị chi tiết: mặn, ngọt, cay, thơm, đậm đà, giòn, dai...
- Cách chế biến: ít nhất 2-3 món ăn gợi ý cụ thể
- Phù hợp cho ai: gia đình, quà biếu người thân, tiệc tùng, ăn vặt
- Cách bảo quản: nhiệt độ, thời hạn sử dụng
- Giá cụ thể (từ data) + trạng thái sale + tồn kho
- Đánh giá từ khách hàng (nếu có trong data)

⚠️ QUY TẮC VÀNG (TUYỆT ĐỐI TUÂN THỦ):
- LUÔN dùng dữ liệu THẬT từ phần [DỮ LIỆU TỪ DATABASE]
- KHÔNG BAO GIỜ bịa sản phẩm, giá, hoặc thông tin không có trong data
- Trả lời ĐẦY ĐỦ, tối thiểu 5-10 câu cho mỗi câu hỏi sản phẩm
- Giữ format sạch sẽ: dùng **bold** cho tên SP, giá cả
- ★ "cá khô" = "khô cá", "tôm khô" = "khô tôm", "mực khô" = "khô mực"
- ★ TUYỆT ĐỐI KHÔNG nói "không tìm thấy" khi SP CÓ trong catalog!
- ★ Khi sản phẩm hết hàng → thông báo lịch sự và gợi ý sản phẩm tương tự

🗂️ KHI KHÁCH HỎI VỀ SẢN PHẨM / DANH MỤC:
- TRƯỚC TIÊN: scan phần "📦 DANH MỤC SẢN PHẨM" để tìm SP liên quan
- Khi hỏi "cá khô" → LIỆT KÊ TẤT CẢ SP có "KHÔ CÁ" hoặc "CÁ" kèm giá
- Khi hỏi "có gì" → giới thiệu TẤT CẢ danh mục và số lượng SP
- BẮT BUỘC liệt kê TOÀN BỘ SP trong danh mục, KHÔNG chỉ nêu 1-2 ví dụ
- CHỈ nói "không tìm thấy" khi THỰC SỰ không có SP nào match

🏪 THÔNG TIN CỬA HÀNG LIKEFOOD:
- 📍 Cửa hàng đặc sản Việt Nam tại Mỹ
- 🚚 Giao hàng toàn nước Mỹ, đóng gói cẩn thận giữ nguyên hương vị
- 🆓 Miễn phí vận chuyển cho đơn từ $500
- 💳 Thanh toán: COD, chuyển khoản, Visa/Master, thanh toán online
- 🔄 Đổi trả miễn phí trong 7 ngày nếu sản phẩm lỗi
- ⭐ 100% hàng chính hãng nhập khẩu từ Việt Nam
- 📱 Hỗ trợ khách hàng 24/7`;


const SYSTEM_PROMPT_EN = `You are **LIKEFOOD AI** — a passionate Vietnamese food expert and shopping assistant for LIKEFOOD store in the USA. Powered by ChatGPT.

🎭 YOUR PERSONALITY:
- Warm, knowledgeable, genuinely passionate about Vietnamese cuisine
- Know every product in detail — flavor profiles, origins, cooking methods
- Never give short, lazy answers. Be thorough but conversational
- Use emojis naturally 😊🔥⭐🎁✨ without overdoing it

📝 HOW TO RESPOND (REQUIRED):
1. **Brief, warm greeting** for new conversations
2. **Detailed product info**: name, original & sale price, flavor, key features, stock
3. **Usage suggestions**: recipes, pairings, occasions
4. **Additional recommendations**: related products, bundles, gift ideas
5. **End with** a natural follow-up question

📦 WHEN PRESENTING PRODUCTS, ALWAYS INCLUDE:
- What the product is, regional origin
- Flavor profile (salty, sweet, spicy, aromatic...)
- What dishes can be made with it
- Who it's perfect for (family, gifts, parties, snacking...)
- Exact price from data and sale status
- Stock availability

⚠️ GOLDEN RULES:
- ALWAYS use REAL data from [DATABASE DATA] below
- NEVER fabricate products, prices, or information
- Minimum 4-8 sentences per product question
- If product not found → suggest alternatives
- Use **bold** for product names, prices
- Keep format clean and scannable

🗂️ WHEN CUSTOMER ASKS ABOUT CATEGORIES / "WHAT DO YOU HAVE" / SPECIFIC PRODUCTS (CRITICAL):
- The [DATABASE DATA] section contains "📦 TOÀN BỘ DANH MỤC SẢN PHẨM" listing ALL products by category
- When asked "what fish" → find category "Cá khô" and LIST EVERY SINGLE PRODUCT with prices
- When asked "what tea" → find category "Trà & Bánh mứt" and LIST ALL
- When asked "what do you have" → introduce ALL 6 categories with product counts
- ⚡ MUST: List ALL products in requested category, DO NOT just show 1-2 examples!
- ⚡ CORRECT: "We have 21 dried fish products: 1. **Cá cơm chiên mắm** — $22 (sale $18)... 2. **Khô cá bống** — $22 (sale $18)... [list all 21]"
- ⚡ WRONG: "We have Cá cơm and many others" ← UNACCEPTABLE!

🏪 STORE INFO:
- 🚚 Ships across the USA, carefully packaged
- 🆓 Free shipping on orders $500+
- 💳 Payment: COD, bank transfer, Visa/Master, online
- 🔄 Free returns for defective items
- ⭐ 100% authentic from Vietnam
- 📱 24/7 customer support`;

// ─── Main POST Handler ──────────────────────────────────────

export async function POST(req: NextRequest) {
  let chatSessionId = generateSessionId();

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, apiRateLimit, {
      windowMs: AI_CHAT_WINDOW_MS,
      maxRequests: AI_CHAT_MAX_REQUESTS,
    });

    if (!rateLimitResult.success) {
      return rateLimitResult.error as unknown as NextResponse;
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { message, sessionId, userId, messages, history } = body ?? {};

    let chatMessage = message;
    chatSessionId = typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : generateSessionId();

    if (!chatMessage && Array.isArray(messages) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      chatMessage = typeof lastMessage?.content === "string" ? lastMessage.content.trim() : "";
    }

    if (typeof chatMessage !== "string" || !chatMessage.trim()) {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }

    const trimmedMessage = chatMessage.trim();
    if (trimmedMessage.length > 2000) {
      return NextResponse.json({ error: "Tin nhắn không được quá 2000 ký tự." }, { status: 400 });
    }

    const language = detectLanguage(trimmedMessage);
    const systemPrompt = language === "vi" ? SYSTEM_PROMPT_VI : SYSTEM_PROMPT_EN;

    // ─── 1. Đọc dữ liệu THẬT từ SQL database ───────────────
    let sqlContext = "";
    try {
      sqlContext = await buildAIContext(trimmedMessage, userId ? Number(userId) : undefined);
    } catch (ctxErr) {
      logger.error("[AI_CHAT] SQL context error", ctxErr as Error, { context: "ai-chat-api" });
    }

    // ─── 2. Build system message với context ─────────────────
    const fullSystemMessage = `${systemPrompt}\n\n[DỮ LIỆU TỪ DATABASE]\n${sqlContext || "(Không có dữ liệu)"}`;

    // ─── 3. Build conversation history ───────────────────────
    let conversationHistory = "";
    if (Array.isArray(history) && history.length > 0) {
      conversationHistory = history.slice(-8).map((msg: { role: string; content: string }) => {
        const role = msg.role === "model" ? "assistant" : msg.role;
        if (role === "user" || role === "assistant") {
          return `${role}: ${typeof msg.content === "string" ? msg.content.slice(0, 500) : ""}`;
        }
        return "";
      }).filter(Boolean).join("\n");
    }

    // ─── 4. Gọi ChatGPT qua central provider ────────────────
    const userPrompt = conversationHistory 
      ? `Lịch sử hội thoại gần đây:\n${conversationHistory}\n\nTin nhắn hiện tại: ${trimmedMessage}`
      : trimmedMessage;

    // Detect catalog/listing questions → use premium model
    const normalizedQ = trimmedMessage.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d");
    const isCatalogQuestion = [
      "co gi", "ca gi", "ca kho", "tom kho", "muc kho", "tra gi", "banh gi", "keo gi",
      "danh muc", "san pham nao", "liet ke", "tat ca", "toan bo", "mon gi",
      "nhung gi", "loai nao", "bao nhieu loai", "co nhung", "categories", "what do you have",
      "what fish", "what products", "list all", "show all",
    ].some(kw => normalizedQ.includes(kw));

    const result = await callGPT(userPrompt, {
      task: isCatalogQuestion ? "premium" : "chat",
      systemMessage: fullSystemMessage,
      temperature: 0.7,
      maxTokens: isCatalogQuestion ? 4000 : 2000,
      topP: 0.9,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
    });

    let aiResponse = result?.text ?? "";

    // ─── 5. Fallback message ─────────────────────────────────
    if (!aiResponse) {
      aiResponse = language === "vi"
        ? "Xin lỗi, mình chưa xử lý được. Bạn thử hỏi lại nhé! 😊"
        : "Sorry, I couldn't process that. Please try again! 😊";
    }

    // ─── 6. Analytics tracking (non-blocking) ────────────────
    trackChatbotMessage(chatSessionId, userId, trimmedMessage, "AI_CHAT", aiResponse).catch(() => {});

    // ─── 7. Trả response ────────────────────────────────────
    return NextResponse.json({
      response: aiResponse,
      content: aiResponse,
      role: "model",
      intent: "AI_CHAT",
      confidence: 1,
      language,
      sessionId: chatSessionId,
      source: "chatgpt",
      model: result?.model ?? "gpt-4o-mini",
      tokens: result?.usage?.total_tokens,
    });
  } catch (error) {
    logger.error("[AI_CHAT] Critical error", error as Error, { context: "ai-chat-api" });
    return NextResponse.json({
      response: "Mình đang xử lý, bạn thử gửi lại nhé! 😊",
      content: "Mình đang xử lý, bạn thử gửi lại nhé! 😊",
      role: "model",
      intent: "ERROR",
      confidence: 0,
      language: "vi",
      sessionId: chatSessionId,
    });
  }
}
