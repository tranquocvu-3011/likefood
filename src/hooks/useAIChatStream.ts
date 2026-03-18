/**
 * LIKEFOOD - Ultimate AI Chat Hook
 * Xử lý AI chat với SSE streaming
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { analytics } from "@/lib/analytics/sdk";

interface Message {
  id: number;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  senderType?: "USER" | "ADMIN" | "AI";
}

interface UseAIChatStreamOptions {
  isVietnamese?: boolean;
}

export function useAIChatStream({ isVietnamese = true }: UseAIChatStreamOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    history: Message[],
    onChunk?: (content: string) => void,
    onComplete?: (fullContent: string) => void,
    onError?: (error: string) => void
  ): Promise<string> => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: analytics.getSessionId(),
          history: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || (isVietnamese ? "Không thể kết nối." : "Connection failed."));
      }

      // Handle SSE streaming
      if (response.body) {
        const decoder = new TextDecoder();
        let fullContent = "";

        const reader = response.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const evt = JSON.parse(line.slice(6));
                  
                  if (evt.event === "chunk" && evt.data?.content) {
                    fullContent += evt.data.content;
                    onChunk?.(fullContent);
                  } else if (evt.event === "done" && !fullContent && evt.data?.content) {
                    fullContent = evt.data.content;
                    onChunk?.(fullContent);
                  } else if (evt.event === "error") {
                    throw new Error(evt.data?.message || "Unknown error");
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            // Stream ended or error
          }
        }

        onComplete?.(fullContent);
        return fullContent;
      } else {
        // Fallback: regular JSON response
        const data = await response.json();
        const content = data.content ?? data.response ?? (isVietnamese ? "Mình chưa có câu trả lời." : "No answer.");
        onComplete?.(content);
        return content;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : (isVietnamese ? "Lỗi không xác định." : "Unknown error.");
      onError?.(errMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isVietnamese]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    cancel,
    isLoading,
  };
}
