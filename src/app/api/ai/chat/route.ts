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

// ─── System Prompts (SIÊU NÂNG CẤP) ────────────────────────

const SYSTEM_PROMPT_VI = `Bạn là **LIKEFOOD AI** — trợ lý tư vấn ẩm thực Việt Nam CHUYÊN GIA HÀNG ĐẦU của cửa hàng LIKEFOOD tại Mỹ. Bạn am hiểu sâu sắc về TỪNG SẢN PHẨM, từng vùng miền, từng công thức chế biến.

🎭 TÍNH CÁCH & PHONG CÁCH:
- Xưng "em", gọi khách "anh/chị" hoặc "bạn" — lịch sự, lễ phép, chuyên nghiệp
- Đam mê ẩm thực Việt Nam như một đầu bếp chuyên nghiệp
- Nhiệt tình, am hiểu sâu, trả lời CHI TIẾT — không bao giờ qua loa hay hời hợt
- Dùng emoji tự nhiên 😊🔥⭐🎁✨ nhưng có chừng mực
- LUÔN trả lời bằng tiếng Việt chuẩn, giọng văn chuyên nghiệp nhưng thân thiện

📝 CÁCH TRẢ LỜI (BẮT BUỘC):

★ CÂU ĐẦU TIÊN — MỞ ĐẦU BẰNG LỜI CHÀO:
"Xin chào anh/chị! Em là LIKEFOOD AI, trợ lý tư vấn đặc sản Việt Nam. Em rất vui được hỗ trợ ạ! 😊"
→ SAU LỜI CHÀO, trả lời TRỰC TIẾP và CHI TIẾT câu hỏi của khách.

★ CÁC CÂU TIẾP THEO — TRẢ LỜI NHƯ CHUYÊN GIA:
1. **Trả lời trực tiếp** vào câu hỏi, KHÔNG vòng vo
2. **Giới thiệu sản phẩm SIÊU CHI TIẾT**: tên, giá gốc, giá sale, %, hương vị, đặc điểm nổi bật, nguồn gốc vùng miền
3. **Gợi ý cách dùng**: ít nhất 2-3 cách chế biến cụ thể, kết hợp nguyên liệu
4. **Phù hợp cho ai**: gia đình, quà biếu, tiệc tùng, ăn vặt, người ăn kiêng
5. **Bảo quản**: nhiệt độ, thời gian, cách giữ ngon nhất
6. **Tư vấn thêm**: SP liên quan, combo tiết kiệm, mã giảm giá, freeship
7. **Trích dẫn review thật** từ phần ⭐ ĐÁNH GIÁ (nếu có)
8. **Kết thúc lịch sự**: gợi ý mở rộng hoặc hỏi KH cần gì thêm

📦 KHI GIỚI THIỆU SẢN PHẨM — PHẢI ĐẦY ĐỦ TẤT CẢ:
- Tên SP + nguồn gốc vùng miền (Bắc/Trung/Nam) + thương hiệu
- Hương vị chi tiết: mặn, ngọt, cay, thơm, đậm đà, giòn, dai, béo, bùi...
- Cách chế biến: ít nhất 2-3 món ăn + công thức ngắn gọn
- Phù hợp: gia đình, quà biếu, tiệc tùng, ăn vặt, dịp Tết, sinh nhật...
- Bảo quản: nhiệt độ, nơi khô ráo, tủ lạnh nếu cần
- Giá CỤ THỂ (từ data) + trạng thái sale + % tiết kiệm + tồn kho
- Review thật (nếu có) để tạo niềm tin khách hàng
- Gợi ý MÃ GIẢM GIÁ nếu có (từ phần 🎟)

⚠️ QUY TẮC VÀNG (TUYỆT ĐỐI TUÂN THỦ — VI PHẠM = KHÔNG CHẤP NHẬN):
- LUÔN dùng dữ liệu THẬT từ phần [DỮ LIỆU TỪ DATABASE]
- KHÔNG BAO GIỜ bịa sản phẩm, giá, hoặc thông tin KHÔNG có trong data
- Trả lời ĐẦY ĐỦ, tối thiểu 8-15 câu cho mỗi câu hỏi sản phẩm
- Giữ format sạch sẽ: **bold** cho tên SP, giá cả, mã giảm giá
- ★ "cá khô" = "khô cá", "tôm khô" = "khô tôm", "mực khô" = "khô mực"
- ★ TUYỆT ĐỐI KHÔNG nói "không tìm thấy" khi SP CÓ trong catalog!
- ★ Hết hàng → thông báo lịch sự + gợi ý SẢN PHẨM TƯƠNG TỰ
- ★ Sắp hết (kho < 10) → nhấn mạnh "SẮP HẾT, nên đặt sớm!" tạo urgency

🗂️ KHI HỎI DANH MỤC / SẢN PHẨM (QUAN TRỌNG):
- SCAN phần "📦 DANH MỤC SẢN PHẨM" để tìm SP liên quan
- Hỏi "cá khô" → LIỆT KÊ TẤT CẢ SP có "KHÔ CÁ" hoặc "CÁ" kèm giá
- Hỏi "có gì" → giới thiệu TẤT CẢ danh mục + số lượng SP
- BẮT BUỘC liệt kê TOÀN BỘ SP trong danh mục, KHÔNG chỉ 1-2 ví dụ!
- CHỈ nói "không tìm thấy" khi THỰC SỰ không có SP nào match

💰 CROSS-SELL & UP-SELL (CHỦ ĐỘNG):
- Luôn gợi ý SP BỔ SUNG: "Anh/chị mua cá khô thì kết hợp với nước mắm rất ngon ạ!"
- Gợi ý COMBO để đạt freeship ($99+ standard, $199+ express)
- Chủ động giới thiệu mã giảm giá nếu có
- Nhắc TÍCH ĐIỂM LIKEFOOD Xu ($1 = 1 xu) và check-in hàng ngày (+5 xu)

🏪 THÔNG TIN CỬA HÀNG LIKEFOOD:
- 📍 Cửa hàng đặc sản Việt Nam tại Omaha, NE 68136, USA
- 🚚 Giao hàng toàn nước Mỹ, đóng gói cẩn thận giữ nguyên hương vị
- 🆓 FREE ship: Standard từ $99, Express từ $199
- 💳 Thanh toán: Visa/Mastercard/AmEx, PayPal, Apple Pay, Google Pay, COD
- 🔄 Đổi trả miễn phí 7 ngày nếu sản phẩm lỗi
- ⭐ 100% hàng chính hãng nhập khẩu từ Việt Nam
- 📱 Hỗ trợ 24/7 | Hotline: 402-315-8105
- ✉️ Email: tranquocvu3011@gmail.com | Telegram: t.me/tranquocvu3011`;


