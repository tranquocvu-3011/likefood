/**
 * LIKEFOOD — n8n Event Trigger
 * ─────────────────────────────
 * Utility để LIKEFOOD gửi events tới n8n workflows.
 * Gọi hàm này khi có sự kiện cần trigger n8n xử lý.
 *
 * Ví dụ:
 *   await triggerN8N("order-created", { orderId: 123, total: 150 });
 *
 * Copyright (c) 2026 LIKEFOOD Team
 */

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.likefood.app";
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || "n8n_webhook_secret_likefood_2026";

export interface N8NTriggerResult {
  success: boolean;
  error?: string;
}

/**
 * Gửi event tới n8n webhook.
 * Non-blocking: lỗi sẽ log chứ không throw.
 */
export async function triggerN8N(
  event: string,
  data: Record<string, unknown>
): Promise<N8NTriggerResult> {
  const webhookUrl = `${N8N_BASE_URL}/webhook/${event}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        source: "likefood-app",
        data,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      console.warn(`[N8N_TRIGGER] ⚠️ ${event}: HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    console.log(`[N8N_TRIGGER] ✅ ${event} sent successfully`);
    return { success: true };
  } catch (error) {
    // Non-blocking: n8n down → app vẫn chạy bình thường
    console.warn(`[N8N_TRIGGER] ⚠️ ${event} failed (n8n may be offline):`, 
      error instanceof Error ? error.message : "Unknown"
    );
    return { success: false, error: error instanceof Error ? error.message : "Unknown" };
  }
}

// ─── Pre-built Event Triggers ────────────────────────────────

/** Gửi khi có đơn hàng mới */
export function triggerOrderCreated(data: {
  orderId: number;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}) {
  return triggerN8N("order-created", data);
}

/** Gửi khi đơn hàng được thanh toán */
export function triggerOrderPaid(data: {
  orderId: number;
  paymentMethod: string;
  total: number;
}) {
  return triggerN8N("order-paid", data);
}

/** Gửi khi user đăng ký mới */
export function triggerNewUser(data: {
  userId: number;
  name: string;
  email: string;
}) {
  return triggerN8N("new-user", data);
}

/** Gửi khi KH liên hệ qua live chat */
export function triggerLiveChatStarted(data: {
  chatId: number;
  userName: string;
  message: string;
}) {
  return triggerN8N("live-chat-started", data);
}

/** Gửi khi sản phẩm sắp hết hàng */
export function triggerLowStock(data: {
  productId: number;
  productName: string;
  currentStock: number;
}) {
  return triggerN8N("low-stock", data);
}

/** Gửi khi review mới được tạo */
export function triggerNewReview(data: {
  productId: number;
  productName: string;
  rating: number;
  comment: string;
  userName: string;
}) {
  return triggerN8N("new-review", data);
}
