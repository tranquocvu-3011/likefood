"use client";

/**
 * LIKEFOOD — Behavioral Intelligence Tab v2
 * Tab hành vi khách hàng trong AI Command Center
 * Hiển thị: Khách hàng, Phễu, Lead Score, Bỏ giỏ, Tìm kiếm, Retention
 */

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  BarChart3,
  Filter,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/currency";

// ─── Types ───────────────────────────────────────────────────

interface FunnelStep {
  name: string;
  count: number;
  dropOff: number;
  dropOffRate: number;
}

interface FunnelData {
  period: string;
  steps: FunnelStep[];
  overallConversion: number;
}

interface LeadScoreEntry {
  userId: number;
  userName: string;
  userEmail: string;
  phone: string | null;
  score: number;
  signals: string[];
  buyerStage: string;
  intentScore: number;
  churnRisk: number;
  productAffinity: Array<{ category: string; score: number }>;
  lastActivity: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  segment: string;
  cartItems: Array<{ name: string; price: number; qty: number }>;
  cartValue: number;
  lastOrderDate: string | null;
  aiRecommendations: string[];
}

interface CustomerIntel {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  joinedAt: string;
  segment: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  cartItemCount: number;
  cartValue: number;
  eventCount30d: number;
  lastOrderDate: string | null;
  aiRecommendations: string[];
}

interface AbandonedSession {
  sessionId: string;
  userId?: number;
  userName?: string;
  email?: string;
  lastPage: string;
  farthestStage: string;
  productsViewed: Array<{ id: number; name: string; price: number }>;
  cartValue: number;
  durationMinutes: number;
  lastActivity: string;
}

interface SearchIntent {
  query: string;
  count: number;
  avgResultsCount: number;
  clickThroughRate: number;
  hasResults: boolean;
}

interface RetentionCohort {
  cohortMonth: string;
  totalUsers: number;
  retained: number[];
  retentionRates: number[];
}

// ─── Sub-tabs ────────────────────────────────────────────────

type SubTab = "customers" | "funnel" | "leads" | "abandoned" | "search" | "retention";

const SUB_TABS: { id: SubTab; label: string; icon: typeof Zap }[] = [
  { id: "customers", label: "Khách hàng", icon: Users },
  { id: "funnel", label: "Phễu", icon: Filter },
  { id: "leads", label: "Lead Score", icon: Zap },
  { id: "abandoned", label: "Bỏ giỏ", icon: ShoppingCart },
  { id: "search", label: "Tìm kiếm", icon: Search },
  { id: "retention", label: "Retention", icon: Activity },
];

// ─── Main Component ──────────────────────────────────────────

