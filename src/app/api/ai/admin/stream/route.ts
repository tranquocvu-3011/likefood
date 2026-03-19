/**
 * LIKEFOOD - Admin AI Chat SSE Stream
 * Streaming endpoint cho admin AI chat — response real-time
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { callGPTStream } from "@/lib/ai/ai-provider";
import { buildAdminAIContext } from "@/lib/ai/admin-data-aggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createSSEChunk(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

function detectLanguage(text: string): "vi" | "en" {
  const viPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return viPattern.test(text) ? "vi" : "en";
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check — admin only
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new Response(
        createSSEChunk("error", { message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = body?.message;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        createSSEChunk("error", { message: "Message is required." }),
        { status: 400, headers: { "Content-Type": "text/event-stream" } }
      );
    }

    if (message.length > 3000) {
      return new Response(
        createSSEChunk("error", { message: "Message quá dài (max 3000 ký tự)." }),
        { status: 400, headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const trimmedMessage = message.trim();
    const language = detectLanguage(trimmedMessage);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Thinking indicator
          controller.enqueue(encoder.encode(createSSEChunk("thinking", {
            message: "🧠 Đang phân tích dữ liệu từ database..."
          })));

          // 2. Build admin context from REAL database
          let adminContext = "";
          try {
            const ctxStart = Date.now();
            adminContext = await buildAdminAIContext(trimmedMessage);
            logger.info(`[ADMIN_AI_STREAM] Context built in ${Date.now() - ctxStart}ms`);
          } catch (ctxErr) {
            logger.error("[ADMIN_AI_STREAM] Context error", ctxErr as Error);
          }

          // 3. Build system prompt
          const systemPrompt = buildAdminStreamPrompt(language, adminContext, trimmedMessage);

          // 4. Stream AI response
          let fullResponse = "";

          const streamResult = await callGPTStream(
            trimmedMessage,
            {
              systemMessage: systemPrompt,
              temperature: 0.7,
              maxTokens: 4000,
              topP: 0.9,
              frequencyPenalty: 0.1,
              presencePenalty: 0.1,
            },
            {
              onChunk: (chunk) => {
                fullResponse += chunk;
                controller.enqueue(encoder.encode(createSSEChunk("chunk", {
                  content: fullResponse
                })));
              },
            }
          );

          // 5. Done
          controller.enqueue(encoder.encode(createSSEChunk("done", {
            content: fullResponse,
            model: streamResult?.model ?? "gpt-4o",
            tokens: streamResult?.usage?.total_tokens,
            latencyMs: Date.now() - startTime,
          })));

          logger.info(`[ADMIN_AI_STREAM] Complete in ${Date.now() - startTime}ms`);
        } catch (error) {
          logger.error("[ADMIN_AI_STREAM] Stream error", error as Error);
          controller.enqueue(encoder.encode(createSSEChunk("error", {
            message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!"
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
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    logger.error("[ADMIN_AI_STREAM] Critical error", error as Error);
    return new Response(
      createSSEChunk("error", { message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }
}

// ─── Admin System Prompt ────────────────────────────────────────────

function buildAdminStreamPrompt(
  language: "vi" | "en",
  adminContext: string,
  currentMessage: string
): string {
  const isVi = language === "vi";

  const base = isVi
    ? `Bạn là **LIKEFOOD AI COMMAND CENTER** — trợ lý tối cao cho quản trị viên cửa hàng LIKEFOOD (likefood.app).
Bạn có quyền truy cập DỮ LIỆU THẬT từ MySQL database.

🎯 NĂNG LỰC:
• Business Intelligence: doanh thu, đơn hàng, tăng trưởng, AOV, conversion rate
• Product Intelligence: bestsellers, slow movers, tồn kho, cần nhập hàng
• Customer Intelligence: phân khúc VIP/Premium/New, churn risk, lifetime value
• Behavior Intelligence: funnel conversion, search queries, top pages, bounce rate
• Marketing Intelligence: coupon performance, flash sale, email campaign
• SEO Intelligence: metadata quality, keywords, content gaps
• Website Health: nội dung, cấu trúc, đề xuất cải thiện

📋 FORMAT INSIGHTS:
📊 Vấn đề → 🔍 Phân tích → 💡 Đề xuất → ⚡ Mức ưu tiên (Cao/Trung/Thấp)

⚠️ QUY TẮC:
• LUÔN dùng dữ liệu THẬT từ phần [DATABASE] bên dưới
• KHÔNG bịa số liệu — có là có, không là không
• Phân biệt rõ: [DỮ LIỆU THỰC] vs [SUY LUẬN] vs [CẦN XÁC MINH]
• Kết thúc bằng 2-3 RECOMMENDED NEXT STEPS cụ thể, khả thi
• Trả lời chi tiết, chuyên sâu — không sơ sài`
    : `You are **LIKEFOOD AI COMMAND CENTER** — the ultimate assistant for LIKEFOOD store admins (likefood.app).
You have access to REAL data from MySQL database.

🎯 CAPABILITIES:
• Business Intelligence: revenue, orders, growth, AOV, conversion rate
• Product Intelligence: bestsellers, slow movers, inventory, restock alerts
• Customer Intelligence: VIP/Premium/New segments, churn risk, lifetime value
• Behavior Intelligence: funnel conversion, search queries, top pages, bounce rate
• Marketing Intelligence: coupon performance, flash sale, email campaigns
• SEO Intelligence: metadata quality, keywords, content gaps
• Website Health: content, structure, improvement suggestions

📋 INSIGHT FORMAT:
📊 Issue → 🔍 Analysis → 💡 Suggestion → ⚡ Priority (High/Medium/Low)

⚠️ RULES:
• ALWAYS use REAL data from [DATABASE] section below
• NEVER fabricate numbers
• Distinguish: [REAL DATA] vs [INFERENCE] vs [NEEDS VERIFICATION]
• End with 2-3 specific RECOMMENDED NEXT STEPS
• Provide detailed, expert-level analysis`;

  const dbSection = `\n\n━━━ DỮ LIỆU WEBSITE (QUERY TỪ MYSQL DATABASE) ━━━\n${adminContext || "(No data available)"}`;

  const question = `\n\n💬 YÊU CẦU ADMIN: ${currentMessage}`;

  return [base, dbSection, question].join("");
}
