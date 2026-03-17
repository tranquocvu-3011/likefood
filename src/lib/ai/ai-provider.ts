"use server";

/**
 * LIKEFOOD — Central AI Provider (ChatGPT)
 * ────────────────────────────────────────
 * Single source of truth for ALL AI model calls.
 * Features: caching, timeout, retry, logging, smart model routing, structured output.
 *
 * USAGE:
 *   import { callGPT, callGPTJSON } from "@/lib/ai/ai-provider";
 *   const text = await callGPT("Summarize this product", { task: "summarize" });
 *   const json = await callGPTJSON<{ tags: string[] }>(prompt, { task: "tag" });
 *
 * Copyright (c) 2026 LIKEFOOD Team
 */

import OpenAI from "openai";
import { getSystemSettingTrimmed } from "@/lib/system-settings";
import { logAIUsage } from "./ai-logger";
import { logger } from "@/lib/logger";
import { getCache, setCache } from "@/lib/cache";
import type { GPTCallOptions, GPTResult, AIHealthStatus } from "./ai-types";

// ─── Config ──────────────────────────────────────────────────

const DEFAULT_MODEL = "gpt-4o-mini";
const PREMIUM_MODEL = "gpt-4o";
const DEFAULT_TIMEOUT_MS = 25_000;
const PREMIUM_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 400;

/** Map task → model. Simple tasks use mini; complex reasoning uses gpt-4o. */
const TASK_MODEL_MAP: Record<string, string> = {
  // Customer-facing (fast, cost-effective)
  chat: DEFAULT_MODEL,
  chatbot: DEFAULT_MODEL,
  summarize: DEFAULT_MODEL,
  recommend: DEFAULT_MODEL,
  translate: DEFAULT_MODEL,
  classify: DEFAULT_MODEL,
  "review-summary": DEFAULT_MODEL,
  "health-check": DEFAULT_MODEL,
  // Combo & Advisor
  combo: DEFAULT_MODEL,
  advisor: PREMIUM_MODEL,
  "product-compare": PREMIUM_MODEL,
  // Admin & deep analysis (premium quality)
  "product-analysis": PREMIUM_MODEL,
  "admin-insight": PREMIUM_MODEL,
  "content-generation": PREMIUM_MODEL,
  "content-banner": DEFAULT_MODEL,
  "content-email": PREMIUM_MODEL,
  "content-caption": DEFAULT_MODEL,
  "behavior-insight": DEFAULT_MODEL,
  premium: DEFAULT_MODEL,
};

/** Tasks that benefit from premium timeout */
const PREMIUM_TASKS = new Set(["product-analysis", "admin-insight", "content-generation", "content-email", "advisor", "product-compare", "premium"]);

// ─── Response Cache (Redis + In-Memory Fallback) ─────────────
// Uses Redis when available, falls back to in-memory Map

const CACHEABLE_TASKS = new Set(["summarize", "review-summary", "classify", "translate", "chatbot"]);
const CACHE_TTL_SECONDS = 300; // 5 minutes

// Simple cache key generator for Redis
function getCacheKey(prompt: string, task: string, model: string): string {
  // Simple hash - for cache keys, we don't need cryptographic security
  const str = `${task}:${model}:${prompt}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ai:${task}:${model}:${Math.abs(hash).toString(36)}`;
}

// ─── API Key ─────────────────────────────────────────────────

export async function getAPIKey(): Promise<string> {
  // ★ PRIORITY: .env first (always up-to-date), DB as fallback
  const fromEnv = (process.env.OPENAI_API_KEY ?? "").trim();
  if (fromEnv) return fromEnv;
  const fromDb = await getSystemSettingTrimmed("openai_api_key");
  return fromDb || "";
}

// ─── Client (singleton with key rotation) ────────────────────

let _client: OpenAI | null = null;
let _clientKey: string | null = null;

async function getClient(): Promise<OpenAI | null> {
  const key = await getAPIKey();
  if (!key) {
    console.warn("[AI_PROVIDER] ⚠️ OpenAI API key not configured");
    return null;
  }
  if (_client && _clientKey === key) return _client;
  _client = new OpenAI({ apiKey: key, timeout: DEFAULT_TIMEOUT_MS });
  _clientKey = key;
  return _client;
}

// ─── Core: callGPT ───────────────────────────────────────────

/**
 * Central GPT call. Every AI module MUST use this.
 * Returns null if API unavailable / all retries exhausted.
 */