export function BehaviorTab() {
  const [subTab, setSubTab] = useState<SubTab>("customers");
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerIntel[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [leads, setLeads] = useState<LeadScoreEntry[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedSession[]>([]);
  const [searchIntents, setSearchIntents] = useState<SearchIntent[]>([]);
  const [cohorts, setCohorts] = useState<RetentionCohort[]>([]);

  const loadData = useCallback(async (tab: SubTab) => {
    setIsLoading(true);
    try {
      const typeMap: Record<SubTab, string> = {
        customers: "customer-intelligence",
        funnel: "funnel",
        leads: "lead-scores",
        abandoned: "abandoned-sessions",
        search: "search-intents",
        retention: "retention-cohorts",
      };
      const res = await fetch(`/api/ai/admin?type=${typeMap[tab]}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      switch (tab) {
        case "customers": setCustomers(data.customers || []); break;
        case "funnel": setFunnel(data.funnel); break;
        case "leads": setLeads(data.leadScores || []); break;
        case "abandoned": setAbandoned(data.sessions || []); break;
        case "search": setSearchIntents(data.intents || []); break;
        case "retention": setCohorts(data.cohorts || []); break;
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(subTab);
  }, [subTab, loadData]);

  return (
    <div className="space-y-4">
      {/* Sub-tab nav */}
      <div className="flex items-center gap-1 rounded-xl border border-zinc-700/50 bg-[#111113] p-1 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              subTab === tab.id
                ? "bg-teal-600 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => loadData(subTab)}
          className="ml-auto text-zinc-400 hover:text-teal-400 p-2"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && subTab === "customers" && <CustomersView data={customers} />}
      {!isLoading && subTab === "funnel" && (funnel ? <FunnelView data={funnel} /> : <EmptyState icon={BarChart3} text="Chưa có dữ liệu phễu chuyển đổi" />)}
      {!isLoading && subTab === "leads" && <LeadsView data={leads} />}
      {!isLoading && subTab === "abandoned" && <AbandonedView data={abandoned} />}
      {!isLoading && subTab === "search" && <SearchView data={searchIntents} />}
      {!isLoading && subTab === "retention" && <RetentionView data={cohorts} />}
    </div>
  );
}

// ─── Customers Intelligence View ─────────────────────────────

function CustomersView({ data }: { data: CustomerIntel[] }) {
  if (data.length === 0) {
    return <EmptyState icon={Users} text="Chưa có khách hàng nào" />;
  }

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Tổng KH" value={data.length.toString()} />
        <MiniStat label="Có đơn hàng" value={data.filter(c => c.totalOrders > 0).length.toString()} />
        <MiniStat label="Có giỏ hàng" value={data.filter(c => c.cartItemCount > 0).length.toString()} />
        <MiniStat label="Hoạt động 30 ngày" value={data.filter(c => c.eventCount30d > 0).length.toString()} />
      </div>

      {/* Customer list */}
      {data.map((c) => (
        <Card key={c.id} className="rounded-xl border-zinc-700/50 bg-[#111113]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              {/* User info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-sky-500/30 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="h-3 w-3 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 truncate">{c.email}</span>
                    {c.phone && (
                      <>
                        <Phone className="h-3 w-3 text-zinc-500 ml-1" />
                        <span className="text-[10px] text-zinc-500">{c.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Segment badge */}
              <SegmentBadge segment={c.segment} />
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t border-zinc-800">
              <MetricItem label="Đơn hàng" value={c.totalOrders.toString()} />
              <MetricItem label="Tổng chi" value={formatPrice(c.totalSpent)} highlight={c.totalSpent > 0} />
              <MetricItem label="Điểm tích lũy" value={c.loyaltyPoints.toString()} />
              <MetricItem label="Giỏ hàng" value={c.cartItemCount > 0 ? `${c.cartItemCount} SP (${formatPrice(c.cartValue)})` : "Trống"} highlight={c.cartItemCount > 0} />
              <MetricItem label="Hoạt động 30d" value={`${c.eventCount30d} events`} highlight={c.eventCount30d >= 10} />
            </div>

            {/* AI Recommendations */}
            {c.aiRecommendations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-zinc-800">
                <Star className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                {c.aiRecommendations.map((r, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Funnel View ─────────────────────────────────────────────

function FunnelView({ data }: { data: FunnelData }) {
  const maxCount = Math.max(...data.steps.map((s) => s.count), 1);

  return (
    <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-bold text-zinc-100">Phễu Chuyển Đổi</h3>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{data.period}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tỷ lệ chuyển đổi</p>
            <p className="text-2xl font-black text-teal-400">{data.overallConversion}%</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.steps.map((step, i) => {
            const width = Math.max(10, (step.count / maxCount) * 100);
            const colors = ["bg-sky-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500"];
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-300">{step.name}</span>
                  <span className="text-xs font-bold text-zinc-100">{step.count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-7 bg-zinc-800/50 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${colors[i % colors.length]} rounded-lg transition-all flex items-center px-2`}
                      style={{ width: `${width}%` }}
                    >
                      {width > 20 && (
                        <span className="text-[10px] font-bold text-white/80">{step.count.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  {i > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0 min-w-[50px]">
                      <ArrowDown className="h-3 w-3 text-red-400" />
                      <span className="text-[10px] font-bold text-red-400">-{step.dropOffRate}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Lead Scores View ────────────────────────────────────────

function LeadsView({ data }: { data: LeadScoreEntry[] }) {
  if (data.length === 0) {
    return <EmptyState icon={Zap} text="Chưa có dữ liệu lead score. Cần khách hàng đã đăng nhập tương tác (xem SP, thêm giỏ, mua hàng)." />;
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 20).map((lead) => (
        <Card key={lead.userId} className="rounded-xl border-zinc-700/50 bg-[#111113]">
          <CardContent className="p-4">
            {/* Header: user + score */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-sky-500/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-teal-400" />
                  </div>
                  <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center ${
                    lead.score >= 70 ? "bg-emerald-500 text-white" :
                    lead.score >= 40 ? "bg-amber-500 text-white" :
                    "bg-zinc-600 text-zinc-200"
                  }`}>
                    {lead.score}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{lead.userName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500 truncate">{lead.userEmail}</span>
                    {lead.phone && (
                      <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                        <Phone className="h-2.5 w-2.5" /> {lead.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <SegmentBadge segment={lead.segment} />
                <BuyerStageBadge stage={lead.buyerStage} />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mt-3 pt-3 border-t border-zinc-800">
              <MetricItem label="Intent" value={lead.intentScore.toString()} highlight={lead.intentScore >= 50} />
              <MetricItem label="Churn Risk" value={`${lead.churnRisk}%`} highlight={lead.churnRisk >= 40} isNeg />
              <MetricItem label="Đơn hàng" value={lead.totalOrders.toString()} />
              <MetricItem label="Tổng chi" value={formatPrice(lead.totalSpent)} highlight={lead.totalSpent > 0} />
              <MetricItem label="Điểm" value={lead.loyaltyPoints.toString()} />
              <MetricItem label="Giỏ hàng" value={lead.cartValue > 0 ? formatPrice(lead.cartValue) : "Trống"} highlight={lead.cartValue > 0} />
            </div>

            {/* Cart items */}
            {lead.cartItems.length > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-800">
                <p className="text-[9px] font-bold uppercase text-zinc-500 mb-1">Trong giỏ hàng:</p>
                <div className="flex flex-wrap gap-1">
                  {lead.cartItems.map((item, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 truncate max-w-[200px]">
                      {item.name} x{item.qty} ({formatPrice(item.price)})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {lead.productAffinity.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[9px] font-bold uppercase text-zinc-500 mr-1">Quan tâm:</span>
                {lead.productAffinity.map((a, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">{a.category}</span>
                ))}
              </div>
            )}

            {/* AI Recommendations */}
            {lead.aiRecommendations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-800">
                <div className="flex items-start gap-1.5">
                  <Star className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {lead.aiRecommendations.map((r, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Signals */}
            {lead.signals.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {lead.signals.slice(0, 5).map((s, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{s}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Abandoned Sessions View ─────────────────────────────────

function AbandonedView({ data }: { data: AbandonedSession[] }) {
  if (data.length === 0) {
    return <EmptyState icon={ShoppingCart} text="Không có giỏ hàng bị bỏ trong 2h qua" />;
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-bold text-amber-400">{data.length} giỏ hàng bị bỏ</p>
            <span className="text-xs text-zinc-400 ml-auto">
              Tổng: {formatPrice(data.reduce((s, d) => s + d.cartValue, 0))}
            </span>
          </div>
        </CardContent>
      </Card>

      {data.map((session) => (
        <Card key={session.sessionId} className="rounded-xl border-zinc-700/50 bg-[#111113]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100">
                  {session.userName || "Khách ẩn danh"}
                </p>
                {session.email && <p className="text-[10px] text-zinc-500">{session.email}</p>}
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Ở lại {session.durationMinutes} phút • Dừng tại: {session.farthestStage}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-400">{formatPrice(session.cartValue)}</p>
                <p className="text-[10px] text-zinc-500">{session.productsViewed.length} SP xem</p>
              </div>
            </div>
            {session.productsViewed.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-zinc-800">
                {session.productsViewed.map((p) => (
                  <span key={p.id} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 truncate max-w-[150px]">
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Search Intents View ─────────────────────────────────────

function SearchView({ data }: { data: SearchIntent[] }) {
  if (data.length === 0) {
    return <EmptyState icon={Search} text="Chưa có dữ liệu tìm kiếm" />;
  }

  return (
    <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-bold text-zinc-100">Top Tìm Kiếm</h3>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{data.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Từ khóa</th>
                <th className="text-center py-2 px-3 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Lượt</th>
                <th className="text-center py-2 px-3 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">KQ TB</th>
                <th className="text-center py-2 px-3 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">CTR</th>
                <th className="text-center py-2 pl-3 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.map((intent) => (
                <tr key={intent.query} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2.5 pr-3 text-zinc-200 font-medium truncate max-w-[200px]">{intent.query}</td>
                  <td className="py-2.5 px-3 text-center text-zinc-300">{intent.count}</td>
                  <td className="py-2.5 px-3 text-center text-zinc-400">{intent.avgResultsCount}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold ${intent.clickThroughRate >= 30 ? "text-emerald-400" : intent.clickThroughRate >= 10 ? "text-amber-400" : "text-red-400"}`}>
                      {intent.clickThroughRate}%
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-center">
                    {intent.hasResults ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">Có KQ</span>
                    ) : (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400">Không KQ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Retention Cohort View ───────────────────────────────────

function RetentionView({ data }: { data: RetentionCohort[] }) {
  if (data.length === 0) {
    return <EmptyState icon={Users} text="Chưa có dữ liệu retention" />;
  }

  return (
    <Card className="rounded-2xl border-zinc-700/50 bg-[#111113]">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-bold text-zinc-100">Retention Cohort</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tháng</th>
                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Users</th>
                {data[0]?.retentionRates.map((_, i) => (
                  <th key={i} className="text-center py-2 px-2 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                    {i === 0 ? "M0" : `+${i}M`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((cohort) => (
                <tr key={cohort.cohortMonth} className="border-b border-zinc-800/50">
                  <td className="py-2.5 pr-3 text-zinc-200 font-medium">{cohort.cohortMonth}</td>
                  <td className="py-2.5 px-2 text-center text-zinc-300">{cohort.totalUsers}</td>
                  {cohort.retentionRates.map((rate, i) => {
                    const bg =
                      rate >= 80 ? "bg-emerald-500/30 text-emerald-300" :
                      rate >= 50 ? "bg-teal-500/20 text-teal-300" :
                      rate >= 20 ? "bg-amber-500/20 text-amber-300" :
                      "bg-red-500/10 text-red-400";
                    return (
                      <td key={i} className="py-2.5 px-2 text-center">
                        <span className={`inline-block w-full rounded px-1 py-0.5 text-[10px] font-bold ${bg}`}>
                          {rate}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helper Components ───────────────────────────────────────

function EmptyState({ icon: Icon, text }: { icon: typeof TrendingUp; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-8 w-8 text-zinc-600 mb-3" />
      <p className="text-sm text-zinc-500 max-w-sm">{text}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-[#111113] p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-lg font-black text-zinc-100 mt-0.5">{value}</p>
    </div>
  );
}

function MetricItem({ label, value, highlight, isNeg }: { label: string; value: string; highlight?: boolean; isNeg?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase text-zinc-500">{label}</p>
      <p className={`text-xs font-bold ${highlight ? (isNeg ? "text-red-400" : "text-teal-400") : "text-zinc-400"}`}>
        {value}
      </p>
    </div>
  );
}

function SegmentBadge({ segment }: { segment: string }) {
  const colors: Record<string, string> = {
    "VIP": "text-violet-400 bg-violet-500/20 border-violet-500/30",
    "Premium": "text-amber-400 bg-amber-500/20 border-amber-500/30",
    "Thường xuyên": "text-sky-400 bg-sky-500/20 border-sky-500/30",
    "Đã mua": "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    "Khách mới": "text-zinc-400 bg-zinc-700/50 border-zinc-600/30",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${colors[segment] || colors["Khách mới"]}`}>
      {segment}
    </span>
  );
}

function BuyerStageBadge({ stage }: { stage: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    awareness: { label: "Nhận biết", color: "text-zinc-400 bg-zinc-700/50" },
    consideration: { label: "Cân nhắc", color: "text-sky-400 bg-sky-500/20" },
    intent: { label: "Có ý định", color: "text-amber-400 bg-amber-500/20" },
    purchase: { label: "Đã mua", color: "text-emerald-400 bg-emerald-500/20" },
    loyalty: { label: "Trung thành", color: "text-violet-400 bg-violet-500/20" },
  };
  const s = labels[stage] || labels.awareness;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.color}`}>
      {s.label}
    </span>
  );
}
