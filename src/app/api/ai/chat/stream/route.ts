/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AI Chat SSE Stream API — OPTIMIZED VERSION
 * 
 * TỐI ƯU CHO:
 * - Latency thấp nhất (parallel queries, early response)
 * - Data đầy đủ nhất (products, orders, reviews, blog, etc.)
 * - Streaming real-time cho UX mượt mà
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { trackChatbotMessage } from "@/lib/analytics/behavior";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { buildUltimateAIContext } from "@/lib/ai/ultimate-data-reader";
import { callGPTStream } from "@/lib/ai/ai-provider";
import { detectLanguage } from "@/lib/text-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Config ──────────────────────────────────────────────────
const AI_CHAT_WINDOW_MS = 60 * 60 * 1000;
const AI_CHAT_MAX_REQUESTS = 25;

// ─── Helpers ─────────────────────────────────────────────────

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function createSSEChunk(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Main POST Handler ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let chatSessionId = generateSessionId();

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, apiRateLimit, {
      windowMs: AI_CHAT_WINDOW_MS,
      maxRequests: AI_CHAT_MAX_REQUESTS,
    });

    if (!rateLimitResult.success) {
      return new NextResponse(
        createSSEChunk("error", { message: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { message, sessionId, userId, messages, history } = body ?? {};

    let chatMessage = message;
    chatSessionId = typeof sessionId === "string" && sessionId.trim() 
      ? sessionId.trim() 
      : generateSessionId();

    if (!chatMessage && Array.isArray(messages) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      chatMessage = typeof lastMessage?.content === "string" ? lastMessage.content.trim() : "";
    }

    if (typeof chatMessage !== "string" || !chatMessage.trim()) {
      return new NextResponse(
        createSSEChunk("error", { message: "Invalid message." }),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const trimmedMessage = chatMessage.trim();
    if (trimmedMessage.length > 2000) {
      return new NextResponse(
        createSSEChunk("error", { message: "Tin nhắn không được quá 2000 ký tự." }),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const language = detectLanguage(trimmedMessage);

    // Build conversation history
    let conversationHistory = "";
    if (Array.isArray(history) && history.length > 0) {
      conversationHistory = history.slice(-10).map((msg: { role: string; content: string }) => {
        const role = msg.role === "model" ? "assistant" : msg.role;
        if (role === "user" || role === "assistant") {
          return `${role}: ${typeof msg.content === "string" ? msg.content.slice(0, 800) : ""}`;
        }
        return "";
      }).filter(Boolean).join("\n");
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Send session info
          controller.enqueue(encoder.encode(createSSEChunk("session", { sessionId: chatSessionId })));

          // 2. Send "thinking" indicator
          const thinkingMsg = language === "vi" 
            ? "🤔 LIKEFOOD AI đang tìm kiếm thông tin..." 
            : "🔍 LIKEFOOD AI is searching for information...";
          controller.enqueue(encoder.encode(createSSEChunk("thinking", { message: thinkingMsg })));

          // 3. Build ULTIMATE context với tất cả data (parallel fetch)
          let sqlContext = "";
          try {
            const contextStart = Date.now();
            sqlContext = await buildUltimateAIContext(trimmedMessage, userId ? Number(userId) : undefined);
            logger.info(`[AI_CHAT] Context built in ${Date.now() - contextStart}ms`);
          } catch (ctxErr) {
            logger.error("[AI_CHAT_SSE] SQL context error", ctxErr as Error, { context: "ai-chat-sse" });
          }

          // 4. Build optimized system prompt
          const systemPrompt = buildUltimatePrompt(language, sqlContext, conversationHistory, trimmedMessage);

          // 5. Stream AI response
          let fullResponse = "";
          let chunkCount = 0;
          
          const streamResult = await callGPTStream(
            trimmedMessage,
            {
              systemMessage: systemPrompt,
              temperature: 0.7,
              maxTokens: 3000,
              topP: 0.9,
              frequencyPenalty: 0.1,
              presencePenalty: 0.1,
            },
            (chunk) => {
              fullResponse += chunk;
              chunkCount++;
              
              // Send chunk every 2 pieces for smooth streaming
              if (chunkCount % 2 === 0 || chunk.length < 15) {
                controller.enqueue(encoder.encode(createSSEChunk("chunk", { 
                  content: chunk,
                  fullContent: fullResponse
                })));
              }
            }
          );

          // 6. Send final complete message
          controller.enqueue(encoder.encode(createSSEChunk("done", {
            response: fullResponse,
            content: fullResponse,
            role: "model",
            intent: "AI_CHAT_ULTIMATE",
            confidence: 1,
            language,
            sessionId: chatSessionId,
            source: "chatgpt-ultimate",
            model: streamResult?.model ?? "gpt-4o",
            tokens: streamResult?.usage?.total_tokens,
            latencyMs: Date.now() - startTime,
          })));

          // 7. Analytics (non-blocking)
          trackChatbotMessage(chatSessionId, userId, trimmedMessage, "AI_CHAT_ULTIMATE", fullResponse).catch(() => {});

          logger.info(`[AI_CHAT] Complete in ${Date.now() - startTime}ms`);

        } catch (error) {
          logger.error("[AI_CHAT_SSE] Stream error", error as Error, { context: "ai-chat-sse" });
          controller.enqueue(encoder.encode(createSSEChunk("error", {
            message: language === "vi" 
              ? "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau nhé!" 
              : "Sorry, an error occurred. Please try again later!",
          })));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (error) {
    logger.error("[AI_CHAT_SSE] Critical error", error as Error, { context: "ai-chat-sse" });
    return new NextResponse(
      createSSEChunk("error", { 
        message: "Mình đang xử lý, bạn thử gửi lại nhé! 😊" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}

// ─── Ultimate System Prompt Builder ─────────────────────────────────

function buildUltimatePrompt(
  language: "vi" | "en",
  sqlContext: string,
  conversationHistory: string,
  currentMessage: string
): string {
  const isVietnamese = language === "vi";

  const basePrompt = isVietnamese
    ? `Bạn là **LIKEFOOD AI** — chuyên gia tư vấn ẨM THỰC VIỆT NAM hàng đầu của cửa hàng LIKEFOOD tại Mỹ.

🎯 PHONG CÁCH LÀM VIỆC:
- Xưng "em" với khách, gọi "anh/chị" — lịch sự, chuyên nghiệp, ấm áp
- NHƯ MỘT ĐẦU BẾP CHUYÊN NGHIỆP: am hiểu sâu về TỪNG SẢN PHẨM, vùng miền, công thức, cách chế biến
- TRẢ LỜI CHI TIẾT NHẤT: không được qua loa, phải đầy đủ thông tin

📝 KHI TRẢ LỜI VỀ BẤT KỲ SẢN PHẨM NÀO — PHẢI CÓ TẤT CẢ:
1. **Tên sản phẩm + Nguồn gốc vùng miền** (Việt Nam: Bắc/Trung/Nam)
2. **Hương vị chi tiết**: mặn/ngọt/cay/thơm/đậm đà/giòn/dai/béo/bùi...
3. **Cách chế biến**: ít nhất 2-3 món ăn cụ thể + công thức ngắn
4. **Giá cả**: giá gốc, giá sale, % tiết kiệm
5. **Tồn kho**: còn bao nhiêu, có hàng không
6. **Đánh giá khách hàng**: star rating, review thật
7. **Sản phẩm đi kèm gợi ý**: để đạt freeship, combo tiết kiệm
8. **Mã giảm giá** hiện có
9. **Chính sách**: giao hàng, đổi trả, bảo hành

⚠️ QUY TẮC VÀNG:
- LUÔN dùng dữ liệu THẬT từ phần [DATABASE]
- KHÔNG bịa đặt thông tin — có là có, không là không
- Sản phẩm hết hàng → phải gợi ý sản phẩm TƯƠNG TỰ
- Sắp hết (kho < 10) → nói "NÊN ĐẶT SỚM!"
- Dùng **bold** cho tên SP, giá, mã giảm giá
- Kết thúc bằng câu hỏi mở để tiếp tục trò chuyện`
    : `You are **LIKEFOOD AI** — TOP Vietnamese food expert for LIKEFOOD store in the USA.

🎯 WORK STYLE:
- Professional, warm, knowledgeable like a professional chef
- Answer COMPREHENSIVELY — no short answers allowed

📝 WHEN ANSWERING ABOUT ANY PRODUCT — MUST INCLUDE ALL:
1. **Product name + Vietnamese regional origin**
2. **Detailed flavor profile**: salty/sweet/spicy/aromatic/rich/crispy/chewy/nutty...
3. **Cooking methods**: at least 2-3 specific dishes with brief recipes
4. **Pricing**: original price, sale price, % savings
5. **Stock**: how many left, available or not
6. **Customer reviews**: star rating, real reviews
7. **Complementary products**: to reach freeship, combo savings
8. **Discount codes** currently active
9. **Policies**: shipping, returns, warranty

⚠️ GOLDEN RULES:
- ALWAYS use REAL data from [DATABASE]
- NEVER fabricate information
- Out of stock → suggest SIMILAR alternatives
- Low stock (<10) → say "ORDER SOON!"
- Use **bold** for product names, prices, discount codes
- End with open-ended question`;

  const historySection = conversationHistory
    ? `\n\n📜 CONVERSATION HISTORY:\n${conversationHistory}`
    : "\n\n📜 This is a NEW conversation.";

  const databaseSection = `\n\n[📦 DATABASE - USE THIS REAL DATA]\n${sqlContext || "(No data available)"}`;

  const currentQuestion = `\n\n💬 CUSTOMER QUESTION: ${currentMessage}`;

  const finalInstruction = isVietnamese
    ? `\n\n📋 HƯỚNG DẪN TRẢ LỜI:
- TRẢ LỜI TRỰC TIẾP, CHI TIẾT vào câu hỏi
- Tối thiểu 8-15 câu cho mỗi câu hỏi về sản phẩm
- Mỗi sản phẩm phải có: tên + giá + nguồn gốc + hương vị + cách dùng + đánh giá
- Gợi ý sản phẩm bổ sung, mã giảm giá, freeship
- Kết thúc bằng câu hỏi mở để tiếp tục trò chuyện`
    : `\n\n📋 ANSWERING INSTRUCTIONS:
- Answer DIRECTLY and COMPREHENSIVELY
- Minimum 8-15 sentences for product questions
- Each product must have: name + price + origin + flavor + usage + reviews
- Suggest complementary products, discount codes, freeship
- End with open-ended question`;

  return [basePrompt, historySection, databaseSection, currentQuestion, finalInstruction].join("");
}
