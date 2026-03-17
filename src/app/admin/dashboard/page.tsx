"use client";

/**
 * LIKEFOOD - Premium Admin Dashboard
 * Dark Gray Enterprise Dashboard Style - 2026 Edition
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  ArrowRight, 
  Boxes, 
  ClipboardList, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Users,
  DollarSign,
  ShoppingCart,
  Plus,
  RefreshCw
} from "lucide-react";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/currency";

interface DashboardData {
  revenue: { total: number; change: number };
  orders: { total: number; pending: number; processing?: number; shipping: number; delivered?: number; completed: number; cancelled?: number; change: number };
  customers: { total: number; change: number };
  products: { total: number; lowStock: number };
  recentOrders: Array<{ id: string; userEmail: string; total: number; status: string; createdAt?: string }>;
  lowStockProducts: Array<{ id: string; name: string; inventory: number; slug?: string | null }>;
  topProducts: Array<{ id: string; name: string; image?: string | null; soldCount: number; revenue: number }>;
  revenueChart: Array<{ label: string; value: number }>;
  aiInsights: Array<{ title: string; description: string; type: string; metric?: string }>;
}

const RANGES = [
  { value: "week", label: "7D" },
  { value: "month", label: "30D" },
  { value: "quarter", label: "90D" },
];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [range, setRange] = useState("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      if (range === "week") startDate.setDate(startDate.getDate() - 7);
      else if (range === "month") startDate.setMonth(startDate.getMonth() - 1);
      else startDate.setMonth(startDate.getMonth() - 3);

      const [analyticsRes, ordersRes, productsRes, aiRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/orders?page=1&limit=5`),
        fetch(`/api/products?limit=8&sort=best-selling`),
        fetch(`/api/ai/admin?type=analytics`),
      ]);

      const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
      const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
      const aiData = aiRes.ok ? await aiRes.json() : { insights: [] };

      const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
      const products = Array.isArray(productsData?.products) ? productsData.products : [];

      setData({
        revenue: analytics?.revenue || { total: 0, change: 0 },
        orders: analytics?.orders || { total: 0, pending: 0, shipping: 0, completed: 0, change: 0 },
        customers: analytics?.customers || { total: 0, change: 0 },
        products: analytics?.products || { total: 0, lowStock: 0 },
        recentOrders: orders,
        lowStockProducts: products.filter((product: { inventory: number }) => product.inventory < 10).slice(0, 5),
        topProducts: products.slice(0, 5).map((product: { id: string; name: string; image?: string | null; soldCount?: number; price: number }) => ({
          id: product.id,
          name: product.name,
          image: product.image,
          soldCount: product.soldCount || 0,
          revenue: (product.soldCount || 0) * product.price,
        })),
        revenueChart: analytics?.revenueByDay?.slice(-7).map((item: { date: string; revenue: number }) => ({
          label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
          value: item.revenue,
        })) || [],
        aiInsights: Array.isArray(aiData?.insights) ? aiData.insights : [],
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const maxChartValue = useMemo(() => Math.max(...(data?.revenueChart.map((item) => item.value) || [0]), 1), [data]);

  // Get greeting based on time
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{greeting()}, {session?.user?.name || 'Admin'}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Here&apos;s what&apos;s happening today</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            className="p-2 rounded-md border border-zinc-700/50 bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex items-center rounded-md border border-zinc-700/50 bg-zinc-900 p-0.5">
            {RANGES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  range === option.value 
                    ? 'bg-zinc-800 text-zinc-100' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Revenue" 
          value={formatPrice(data.revenue.total)} 
          change={data.revenue.change}
          icon={DollarSign}
          accentColor="text-teal-400"
        />
        <KPICard 
          title="Orders" 
          value={data.orders.total.toString()} 
          meta={data.orders.pending > 0 ? `${data.orders.pending} pending` : undefined}
          icon={ShoppingCart}
          accentColor="text-blue-400"
        />
        <KPICard 
          title="Customers" 
          value={data.customers.total.toString()} 
          change={data.customers.change}
          icon={Users}
          accentColor="text-violet-400"
        />
        <KPICard 
          title="Low Stock" 
          value={data.products.lowStock.toString()} 
          meta={`/ ${data.products.total} products`}
          icon={Boxes}
          accentColor={data.products.lowStock > 0 ? "text-amber-400" : "text-zinc-400"}
          warning={data.products.lowStock > 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-4">
          {/* Revenue Chart */}
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-300">Revenue Trend</h3>
              <Link href="/admin/analytics" className="text-xs text-zinc-500 hover:text-teal-400 transition-colors flex items-center gap-1">
                View analytics <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {data.revenueChart.length === 0 ? (
              <div className="h-36 flex items-center justify-center border border-dashed border-zinc-700/50 rounded-lg">
                <p className="text-xs text-zinc-600">No revenue data available</p>
              </div>
            ) : (
              <div className="flex h-36 items-end gap-2">
                {data.revenueChart.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-zinc-600">{formatPrice(item.value)}</span>
                    <div className="flex h-24 w-full items-end rounded bg-zinc-900/50 p-1">
                      <div 
                        className="w-full rounded-sm bg-gradient-to-t from-teal-600 to-teal-500" 
                        style={{ height: `${Math.max((item.value / maxChartValue) * 100, 6)}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-300">Recent Orders</h3>
              <Link href="/admin/orders" className="text-xs text-zinc-500 hover:text-teal-400 transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {data.recentOrders.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-zinc-700/50 rounded-lg">
                  <p className="text-xs text-zinc-600">No orders yet</p>
                </div>
              ) : (
                data.recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between rounded-md border border-zinc-700/50 bg-zinc-900/30 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200">#{order.id}</p>
                      <p className="text-xs text-zinc-500 truncate max-w-[180px]">{order.userEmail || 'Guest'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold text-zinc-200">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                AI Insights
              </h3>
              <Link href="/admin/ai" className="text-xs text-zinc-500 hover:text-teal-400 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {data.aiInsights.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-zinc-700/50 rounded-lg">
                  <p className="text-xs text-zinc-600">No insights available</p>
                </div>
              ) : (
                data.aiInsights.slice(0, 4).map((insight, index) => (
                  <div 
                    key={index} 
                    className="rounded-md border border-zinc-700/50 bg-zinc-900/30 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 truncate">{insight.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{insight.description}</p>
                      </div>
                      <InsightBadge type={insight.type} metric={insight.metric} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Low Stock
              </h3>
              <Link href="/admin/products" className="text-xs text-zinc-500 hover:text-teal-400 transition-colors">
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {data.lowStockProducts.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-zinc-700/50 rounded-lg">
                  <p className="text-xs text-zinc-600">All products in stock</p>
                </div>
              ) : (
                data.lowStockProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between rounded-md border border-zinc-700/50 bg-zinc-900/30 px-3 py-2"
                  >
                    <p className="truncate text-sm text-zinc-300 max-w-[160px]">{product.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-amber-400">{product.inventory}</span>
                      <span className="text-xs text-zinc-600">left</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link 
                href="/admin/products/new" 
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-700/50 bg-zinc-900/50 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Link>
              <Link 
                href="/admin/orders" 
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-700/50 bg-zinc-900/50 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  change, 
  meta,
  icon: Icon,
  accentColor,
  warning 
}: { 
  title: string; 
  value: string; 
  change?: number;
  meta?: string;
  icon: typeof DollarSign;
  accentColor: string;
  warning?: boolean;
}) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{title}</p>
          <p className={`mt-1.5 text-2xl font-bold ${accentColor}`}>{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change.toFixed(1)}% from last period
            </p>
          )}
          {meta && (
            <p className="text-xs text-zinc-600 mt-1">{meta}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-zinc-900/50 ${warning ? 'text-amber-400' : accentColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
    CONFIRMED: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Confirmed' },
    PROCESSING: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Processing' },
    SHIPPING: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Shipping' },
    DELIVERED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Delivered' },
    COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
    REFUNDED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Refunded' },
  };

  const config = statusConfig[status] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: status };
  
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// Insight Badge Component
function InsightBadge({ type, metric }: { type: string; metric?: string }) {
  const config = {
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    trend: { bg: 'bg-teal-500/10', text: 'text-teal-400' },
  }[type] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400' };

  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${config.bg} ${config.text}`}>
      {metric || type}
    </span>
  );
}
