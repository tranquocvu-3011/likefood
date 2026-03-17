"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Redis } from "@upstash/redis";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  intent?: string;
}

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  lastIntent?: string;
  entities: Record<string, string>;
  preferences?: {
    language?: "vi" | "en";
    categories?: string[];
    priceRange?: { min: number; max: number };
  };
  createdAt: number;
  updatedAt: number;
}

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const memoryStore = new Map<string, ConversationContext & { _expiresAt?: number }>();
const viewedProductsStore = new Map<string, { items: string[]; expiresAt: number }>();

const SESSION_TTL = 30 * 60; // 30 minutes in seconds
const SESSION_TTL_MS = SESSION_TTL * 1000;
const MAX_MESSAGES = 10;
const MAX_MEMORY_ENTRIES = 200;

// Auto-cleanup expired sessions every 5 minutes
let _lastCleanup = 0;
function cleanupMemoryStore() {
  const now = Date.now();
  if (now - _lastCleanup < 5 * 60 * 1000) return;
  _lastCleanup = now;
  for (const [key, ctx] of memoryStore) {
    if (ctx._expiresAt && now > ctx._expiresAt) memoryStore.delete(key);
  }
  for (const [key, val] of viewedProductsStore) {
    if (now > val.expiresAt) viewedProductsStore.delete(key);
  }
  // Hard cap: evict oldest if too many
  if (memoryStore.size > MAX_MEMORY_ENTRIES) {
    const toDelete = memoryStore.size - MAX_MEMORY_ENTRIES;
    let deleted = 0;
    for (const key of memoryStore.keys()) {
      if (deleted >= toDelete) break;
      memoryStore.delete(key);
      deleted++;
    }
  }
}

function getContextKey(sessionId: string) {
  return `chat:context:${sessionId}`;
}

function getViewedProductsKey(sessionId: string) {
  return `chat:viewed:${sessionId}`;
}

export async function getContext(sessionId: string): Promise<ConversationContext> {
  const key = getContextKey(sessionId);
  const empty = (): ConversationContext => ({
    sessionId,
    messages: [],
    entities: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  try {
    let context: ConversationContext | null = null;
    if (redis) {
      const data = await redis.get(key);
      context = data ? (data as ConversationContext) : null;
    } else {
      context = memoryStore.get(key) ?? null;
    }
    return context ?? empty();
  } catch (error) {
    console.error("getContext error:", error);
    return memoryStore.get(key) ?? empty();
  }
}

export async function saveContext(context: ConversationContext): Promise<void> {
  const key = getContextKey(context.sessionId);
  context.updatedAt = Date.now();

  try {
    if (redis) {
      await redis.setex(key, SESSION_TTL, context);
    } else {
      cleanupMemoryStore();
      memoryStore.set(key, { ...context, _expiresAt: Date.now() + SESSION_TTL_MS });
    }
  } catch (error) {
    console.error("saveContext error:", error);
    memoryStore.set(key, { ...context, _expiresAt: Date.now() + SESSION_TTL_MS });
  }
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  intent?: string
): Promise<ConversationContext> {
  try {
    const context = await getContext(sessionId);

    context.messages.push({
      role,
      content,
      timestamp: Date.now(),
      intent,
    });

    if (context.messages.length > MAX_MESSAGES) {
      context.messages = context.messages.slice(-MAX_MESSAGES);
    }

    if (intent) {
      context.lastIntent = intent;
    }

    await saveContext(context);
    return context;
  } catch (error) {
    console.error("addMessage error:", error);
    return {
      sessionId,
      messages: [],
      entities: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

export async function updateEntities(
  sessionId: string,
  entities: Record<string, string>
): Promise<ConversationContext> {
  try {
    const context = await getContext(sessionId);
    context.entities = { ...context.entities, ...entities };
    await saveContext(context);
    return context;
  } catch (error) {
    console.error("updateEntities error:", error);
    return { sessionId, messages: [], entities: {}, createdAt: Date.now(), updatedAt: Date.now() };
  }
}

export async function updatePreferences(
  sessionId: string,
  preferences: ConversationContext["preferences"]
): Promise<ConversationContext> {
  const context = await getContext(sessionId);
  context.preferences = { ...context.preferences, ...preferences };
  await saveContext(context);
  return context;
}

export async function getConversationHistory(sessionId: string, maxMessages = 6): Promise<string> {
  try {
    const context = await getContext(sessionId);
    return context.messages
      .slice(-maxMessages)
      .map((message) => `${message.role === "user" ? "Customer" : "Assistant"}: ${message.content}`)
      .join("\n");
  } catch (error) {
    console.error("getConversationHistory error:", error);
    return "";
  }
}

export async function clearContext(sessionId: string): Promise<void> {
  const contextKey = getContextKey(sessionId);
  const viewedKey = getViewedProductsKey(sessionId);

  if (redis) {
    await redis.del(contextKey);
    await redis.del(viewedKey);
  } else {
    memoryStore.delete(contextKey);
    viewedProductsStore.delete(viewedKey);
  }
}

export async function getRecentlyViewedProducts(sessionId: string): Promise<string[]> {
  const key = getViewedProductsKey(sessionId);

  if (redis) {
    const products = await redis.lrange(key, 0, 4);
    return Array.isArray(products) ? (products as string[]) : [];
  }

  return viewedProductsStore.get(key)?.items ?? [];
}

export async function trackProductView(sessionId: string, productId: number): Promise<void> {
  const key = getViewedProductsKey(sessionId);

  if (redis) {
    await redis.lpush(key, String(productId));
    await redis.ltrim(key, 0, 9);
    await redis.expire(key, SESSION_TTL);
    return;
  }

  const current = viewedProductsStore.get(key)?.items ?? [];
  viewedProductsStore.set(key, { items: [String(productId), ...current].slice(0, 10), expiresAt: Date.now() + SESSION_TTL_MS });
}

export async function isNewSession(sessionId: string): Promise<boolean> {
  try {
    const context = await getContext(sessionId);
    return context.messages.length === 0;
  } catch (error) {
    console.error("isNewSession error:", error);
    return true;
  }
}

export async function getContextSummary(sessionId: string): Promise<{
  messageCount: number;
  lastIntent?: string;
  language?: "vi" | "en";
  categories?: string[];
}> {
  try {
    const context = await getContext(sessionId);
    return {
      messageCount: context.messages.length,
      lastIntent: context.lastIntent,
      language: context.preferences?.language,
      categories: context.preferences?.categories,
    };
  } catch (error) {
    console.error("getContextSummary error:", error);
    return { messageCount: 0 };
  }
}
