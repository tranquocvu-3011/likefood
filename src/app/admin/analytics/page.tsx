"use client";

/**
 * LIKEFOOD - Premium Analytics Dashboard
 * Phase 3: Dark Theme, Focus, Executive Summary
 */

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Loader2, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface AnalyticsData {
  revenue: { total: number; change: number };
  orders: { total: number; pending: number; processing?: number; shipping: number; delivered?: number; completed: number; cancelled?: number; change: number };
  customers: { total: number; change: number };
  products: { total: number; lowStock: number };
  revenueByDay: { date: string; revenue: number }[];
  topProducts: Array<{ id: string; name: string; image?: string | null; quantitySold: number }>;
}

const RANGES = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
  { value: 365, label: '1Y' },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const response = await fetch(`/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        const nextData = await response.json().catch(() => ({}));
        if (response.ok) {
          setData(nextData);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [days]);

  const averageOrderValue = data && data.orders.total > 0 ? data.revenue.total / data.orders.total : 0;
  const conversionProxy = data && data.customers.total > 0 ? (data.orders.total / data.customers.total) * 100 : 0;
  const completionRate = data && data.orders.total > 0 ? (data.orders.completed / data.orders.total) * 100 : 0;

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Phân tích</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Tổng quan hiệu suất kinh doanh</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-1">
          {RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setDays(range.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === range.value
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-teal-400" />
          Tổng quan điều hành
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
            <p className="text-xs text-zinc-500 mb-1">Xu hướng doanh thu</p>
            <p className={`text-lg font-bold ${data.revenue.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.revenue.change >= 0 ? '+' : ''}{data.revenue.change}% so với kỳ trước
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
            <p className="text-xs text-zinc-500 mb-1">Tỷ lệ hoàn thành</p>
            <p className="text-lg font-bold text-zinc-100">{completionRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
            <p className="text-xs text-zinc-500 mb-1">Cần chú ý</p>
            <p className="text-lg font-bold text-amber-400">
              {data.orders.pending} đơn chờ xử lý
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard 
          label="Doanh thu" 
          value={formatPrice(data.revenue.total)} 
          change={data.revenue.change}
          icon={DollarSign}
        />
        <KpiCard 
          label="Đơn hàng" 
          value={data.orders.total.toString()} 
          change={data.orders.change}
          icon={BarChart3}
        />
        <KpiCard 
          label="Khách hàng" 
          value={data.customers.total.toString()} 
          change={data.customers.change}
          icon={Users}
        />
        <KpiCard 
          label="TB/Đơn" 
          value={formatPrice(averageOrderValue)} 
          icon={Target}
        />
        <KpiCard 
          label="Chuyển đổi" 
          value={`${conversionProxy.toFixed(1)}%`} 
          icon={ArrowUpRight}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Revenue Chart */}
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Xu hướng doanh thu</h3>
          <div className="h-64 flex items-end gap-2">
            {data.revenueByDay.slice(-14).map((entry, i) => {
              const maxRev = Math.max(...data.revenueByDay.map(e => e.revenue), 1);
              const height = (entry.revenue / maxRev) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-teal-500/80 rounded-t hover:bg-teal-500 transition-colors"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={formatPrice(entry.revenue)}
                  />
                  <span className="text-[10px] text-zinc-500">{new Date(entry.date).getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Trạng thái đơn hàng</h3>
          <div className="space-y-3">
            <StatusRow label="Chờ xử lý" value={data.orders.pending} color="bg-amber-500" total={data.orders.total} />
            <StatusRow label="Đang xử lý" value={data.orders.processing || 0} color="bg-purple-500" total={data.orders.total} />
            <StatusRow label="Đang giao" value={data.orders.shipping} color="bg-cyan-500" total={data.orders.total} />
            <StatusRow label="Đã giao" value={data.orders.delivered || 0} color="bg-emerald-500" total={data.orders.total} />
            <StatusRow label="Hoàn thành" value={data.orders.completed} color="bg-teal-500" total={data.orders.total} />
            <StatusRow label="Đã hủy" value={data.orders.cancelled || 0} color="bg-red-500" total={data.orders.total} />
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Sản phẩm bán chạy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.topProducts.slice(0, 8).map((product, i) => (
            <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
              <span className="text-lg font-bold text-zinc-500 w-6">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{product.name}</p>
                <p className="text-xs text-zinc-500">{product.quantitySold} đã bán</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.products.lowStock > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-400">Cảnh báo tồn kho thấp</p>
              <p className="text-xs text-zinc-400">{data.products.lowStock} sản phẩm dưới mức tồn kho an toàn</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, change, icon: Icon }: { 
  label: string; 
  value: string; 
  change?: number;
  icon: any;
}) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500 uppercase">{label}</span>
        <Icon className="h-4 w-4 text-teal-500" />
      </div>
      <p className="text-xl font-bold text-zinc-100">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
          {Math.abs(change)}%
        </p>
      )}
    </div>
  );
}

function StatusRow({ label, value, color, total }: { 
  label: string; 
  value: number; 
  color: string;
  total: number;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="flex-1 text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-200">{value}</span>
      <span className="text-xs text-zinc-400 w-12 text-right">{percentage.toFixed(0)}%</span>
    </div>
  );
}
