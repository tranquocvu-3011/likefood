"use server";

/**
 * LIKEFOOD — AI Logger & Observability
 * Centralized logging cho tất cả AI calls.
 * Lưu vào AiUsageLog, AiRecommendationLog, AiFeedback.
 * Copyright (c) 2026 LIKEFOOD Team
 */

import prisma from "@/lib/prisma";
import type { AIUsageEntry, AIUsageStats } from "./ai-types";

// ─── Usage Logging ───────────────────────────────────────────

export async function logAIUsage(entry: AIUsageEntry): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        task: entry.task,
        model: entry.model,
        promptTokens: entry.promptTokens,
        completionTokens: entry.completionTokens,
        totalTokens: entry.totalTokens,
        latencyMs: entry.latencyMs,
        success: entry.success,
        error: entry.error?.slice(0, 500),
        userId: entry.userId,
        sessionId: entry.sessionId?.slice(0, 100),
      },
    });
  } catch (err) {
    console.error("[AI_LOGGER] Failed to log usage:", err);
  }
}

// ─── Recommendation Logging ──────────────────────────────────

export async function logRecommendation(
  type: string,
  query: string | undefined,
  recommendedIds: number[],
  userId?: number,
  sessionId?: string
): Promise<void> {
  try {
    await prisma.aiRecommendationLog.create({
      data: {
        type: type.slice(0, 30),
        userId,
        sessionId: sessionId?.slice(0, 100),
        query: query?.slice(0, 500),
        recommendedIds: JSON.stringify(recommendedIds),
      },
    });
  } catch (err) {
    console.error("[AI_LOGGER] Failed to log recommendation:", err);
  }
}

// ─── Feedback Logging ────────────────────────────────────────

export async function logFeedback(
  rating: number,
  feedback: string | undefined,
  category: string,
  sessionId?: string,
  userId?: number,
  messageId?: number
): Promise<void> {
  try {
    await prisma.aiFeedback.create({
      data: {
        messageId,
        sessionId: sessionId?.slice(0, 100),
        userId,
        rating: Math.min(Math.max(rating, 1), 5),
        feedback: feedback?.slice(0, 1000),
        category: category.slice(0, 30),
      },
    });
  } catch (err) {
    console.error("[AI_LOGGER] Failed to log feedback:", err);
  }
}

// ─── Usage Stats (for admin dashboard) ───────────────────────

const TOKEN_COSTS: Record<string, number> = {
  "gpt-4o-mini": 0.00015 / 1000,  // input cost per token (approximate)
  "gpt-4o": 0.0025 / 1000,
};

export async function getAIUsageStats(days = 30): Promise<AIUsageStats> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const logs = await prisma.aiUsageLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        task: true,
        model: true,
        totalTokens: true,
        latencyMs: true,
        success: true,
      },
    });

    const totalCalls = logs.length;
    const totalTokens = logs.reduce((s, l) => s + l.totalTokens, 0);
    const avgLatency = totalCalls > 0
      ? Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / totalCalls)
      : 0;
    const successCount = logs.filter(l => l.success).length;
    const successRate = totalCalls > 0 ? successCount / totalCalls : 1;

    // Group by task
    const taskMap = new Map<string, { calls: number; tokens: number; totalLatency: number }>();
    const modelMap = new Map<string, { calls: number; tokens: number }>();

    for (const log of logs) {
      // Task
      const t = taskMap.get(log.task) ?? { calls: 0, tokens: 0, totalLatency: 0 };
      t.calls++;
      t.tokens += log.totalTokens;
      t.totalLatency += log.latencyMs;
      taskMap.set(log.task, t);

      // Model
      const m = modelMap.get(log.model) ?? { calls: 0, tokens: 0 };
      m.calls++;
      m.tokens += log.totalTokens;
      modelMap.set(log.model, m);
    }

    // Estimate cost
    let totalCost = 0;
    for (const [model, data] of modelMap.entries()) {
      const costPer = TOKEN_COSTS[model] ?? TOKEN_COSTS["gpt-4o-mini"];
      totalCost += data.tokens * costPer;
    }

    return {
      period: `${days}d`,
      totalCalls,
      totalTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      avgLatency,
      successRate: Math.round(successRate * 100) / 100,
      byTask: Array.from(taskMap.entries())
        .map(([task, d]) => ({
          task,
          calls: d.calls,
          tokens: d.tokens,
          avgLatency: Math.round(d.totalLatency / d.calls),
        }))
        .sort((a, b) => b.calls - a.calls),
      byModel: Array.from(modelMap.entries())
        .map(([model, d]) => ({ model, calls: d.calls, tokens: d.tokens }))
        .sort((a, b) => b.tokens - a.tokens),
    };
  } catch (err) {
    console.error("[AI_LOGGER] Failed to get usage stats:", err);
    return {
      period: `${days}d`,
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      successRate: 0,
      byTask: [],
      byModel: [],
    };
  }
}
