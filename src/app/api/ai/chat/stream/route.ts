/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * AI Chat SSE Stream API — Real-time streaming response
 * 
 * Sử dụng Server-Sent Events (SSE) để stream AI response từng phần
 * Thay thế polling và WebSocket cho đơn giản và hiệu quả
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { trackChatbotMessage } from "@/lib/analytics/behavior";
import { applyRateLimit, apiRateLimit, getRateLimitIdentifier } from "@/lib/ratelimit";
import { buildAIContextEnhanced } from "@/lib/ai/ai-data-reader-enhanced";
import { callGPTStream } from "@/lib/ai/ai-provider";
import { detectLanguage } from "@/lib/text-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Config ──────────────────────────────────────────────────
const AI_CHAT_WINDOW_MS = 60 * 60 * 1000;
const AI_CHAT_MAX_REQUESTS = 20;

// ─── Helpers ─────────────────────────────────────────────────

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function createSSEChunk(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

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

    // ─── Build conversation history ───
    let conversationHistory = "";
    if (Array.isArray(history) && history.length > 0) {
      conversationHistory = history.slice(-8).map((msg: { role: string; content: string }) => {
        const role = msg.role === "model" ? "assistant" : msg.role;
        if (role === "user" || role === "assistant") {
          return `${role}: ${typeof msg.content === "string" ? msg.content.slice(0, 600) : ""}`;
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

          // 2. Send "typing" indicator
          controller.enqueue(encoder.encode(createSSEChunk("typing", { 
            message: language === "vi" ? "🤔 LIKEFOOD AI đang suy nghĩ..." : "🤔 LIKEFOOD AI is thinking..."
          })));

          // 3. Build enhanced context với chi tiết sản phẩm
          let sqlContext = "";
          try {
            sqlContext = await buildAIContextEnhanced(trimmedMessage, userId ? Number(userId) : undefined);
          } catch (ctxErr) {
            logger.error("[AI_CHAT_SSE] SQL context error", ctxErr as Error, { context: "ai-chat-sse" });
          }

          // 4. Build system prompt
          const systemPrompt = buildSystemPrompt(language, sqlContext, conversationHistory, trimmedMessage);

          // 5. Stream AI response
          let fullResponse = "";
          let chunkCount = 0;
          
          const streamResult = await callGPTStream(
            trimmedMessage,
            {
              systemMessage: systemPrompt,
              temperature: 0.7,
              maxTokens: 2500,
              topP: 0.9,
              frequencyPenalty: 0.1,
              presencePenalty: 0.1,
            },
            {
              onChunk: (chunk) => {
                fullResponse += chunk;
                chunkCount++;
                
                // Send chunk every 3 pieces for performance
                if (chunkCount % 3 === 0 || chunk.length < 10) {
                  controller.enqueue(encoder.encode(createSSEChunk("chunk", { 
                    content: chunk,
                    fullContent: fullResponse
                  })));
                }
              },
            }
          );

          // 6. Send final message
          controller.enqueue(encoder.encode(createSSEChunk("done", {
            response: fullResponse,
            content: fullResponse,
            role: "model",
            intent: "AI_CHAT_STREAM",
            confidence: 1,
            language,
            sessionId: chatSessionId,
            source: "chatgpt-stream",
            model: streamResult?.model ?? "gpt-4o",
            tokens: streamResult?.usage?.total_tokens,
          })));

          // 7. Analytics (non-blocking)
          trackChatbotMessage(chatSessionId, userId, trimmedMessage, "AI_CHAT_STREAM", fullResponse).catch(() => {});

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

// ─── System Prompt Builder ─────────────────────────────────

function buildSystemPrompt(
  language: "vi" | "en",
  sqlContext: string,
  conversationHistory: string,
  currentMessage: string
): string {
  const isVietnamese = language === "vi";

  const basePrompt = isVietnamese
    ? `Bạn là **LIKEFOOD AI** — chuyên gia tư vấn ẩm thực Việt Nam của cửa hàng LIKEFOOD tại Mỹ. 

🎯 PHONG CÁCH:
- Xưng "em", gọi khách "anh/chị" — lịch sự, chuyên nghiệp, ấm áp
- Am hiểu sâu về TỪNG SẢN PHẨM: nguồn gốc, vùng miền, hương vị, cách chế biến, bảo quản
- Trả lời CHI TIẾT, KHÔNG qua loa — như một đầu bếp chuyên nghiệp tư vấn cho khách

📝 KHI TRẢ LỜI VỀ SẢN PHẨM — BẮT BUỘC phải có:
1. **Tên sản phẩm + Nguồn gốc vùng miền** (Bắc/Trung/Nam Việt Nam)
2. **Hương vị chi tiết**: mặn, ngọt, cay, thơm, đậm đà, giòn, dai, béo, bùi...
3. **Cách chế biến**: ít nhất 2-3 món ăn cụ thể + công thức ngắn gọn
4. **Giá cả**: giá gốc, giá sale (nếu có), % tiết kiệm
5. **Tồn kho**: còn hàng / sắp hết / hết hàng
6. **Review từ khách hàng** (nếu có trong dữ liệu)
7. **Sản phẩm bổ sung gợi ý**: để đạt freeship, combo tiết kiệm
8. **Mã giảm giá** hiện có (nếu có)

⚠️ QUY TẮC:
- LUÔN dùng dữ liệu THẬT từ phần [DATABASE]
- KHÔNG bịa đặt thông tin sản phẩm, giá cả
- Sản phẩm hết hàng → gợi ý sản phẩm TƯƠNG TỰ
- Sắp hết (kho < 10) → nhấn mạnh "NÊN ĐẶT SỚM!" tạo urgency
- Dùng **bold** cho tên sản phẩm, giá cả, mã giảm giá`
    : `You are **LIKEFOOD AI** — Vietnamese food expert and shopping assistant for LIKEFOOD store in the USA.

🎯 STYLE:
- Professional, warm, knowledgeable like a professional chef
- Deep knowledge of EVERY product: origin, regional specifics, flavor profile, cooking methods, storage

📝 WHEN ANSWERING ABOUT PRODUCTS — MUST INCLUDE:
1. **Product name + Vietnamese regional origin** (Northern/Central/Southern Vietnam)
2. **Detailed flavor**: salty, sweet, spicy, aromatic, rich, crispy, chewy, nutty...
3. **Cooking methods**: at least 2-3 specific dishes with brief recipes
4. **Pricing**: original price, sale price (if any), % savings
5. **Stock status**: in stock / low stock / out of stock
6. **Customer reviews** (if available in data)
7. **Suggested complementary products**: to reach freeship, combo savings
8. **Active discount codes** (if any)

⚠️ RULES:
- ALWAYS use REAL data from [DATABASE]
- NEVER fabricate product info or prices
- Out of stock → suggest SIMILAR alternatives
- Low stock (<10) → emphasize "ORDER SOON!" for urgency
- Use **bold** for product names, prices, discount codes`;

  const historySection = conversationHistory
    ? `\n\n📜 CONVERSATION HISTORY:\n${conversationHistory}`
    : "\n\n📜 This is the START of a new conversation.";

  const databaseSection = `\n\n[DATABASE - USE THIS REAL DATA]\n${sqlContext || "(No data available)"}`;

  const currentQuestion = `\n\n💬 CUSTOMER QUESTION: ${currentMessage}`;

  const instruction = isVietnamese
    ? `\n\n📋 INSTRUCTIONS:
- Trả lời TRỰC TIẾP, CHI TIẾT vào câu hỏi
- Tối thiểu 5-10 câu cho mỗi câu hỏi về sản phẩm
- Kết thúc bằng câu hỏi mở để tiếp tục cuộc trò chuyện`
    : `\n\n📋 INSTRUCTIONS:
- Answer DIRECTLY and DETAILED to the question
- Minimum 5-10 sentences for product-related questions
- End with an open-ended question to continue the conversation`;

  return [basePrompt, historySection, databaseSection, currentQuestion, instruction].join("");
}
