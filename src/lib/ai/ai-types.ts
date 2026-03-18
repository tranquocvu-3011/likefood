/**
 * LIKEFOOD — AI Commerce Platform Types
 * Shared types for the entire AI system.
 * Copyright (c) 2026 LIKEFOOD Team
 */

// ─── AI Provider Types ───────────────────────────────────────

export interface GPTCallOptions {
  /** Task name for model routing & logging. */
  task?: string;
  /** Override model explicitly (gpt-4o-mini, gpt-4o). */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  /** Penalize repeated tokens (0-2). */
  frequencyPenalty?: number;
  /** Penalize tokens already present (0-2). */
  presencePenalty?: number;
  /** Timeout in milliseconds. */
  timeoutMs?: number;
  /** System message prepended to conversation. */
  systemMessage?: string;
  /** Skip retry on failure. */
  noRetry?: boolean;
  /** User ID for usage logging. */
  userId?: number;
  /** Session ID for usage logging. */
  sessionId?: string;
}

export interface GPTResult {
  text: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latencyMs: number;
  fromCache?: boolean;
}

export interface AIHealthStatus {
  ok: boolean;
  provider: "openai";
  model: string;
  latencyMs: number;
  error?: string;
  quotaOk: boolean;
  timestamp: string;
}

// ─── Combo Types ─────────────────────────────────────────────

export type ComboType =
  | "snack"
  | "cooking"
  | "gift"
  | "savings"
  | "bestseller"
  | "behavioral"
  | "flashsale"
  | "frequently_bought";

export interface ComboProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
  category: string;
  quantity: number;
}

export interface ComboResult {
  id?: number;
  name: string;
  nameEn?: string;
  type: ComboType;
  description: string;
  products: ComboProduct[];
  totalPrice: number;
  discountPct: number;
  finalPrice: number;
  reason: string;
  savings: number;
}

export interface ComboRequest {
  type?: ComboType;
  query?: string;
  userId?: number;
  productIds?: number[];
  limit?: number;
}

// ─── Product Advisor Types ───────────────────────────────────

export interface ProductComparison {
  products: ProductComparisonItem[];
  recommendation: string;
  summary: string;
}

export interface ProductComparisonItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  category: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
}

export interface ProductStrengthWeakness {
  productId: number;
  name: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  alternatives: AlternativeProduct[];
}

export interface AlternativeProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  reason: string;
}

export interface AdvisorStep {
  step: number;
  question: string;
  options?: string[];
  context?: string;
}

export interface AdvisorRequest {
  query: string;
  productId?: number;
  productIds?: number[];
  step?: number;
  previousAnswers?: string[];
  userId?: number;
  language?: "vi" | "en";
}

export interface AdvisorResponse {
  type: "comparison" | "recommendation" | "step" | "answer";
  content: string;
  comparison?: ProductComparison;
  product?: ProductStrengthWeakness;
  alternatives?: AlternativeProduct[];
  nextStep?: AdvisorStep;
  products?: ComboProduct[];
}

// ─── Content Generator Types ─────────────────────────────────

export type ContentType =
  | "description"
  | "seo"
  | "marketing"
  | "email"
  | "banner"
  | "caption"
  | "bilingual";

export interface ContentRequest {
  type: ContentType;
  productName?: string;
  productId?: number;
  category?: string;
  features?: string[];
  brand?: string;
  tags?: string[];
  tone?: "vi" | "en";
  platform?: "facebook" | "instagram" | "tiktok" | "zalo";
  emailType?: "welcome" | "promotion" | "abandoned_cart" | "order_confirm";
  theme?: string;
  targetLanguage?: "vi" | "en";
  sourceContent?: string;
}

export interface ContentResult {
  type: ContentType;
  content: string;
  metadata?: Record<string, string | string[]>;
}

// ─── Admin Insights Types ────────────────────────────────────

export interface ChurnRiskCustomer {
  id: number;
  name: string;
  email: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  totalOrders: number;
  totalSpent: number;
  riskLevel: "high" | "medium" | "low";
  riskReason: string;
}

export interface CampaignAnalysis {
  campaignId: number;
  name: string;
  type: "coupon" | "flashsale";
  totalUsage: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  effectiveness: "high" | "medium" | "low";
  insights: string[];
}

export interface ShoppingTrend {
  period: string;
  topCategories: { name: string; sales: number; growth: number }[];
  topProducts: { name: string; sales: number; growth: number }[];
  peakHours: { hour: number; orders: number }[];
  insights: string[];
}

export interface RevenueBreakdown {
  period: string;
  total: number;
  byCategory: { category: string; revenue: number; percentage: number }[];
  byPaymentMethod: { method: string; revenue: number; count: number }[];
  averageOrderValue: number;
  insights: string[];
}

// ─── AI Command Center Types ─────────────────────────────────

export interface ActiveVisitor {
  sessionId: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  currentPage: string;
  deviceType: string;
  lastActivity: string;
  pagesViewed: number;
  durationMinutes: number;
  productsViewed: { id: number; name: string; viewCount: number }[];
  searchQueries: string[];
  isReturning: boolean;
}

export interface SmartCustomerProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  segment: string;
  loyaltyPoints: number;
  recentProducts: { id: number; name: string; price: number; viewedAt: string }[];
  cartItems: { name: string; price: number; quantity: number }[];
  searchHistory: string[];
  topCategories: string[];
  behaviorInsights: string[];
  purchaseProbability: number;
  aiRecommendations: string[];
}

export interface HotLead {
  sessionId: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  score: number;
  signals: string[];
  productsInterested: { id: number; name: string; price: number }[];
  cartValue: number;
  visitCount: number;
  lastActivity: string;
  suggestedAction: string;
}

export interface AISalesRecommendation {
  userId: number;
  customerName: string;
  recommendedProducts: {
    id: number;
    name: string;
    price: number;
    reason: string;
    confidence: number;
  }[];
  crossSellProducts: {
    id: number;
    name: string;
    price: number;
    reason: string;
  }[];
  salesScript: string;
  customerInsight: string;
  urgencyLevel: 'high' | 'medium' | 'low';
}

// ─── Prospect Customer Types ─────────────────────────────────

export interface ProspectCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatarInitial: string;
  prospectScore: number;
  visitDays: number;
  totalPageViews: number;
  totalProductViews: number;
  totalSearches: number;
  addToCartCount: number;
  avgSessionMinutes: number;
  lastVisit: string;
  firstVisit: string;
  productsViewed: { id: number; name: string; price: number; viewCount: number; category: string }[];
  searchQueries: string[];
  predictedProducts: { id: number; name: string; price: number; reason: string; confidence: number }[];
  behaviorSummary: string[];
  segment: string;
  suggestedContactMethod: string;
  suggestedMessage: string;
}

// ─── AI Logger Types ─────────────────────────────────────────

export interface AIUsageEntry {
  task: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  userId?: number;
  sessionId?: string;
}

export interface AIUsageStats {
  period: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  byTask: { task: string; calls: number; tokens: number; avgLatency: number }[];
  byModel: { model: string; calls: number; tokens: number }[];
}
