"use client";

/**
 * LIKEFOOD — AI Command Center
 * Trung tâm AI thông minh hỗ trợ quản trị và bán hàng
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  Eye,
  Flame,
  Loader2,
  Monitor,
  Package,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";

// ─── Types ───────────────────────────────────────────────────

interface AIInsight {
  type: "success" | "warning" | "info" | "trend";
  title: string;
  description: string;
  metric?: string;
}

interface InventoryForecast {
  productId: string;
  productName: string;
  currentStock: number;
  daysUntilStockout: number;
  recommendedRestock: number;
  confidence: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface ActiveVisitor {
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

interface HotLead {
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

interface SmartProfile {
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

interface SalesRecommendation {
  userId: number;
  customerName: string;
  recommendedProducts: { id: number; name: string; price: number; reason: string; confidence: number }[];
  crossSellProducts: { id: number; name: string; price: number; reason: string }[];
  salesScript: string;
  customerInsight: string;
  urgencyLevel: "high" | "medium" | "low";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type TabId = "overview" | "realtime" | "profiles" | "sales" | "chat";

const TABS: { id: TabId; label: string; icon: typeof Brain }[] = [
  { id: "overview", label: "Tổng quan", icon: Brain },
  { id: "realtime", label: "Real-time", icon: Activity },
  { id: "profiles", label: "Hồ sơ KH", icon: User },
  { id: "sales", label: "AI Bán hàng", icon: Target },
  { id: "chat", label: "Chat AI", icon: Bot },
];

const QUICK_PROMPTS = [
  "Tóm tắt tình hình kinh doanh hôm nay",
  "Sản phẩm nào cần nhập hàng ngay?",
  "Khách hàng nào có khả năng mua cao?",
  "Gợi ý chiến lược bán hàng tuần này",
];

// ─── Main Component ──────────────────────────────────────────

export default function AICommandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Overview data
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [summary, setSummary] = useState("");
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);

  // Real-time data
  const [visitors, setVisitors] = useState<ActiveVisitor[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);

  // Profile data
  const [profileSearch, setProfileSearch] = useState("");
  const [profileSearchResults, setProfileSearchResults] = useState<{ id: number; name: string; email: string }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SmartProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Sales data
  const [salesRec, setSalesRec] = useState<SalesRecommendation | null>(null);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  // Chat data
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Xin chào! Tôi là trợ lý AI quản trị LIKEFOOD. Tôi có thể giúp bạn phân tích dữ liệu, tìm kiếm khách hàng tiềm năng, gợi ý chiến lược bán hàng và nhiều hơn nữa. Hãy hỏi tôi bất cứ điều gì!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────

  const loadOverviewData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, inventoryRes, customersRes, summaryRes, hotLeadsRes] = await Promise.all([
        fetch("/api/ai/admin?type=analytics"),
        fetch("/api/ai/admin?type=inventory"),
        fetch("/api/ai/admin?type=customers"),
        fetch("/api/ai/admin?type=summary"),
        fetch("/api/ai/admin?type=hot-leads"),
      ]);

      const [analyticsData, inventoryData, customerData, summaryData, hotLeadsData] = await Promise.all([
        analyticsRes.ok ? analyticsRes.json() : { insights: [] },
        inventoryRes.ok ? inventoryRes.json() : { forecasts: [] },
        customersRes.ok ? customersRes.json() : { segments: [] },
        summaryRes.ok ? summaryRes.json() : { summary: "" },
        hotLeadsRes.ok ? hotLeadsRes.json() : { leads: [] },
      ]);

      setInsights(Array.isArray(analyticsData.insights) ? analyticsData.insights : []);
      setForecasts(Array.isArray(inventoryData.forecasts) ? inventoryData.forecasts : []);
      setSegments(Array.isArray(customerData.segments) ? customerData.segments : []);
      setSummary(summaryData.summary || "");
      setHotLeads(Array.isArray(hotLeadsData.leads) ? hotLeadsData.leads : []);
    } catch {
      toast.error("Không thể tải dữ liệu AI.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadVisitors = useCallback(async () => {
    setIsLoadingVisitors(true);
    try {
      const res = await fetch("/api/ai/admin?type=live-visitors");
      if (res.ok) {
        const data = await res.json();
        setVisitors(Array.isArray(data.visitors) ? data.visitors : []);
      }
    } catch {
      toast.error("Không thể tải dữ liệu visitors.");
    } finally {
      setIsLoadingVisitors(false);
    }
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) { setProfileSearchResults([]); return; }
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setProfileSearchResults(Array.isArray(data.customers) ? data.customers : []);
      }
    } catch { /* ignore */ }
  }, []);

  const loadProfile = useCallback(async (userId: number) => {
    setIsLoadingProfile(true);
    setSelectedProfile(null);
    try {
      const res = await fetch(`/api/ai/admin?type=customer-profile&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProfile(data.profile || null);
      }
    } catch {
      toast.error("Không thể tải hồ sơ khách hàng.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const loadSalesRec = useCallback(async (userId: number) => {
    setIsLoadingSales(true);
    setSalesRec(null);
    try {
      const res = await fetch("/api/ai/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sales-recommendations", data: { userId } }),
      });
      if (res.ok) {
        const data = await res.json();
        setSalesRec(data.recommendations || null);
      }
    } catch {
      toast.error("Không thể tải gợi ý bán hàng.");
    } finally {
      setIsLoadingSales(false);
    }
  }, []);

  const sendMessage = useCallback(async (prompt?: string) => {
    const message = (prompt ?? chatInput).trim();
    if (!message || isSending) return;

    const userMessage: Message = { id: `${Date.now()}-u`, role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Lỗi kết nối AI.");
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: "assistant", content: data.response || "Không có phản hồi." }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối AI.");
    } finally {
      setIsSending(false);
    }
  }, [chatInput, isSending]);

  // Initial load
  useEffect(() => { void loadOverviewData(); }, [loadOverviewData]);

  // Auto-refresh visitors every 30s when on realtime tab
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (activeTab === "realtime") {
      void loadVisitors();
      intervalRef.current = setInterval(() => { void loadVisitors(); }, 30000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [activeTab, loadVisitors]);

  // Debounced customer search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { void searchCustomers(profileSearch); }, 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [profileSearch, searchCustomers]);

  // ─── Computed Values ─────────────────────────────────────────

  const totals = useMemo(() => ({
    warnings: insights.filter((i) => i.type === "warning").length,
    urgentRestocks: forecasts.filter((i) => i.daysUntilStockout < 7).length,
    totalSegmentRevenue: segments.reduce((sum, s) => sum + s.totalRevenue, 0),
    hotLeadCount: hotLeads.length,
  }), [insights, forecasts, segments, hotLeads]);

  // ─── Loading State ───────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="text-sm text-zinc-500 animate-pulse">AI đang phân tích dữ liệu...</p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="overflow-hidden rounded-2xl border border-zinc-700/50 bg-[#111113] shadow-[0_18px_70px_rgba(0,0,0,0.5)]">
        <div className="bg-[linear-gradient(135deg,#111827_0%,#0f766e_45%,#1d4ed8_100%)] px-6 py-8 text-white lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">AI Command Center</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">
                Trung tâm AI thông minh
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Phân tích hành vi khách hàng, dự đoán nhu cầu, hỗ trợ tư vấn bán hàng — tất cả trong một dashboard.
              </p>
            </div>
            <Button variant="outline" size="lg" onClick={() => void loadOverviewData()} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />Làm mới
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Phân tích" value={`${insights.length}`} icon={Sparkles} />
        <MetricCard label="Cảnh báo" value={`${totals.warnings}`} icon={TrendingUp} color={totals.warnings > 0 ? "text-amber-400" : undefined} />
        <MetricCard label="Cần nhập hàng" value={`${totals.urgentRestocks}`} icon={Package} color={totals.urgentRestocks > 0 ? "text-rose-400" : undefined} />
        <MetricCard label="Doanh thu KH" value={formatPrice(totals.totalSegmentRevenue)} icon={Users} />
        <MetricCard label="Hot Leads" value={`${totals.hotLeadCount}`} icon={Flame} color={totals.hotLeadCount > 0 ? "text-orange-400" : undefined} />
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-700/50 bg-[#111113] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab insights={insights} summary={summary} forecasts={forecasts} segments={segments} hotLeads={hotLeads} />}
      {activeTab === "realtime" && <RealTimeTab visitors={visitors} isLoading={isLoadingVisitors} onRefresh={loadVisitors} />}
      {activeTab === "profiles" && (
        <ProfilesTab
          search={profileSearch}
          onSearchChange={setProfileSearch}
          searchResults={profileSearchResults}
          selectedProfile={selectedProfile}
          isLoading={isLoadingProfile}
          onSelectCustomer={loadProfile}
        />
      )}
      {activeTab === "sales" && (
        <SalesTab
          search={profileSearch}
          onSearchChange={setProfileSearch}
          searchResults={profileSearchResults}
          salesRec={salesRec}
          isLoading={isLoadingSales}
          onSelectCustomer={(id) => { void loadSalesRec(id); }}
        />
      )}
      {activeTab === "chat" && (
        <ChatTab
          messages={messages}
          input={chatInput}
          onInputChange={setChatInput}
          onSend={sendMessage}
          isSending={isSending}
        />
      )}
    </div>
  );
}

// ─── Tab Components ──────────────────────────────────────────

function OverviewTab({
  insights, summary, forecasts, segments, hotLeads,
}: {
  insights: AIInsight[];
  summary: string;
  forecasts: InventoryForecast[];
  segments: CustomerSegment[];
  hotLeads: HotLead[];
}) {
  return (
    <div className="space-y-6">
      {/* Executive Summary + Hot Leads */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Tóm tắt điều hành" icon={Brain}>
          <p className="whitespace-pre-line text-sm leading-7 text-zinc-400">{summary || "Chưa có dữ liệu."}</p>
        </SectionCard>

        <SectionCard title="Khách hàng tiềm năng" icon={Flame} badge={hotLeads.length > 0 ? `${hotLeads.length} leads` : undefined}>
          {hotLeads.length === 0 ? (
            <p className="text-sm text-zinc-500">Chưa có hot leads trong 30 phút qua.</p>
          ) : (
            <div className="space-y-2">
              {hotLeads.slice(0, 5).map((lead) => (
                <div key={lead.sessionId} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-200">{lead.userName || lead.userEmail || `Khách #${lead.sessionId.slice(0, 8)}`}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{lead.signals.slice(0, 2).join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={lead.score} />
                    <span className="text-xs text-zinc-400">{lead.suggestedAction}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Insights */}
      <SectionCard title="AI Insights" icon={Sparkles}>
        {insights.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có phân tích.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight.title} className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{insight.title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{insight.description}</p>
                  </div>
                  <InsightBadge type={insight.type} metric={insight.metric} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Inventory + Customer Segments */}
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Dự báo tồn kho" icon={Package}>
          {forecasts.length === 0 ? (
            <p className="text-sm text-zinc-500">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-2">
              {forecasts.slice(0, 6).map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-200">{item.productName}</p>
                    <p className="text-xs text-zinc-500">Tồn: {item.currentStock} · Nhập: {item.recommendedRestock}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    item.daysUntilStockout < 7 ? "bg-rose-500/20 text-rose-400" :
                    item.daysUntilStockout < 14 ? "bg-amber-500/20 text-amber-400" :
                    "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {item.daysUntilStockout} ngày
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Phân khúc khách hàng" icon={Users}>
          {segments.length === 0 ? (
            <p className="text-sm text-zinc-500">Chưa có dữ liệu.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2">
              {segments.map((seg) => (
                <div key={seg.segment} className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{seg.segment}</p>
                  <p className="mt-1 text-2xl font-black text-zinc-100">{seg.count}</p>
                  <p className="mt-1 text-xs text-zinc-400">Doanh thu {formatPrice(seg.totalRevenue)}</p>
                  <p className="text-xs text-zinc-500">TB {formatPrice(seg.avgOrderValue)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function RealTimeTab({ visitors, isLoading, onRefresh }: { visitors: ActiveVisitor[]; isLoading: boolean; onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Khách hàng đang truy cập</h2>
          <p className="text-xs text-zinc-500">Cập nhật mỗi 30 giây · {visitors.length} khách đang online</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />Làm mới
        </Button>
      </div>

      {visitors.length === 0 ? (
        <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
          <CardContent className="p-8 text-center">
            <Eye className="mx-auto h-10 w-10 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">Chưa có dữ liệu hành vi khách hàng trong 15 phút qua.</p>
            <p className="mt-1 text-xs text-zinc-600">Hệ thống sẽ tự động cập nhật khi có khách truy cập.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visitors.map((visitor) => (
            <Card key={visitor.sessionId} className="rounded-xl border-zinc-700/50 bg-[#111113]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-sm font-bold text-zinc-100">
                        {visitor.userName || visitor.userEmail || `Khách ẩn danh`}
                      </p>
                      {visitor.isReturning && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">Quay lại</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        {visitor.deviceType === "mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                        {visitor.deviceType}
                      </span>
                      <span>{visitor.pagesViewed} trang</span>
                      <span>{visitor.durationMinutes} phút</span>
                      <span className="truncate max-w-[200px]">{visitor.currentPage}</span>
                    </div>
                    {visitor.productsViewed.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {visitor.productsViewed.slice(0, 3).map((p) => (
                          <span key={p.id} className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                            {p.name} {p.viewCount > 1 ? `(×${p.viewCount})` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {visitor.searchQueries.length > 0 && (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        🔍 {visitor.searchQueries.slice(0, 3).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    {new Date(visitor.lastActivity).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfilesTab({
  search, onSearchChange, searchResults, selectedProfile, isLoading, onSelectCustomer,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  searchResults: { id: number; name: string; email: string }[];
  selectedProfile: SmartProfile | null;
  isLoading: boolean;
  onSelectCustomer: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm khách hàng theo tên hoặc email..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-teal-500"
        />
      </div>

      {searchResults.length > 0 && !selectedProfile && (
        <div className="rounded-xl border border-zinc-700/50 bg-[#111113] p-2">
          {searchResults.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-zinc-800/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600/20 text-teal-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{c.name || "Chưa cập nhật"}</p>
                <p className="text-xs text-zinc-500">{c.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      )}

      {selectedProfile && !isLoading && (
        <CustomerProfileCard profile={selectedProfile} onClose={() => { onSearchChange(""); }} />
      )}

      {!selectedProfile && !isLoading && searchResults.length === 0 && search.length >= 2 && (
        <div className="py-8 text-center text-sm text-zinc-500">Không tìm thấy khách hàng phù hợp.</div>
      )}
    </div>
  );
}

function SalesTab({
  search, onSearchChange, searchResults, salesRec, isLoading, onSelectCustomer,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  searchResults: { id: number; name: string; email: string }[];
  salesRec: SalesRecommendation | null;
  isLoading: boolean;
  onSelectCustomer: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">AI Tư vấn bán hàng</h2>
        <p className="text-xs text-zinc-500">Chọn khách hàng để AI gợi ý sản phẩm và kịch bản tư vấn</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm khách hàng..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-teal-500"
        />
      </div>

      {searchResults.length > 0 && !salesRec && !isLoading && (
        <div className="rounded-xl border border-zinc-700/50 bg-[#111113] p-2">
          {searchResults.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-zinc-800/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/20 text-orange-400">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{c.name || "Chưa cập nhật"}</p>
                <p className="text-xs text-zinc-500">{c.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          <p className="text-sm text-zinc-500 animate-pulse">AI đang phân tích và tạo gợi ý...</p>
        </div>
      )}

      {salesRec && !isLoading && <SalesRecommendationCard rec={salesRec} />}
    </div>
  );
}

function ChatTab({
  messages, input, onInputChange, onSend, isSending,
}: {
  messages: Message[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: (prompt?: string) => void;
  isSending: boolean;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Trợ lý AI quản trị</h2>
          <p className="text-xs text-zinc-400">Hỏi AI về dữ liệu, chiến lược, khách hàng...</p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void onSend(prompt)}
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="max-h-[500px] space-y-3 overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
              msg.role === "assistant"
                ? "border border-zinc-700 bg-zinc-800/50 text-zinc-200"
                : "bg-teal-600 text-white"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
              <span className="text-xs text-zinc-400">AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void onSend(); } }}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-teal-500"
          placeholder="Hỏi AI quản trị..."
        />
        <Button size="lg" onClick={() => void onSend()} disabled={isSending || !input.trim()} className="shrink-0">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────

function CustomerProfileCard({ profile, onClose }: { profile: SmartProfile; onClose: () => void }) {
  return (
    <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">{profile.name}</h3>
              <p className="text-sm text-zinc-400">{profile.email}</p>
              {profile.phone && <p className="text-xs text-zinc-500">{profile.phone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              profile.segment === "VIP" ? "bg-amber-500/20 text-amber-400" :
              profile.segment === "Premium" ? "bg-purple-500/20 text-purple-400" :
              "bg-zinc-700/50 text-zinc-400"
            }`}>
              {profile.segment}
            </span>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBlock label="Đơn hàng" value={`${profile.totalOrders}`} />
          <StatBlock label="Tổng chi" value={formatPrice(profile.totalSpent)} />
          <StatBlock label="TB/đơn" value={formatPrice(profile.averageOrderValue)} />
          <StatBlock label="Xác suất mua" value={`${profile.purchaseProbability}%`} highlight={profile.purchaseProbability > 60} />
        </div>

        {/* Behavior Insights */}
        {profile.behaviorInsights.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Phân tích hành vi</p>
            <div className="flex flex-wrap gap-2">
              {profile.behaviorInsights.map((insight, i) => (
                <span key={i} className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{insight}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {profile.aiRecommendations.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Gợi ý AI</p>
            <div className="space-y-1.5">
              {profile.aiRecommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Zap className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span className="text-zinc-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Products & Cart */}
        <div className="grid gap-4 md:grid-cols-2">
          {profile.recentProducts.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Sản phẩm đã xem</p>
              <div className="space-y-1.5">
                {profile.recentProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-zinc-300">{p.name}</span>
                    <span className="text-zinc-500">{formatPrice(p.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {profile.cartItems.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" />Giỏ hàng
              </p>
              <div className="space-y-1.5">
                {profile.cartItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate text-zinc-300">{item.name} ×{item.quantity}</span>
                    <span className="text-zinc-500">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search History & Categories */}
        <div className="grid gap-4 md:grid-cols-2">
          {profile.searchHistory.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Lịch sử tìm kiếm</p>
              <div className="flex flex-wrap gap-1">
                {profile.searchHistory.map((q, i) => (
                  <span key={i} className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">🔍 {q}</span>
                ))}
              </div>
            </div>
          )}
          {profile.topCategories.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Danh mục quan tâm</p>
              <div className="flex flex-wrap gap-1">
                {profile.topCategories.map((c, i) => (
                  <span key={i} className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SalesRecommendationCard({ rec }: { rec: SalesRecommendation }) {
  return (
    <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              rec.urgencyLevel === "high" ? "bg-rose-500/20 text-rose-400" :
              rec.urgencyLevel === "medium" ? "bg-amber-500/20 text-amber-400" :
              "bg-zinc-700/50 text-zinc-400"
            }`}>
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">{rec.customerName}</h3>
              <p className="text-xs text-zinc-500">{rec.customerInsight}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
            rec.urgencyLevel === "high" ? "bg-rose-500/20 text-rose-400" :
            rec.urgencyLevel === "medium" ? "bg-amber-500/20 text-amber-400" :
            "bg-zinc-700/50 text-zinc-400"
          }`}>
            {rec.urgencyLevel === "high" ? "Rất cao" : rec.urgencyLevel === "medium" ? "Trung bình" : "Thấp"}
          </span>
        </div>

        {/* Sales Script */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">📝 Kịch bản tư vấn</p>
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{rec.salesScript}</p>
          </div>
        </div>

        {/* Recommended Products */}
        {rec.recommendedProducts.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">🎯 Sản phẩm đề xuất</p>
            <div className="space-y-2">
              {rec.recommendedProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.reason}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-zinc-100">{formatPrice(p.price)}</p>
                    <p className="text-[10px] text-teal-400">{Math.round(p.confidence * 100)}% phù hợp</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cross-sell Products */}
        {rec.crossSellProducts.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">🔥 Cross-sell</p>
            <div className="space-y-2">
              {rec.crossSellProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.reason}</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-100 shrink-0 ml-3">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, icon: Icon, badge, children }: { title: string; icon: typeof Brain; badge?: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-4 w-4 text-teal-400" />
          <h2 className="text-base font-bold text-zinc-100">{title}</h2>
          {badge && <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-400">{badge}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Sparkles; color?: string }) {
  return (
    <Card className="rounded-xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
          <Icon className={`h-4 w-4 ${color || "text-teal-400"}`} />
        </div>
        <p className={`text-xl font-black ${color || "text-zinc-100"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${highlight ? "text-teal-400" : "text-zinc-100"}`}>{value}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 70 ? "bg-rose-500/20 text-rose-400" : score >= 50 ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700/50 text-zinc-400";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bg}`}>{score}</span>;
}

function InsightBadge({ type, metric }: { type: string; metric?: string }) {
  const cls = type === "warning" ? "bg-amber-500/20 text-amber-400" :
              type === "success" ? "bg-emerald-500/20 text-emerald-400" :
              "bg-sky-500/20 text-sky-400";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${cls}`}>{metric || type}</span>;
}