export async function callGPT(
  prompt: string,
  opts: GPTCallOptions = {}
): Promise<GPTResult | null> {
  const client = await getClient();
  if (!client) return null;

  const task = opts.task ?? "";
  const model = opts.model ?? TASK_MODEL_MAP[task] ?? DEFAULT_MODEL;
  const temperature = opts.temperature ?? 0.55;
  const maxTokens = opts.maxTokens ?? 1000;
  const topP = opts.topP ?? 0.9;
  const frequencyPenalty = opts.frequencyPenalty ?? 0;
  const presencePenalty = opts.presencePenalty ?? 0;
  const maxAttempts = opts.noRetry ? 1 : MAX_RETRIES + 1;
  const timeout = PREMIUM_TASKS.has(task) ? PREMIUM_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  // Check cache for deterministic tasks (uses Redis when available)
  if (CACHEABLE_TASKS.has(task)) {
    const cacheKey = getCacheKey(prompt, task, model);
    try {
      const cached = await getCache<GPTResult>(cacheKey, "ai");
      if (cached) {
        logger.info(`[AI_PROVIDER] Cache hit | task=${task} | ${cached.text.length} chars`);
        return { ...cached, fromCache: true };
      }
    } catch (e) {
      logger.warn("[AI_PROVIDER] Cache read error", { error: e });
    }
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (opts.systemMessage) {
    messages.push({ role: "system", content: opts.systemMessage });
  }
  messages.push({ role: "user", content: prompt });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const start = Date.now();
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      const latencyMs = Date.now() - start;

      logger.info(
        `[AI_PROVIDER] ${task || "unknown"} | model=${model} | ${latencyMs}ms | ${text.length} chars | tokens=${completion.usage?.total_tokens ?? "?"} | attempt=${attempt}`
      );

      const result: GPTResult = {
        text,
        model,
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
        latencyMs,
      };

      // Cache deterministic results (uses Redis when available)
      if (CACHEABLE_TASKS.has(task) && text.length > 0) {
        try {
          await setCache(getCacheKey(prompt, task, model), result, { ttl: CACHE_TTL_SECONDS, prefix: "ai" });
        } catch (e) {
          logger.warn("[AI_PROVIDER] Cache write error", { error: e });
        }
      }

      // Auto-log usage (non-blocking)
      logAIUsage({
        task: task || "unknown",
        model,
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
        latencyMs,
        success: true,
        userId: opts.userId,
        sessionId: opts.sessionId,
      }).catch(() => {});

      return result;
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota = errMsg.includes("insufficient_quota") || errMsg.includes("429");
      const isTimeout = errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT");

      logger.error(
        `[AI_PROVIDER] ❌ ${task || "unknown"} | model=${model} | ${latencyMs}ms | attempt=${attempt}/${maxAttempts} | ${errMsg.slice(0, 150)}`
      );

      // Don't retry on quota errors
      if (isQuota) {
        logAIUsage({ task: task || "unknown", model, promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs, success: false, error: "quota_exceeded", userId: opts.userId, sessionId: opts.sessionId }).catch(() => {});
        return null;
      }

      // Retry on timeout / transient errors
      if (attempt < maxAttempts && (isTimeout || !errMsg.includes("400"))) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      // Log final failure
      logAIUsage({ task: task || "unknown", model, promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs, success: false, error: errMsg.slice(0, 200), userId: opts.userId, sessionId: opts.sessionId }).catch(() => {});
      return null;
    }
  }

  return null;
}

// ─── callGPTJSON ─────────────────────────────────────────────

/**
 * Call GPT and parse the response as JSON.
 * Returns null if parsing fails or API unavailable.
 */
export async function callGPTJSON<T = Record<string, unknown>>(
  prompt: string,
  opts: GPTCallOptions = {}
): Promise<T | null> {
  const result = await callGPT(prompt, {
    ...opts,
    systemMessage: (opts.systemMessage ?? "") + "\nRespond ONLY with valid JSON. No markdown, no explanation.",
  });
  if (!result) return null;

  try {
    // Try to extract JSON from response (may have ```json wrapper)
    let text = result.text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) text = jsonMatch[1];
    // Or try raw array/object
    const rawMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (rawMatch) text = rawMatch[0];
    return JSON.parse(text) as T;
  } catch {
    logger.error(`[AI_PROVIDER] JSON parse failed for task=${opts.task}: ${result.text.slice(0, 100)}`);
    return null;
  }
}

// ─── Cache Management ────────────────────────────────────────

export async function clearAICache(): Promise<void> {
  // Redis cache is managed automatically with TTL
  logger.info("[AI_PROVIDER] Cache clear requested (Redis TTL-based)");
}

export async function getAICacheStats(): Promise<{ size: number; maxSize: number }> {
  // Redis manages its own size; report nominal values
  return { size: 0, maxSize: 1000 };
}

// ─── Health Check ────────────────────────────────────────────

export async function checkAIHealth(): Promise<AIHealthStatus> {
  const start = Date.now();
  const model = DEFAULT_MODEL;

  try {
    const result = await callGPT("Say OK", {
      task: "health-check",
      maxTokens: 5,
      temperature: 0,
      noRetry: true,
    });

    const latencyMs = Date.now() - start;

    if (result) {
      return {
        ok: true,
        provider: "openai",
        model,
        latencyMs,
        quotaOk: true,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      ok: false,
      provider: "openai",
      model,
      latencyMs,
      error: "No response from model",
      quotaOk: false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      provider: "openai",
      model,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
      quotaOk: false,
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── Public API Key getter ───────────────────────────────────

export async function getOpenAIApiKey(): Promise<string> {
  return getAPIKey();
}

// ─── Utils ───────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
