/**
 * LIKEFOOD - useAIChat SSE Hook
 * Custom hook để xử lý AI chat với streaming response
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

"use client";

import { useCallback, useRef } from "react";
import { analytics } from "@/lib/analytics/sdk";

interface UseAIChatOptions {
  isVietnamese: boolean;
  onMessage: (content: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

interface Message {
  role: "user" | "model";
  content: string;
}

export function useAIChat({ isVietnamese, onMessage, onError, onStart, onComplete }: UseAIChatOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string, history: Message[]) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      onStart?.();

      const response = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: analytics.getSessionId(),
          history: history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(isVietnamese ? "Không thể kết nối. Vui lòng thử lại!" : "Connection failed. Please try again!");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.event === "chunk" && data.data?.content) {
                  fullContent += data.data.content;
                  onMessage(fullContent);
                } else if (data.event === "done") {
                  if (!fullContent && data.data?.content) {
                    fullContent = data.data.content;
                    onMessage(fullContent);
                  }
                } else if (data.event === "error") {
                  throw new Error(data.data?.message || "Unknown error");
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (streamError) {
        if (!fullContent) {
          throw streamError;
        }
      }

      onComplete?.();
      return fullContent;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return ""; // Cancelled
      }
      throw error;
    }
  }, [isVietnamese, onMessage, onError, onStart, onComplete]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { sendMessage, cancel };
}