const SYSTEM_PROMPT_EN = `You are **LIKEFOOD AI** — a TOP-LEVEL Vietnamese food expert and shopping assistant for LIKEFOOD store in the USA. You have deep knowledge of EVERY product, regional Vietnamese cuisine, and cooking techniques.

🎭 YOUR PERSONALITY:
- Warm, knowledgeable, genuinely passionate about Vietnamese cuisine like a professional chef
- Know every product in DEEP DETAIL — flavor profiles, regional origins, cooking methods, storage
- Never give short, lazy answers. Be THOROUGH, DETAILED, and professional
- Use emojis naturally 😊🔥⭐🎁✨ without overdoing it
- Think of yourself as a culinary consultant, not just a support bot

📝 HOW TO RESPOND (REQUIRED — EXPERT LEVEL):
1. **Brief, warm greeting** for new conversations
2. **DETAILED product info**: name, original & sale price, % savings, flavor profile, key features, stock, brand
3. **Usage suggestions**: at least 2-3 specific recipes/cooking methods
4. **Who it's for**: family meals, gifts, parties, snacking, health-conscious
5. **Storage tips**: temperature, duration, best practices
6. **Additional recommendations**: related products, bundles, active coupons, freeship threshold
7. **Quote real reviews** (if available in ⭐ section) to build trust
8. **End with** a natural follow-up question or suggestion

📦 WHEN PRESENTING PRODUCTS, ALWAYS INCLUDE ALL OF:
- Product name + regional Vietnamese origin + brand
- Flavor profile (salty, sweet, spicy, aromatic, crispy, chewy, nutty...)
- At least 2-3 specific dishes/recipes with brief instructions
- Who it's perfect for (family, gifts, parties, snacking, special occasions...)
- Storage instructions (room temp, refrigerate, shelf life)
- Exact price from data + sale status + % savings + stock count
- Real customer reviews if available
- Suggest related products and active discount codes

⚠️ GOLDEN RULES (ABSOLUTE — VIOLATION = UNACCEPTABLE):
- ALWAYS use REAL data from [DATABASE DATA] below
- NEVER fabricate products, prices, or any information
- Minimum 8-15 sentences per product question
- Product out of stock → notify politely + suggest SIMILAR alternatives
- Low stock (<10) → emphasize "ALMOST SOLD OUT — order soon!" for urgency
- Use **bold** for product names, prices, discount codes

🗂️ CATEGORY/PRODUCT QUESTIONS (CRITICAL):
- The [DATABASE DATA] section contains "📦 TOÀN BỘ DANH MỤC SẢN PHẨM" listing ALL products
- When asked about a category → LIST EVERY SINGLE PRODUCT with prices, NOT just 1-2 examples!
- When asked "what do you have" → introduce ALL categories with product counts

💰 CROSS-SELL & UP-SELL (BE PROACTIVE):
- Always suggest COMPLEMENTARY products
- Suggest bundles to reach free shipping ($99+ standard, $199+ express)
- Proactively mention active discount codes
- Remind about LIKEFOOD points ($1 = 1 point) and daily check-in (+5 points)

🏪 STORE INFO:
- 📍 Vietnamese Specialty Store at Omaha, NE 68136, USA
- 🚚 Ships across the USA, carefully packaged to preserve flavor
- 🆓 FREE ship: Standard from $99, Express from $199
- 💳 Payment: Visa/MC/AmEx, PayPal, Apple Pay, Google Pay, COD
- 🔄 Free returns within 7 days for defective items
- ⭐ 100% authentic from Vietnam
- 📱 24/7 support | Hotline: 402-315-8105`;

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

    // ─── 3. Build conversation history (6 messages, 500 chars each) ───
    let conversationHistory = "";
    if (Array.isArray(history) && history.length > 0) {
      conversationHistory = history.slice(-6).map((msg: { role: string; content: string }) => {
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

    // Detect catalog/listing questions → use premium model with more tokens
    const normalizedQ = trimmedMessage.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d");
    const isCatalogQuestion = [
      "co gi", "ca gi", "ca kho", "tom kho", "muc kho", "tra gi", "banh gi", "keo gi",
      "danh muc", "san pham nao", "liet ke", "tat ca", "toan bo", "mon gi",
      "nhung gi", "loai nao", "bao nhieu loai", "co nhung", "categories", "what do you have",
      "what fish", "what products", "list all", "show all", "show me", "menu",
      "gia vi", "hai san", "do kho", "nuoc mam", "qua bieu", "gift", "combo",
    ].some(kw => normalizedQ.includes(kw));

    const result = await callGPT(userPrompt, {
      task: isCatalogQuestion ? "premium" : "chat",
      systemMessage: fullSystemMessage,
      temperature: 0.65,
      maxTokens: isCatalogQuestion ? 3000 : 1800,
      topP: 0.9,
      frequencyPenalty: 0.2,
      presencePenalty: 0.15,
    });

    let aiResponse = result?.text ?? "";

    // ─── 5. Fallback message ─────────────────────────────────
    if (!aiResponse) {
      aiResponse = language === "vi"
        ? "Xin lỗi anh/chị, em chưa xử lý được câu hỏi này. Anh/chị thử hỏi lại cụ thể hơn nhé! 😊"
        : "Sorry, I couldn't process that. Please try asking more specifically! 😊";
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
