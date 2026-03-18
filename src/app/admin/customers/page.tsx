"use client";

/**
 * LIKEFOOD - Premium Customers Management Module
 * Phase 3: Lifecycle, Segments, Detail Panel
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Download, 
  Loader2, 
  Mail, 
  Phone, 
  RefreshCw, 
  Search, 
  Star,
  X,
  Calendar,
  Award,
  User,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

interface Customer {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
  lastOrderAt?: string;
  _count: {
    reviews: number;
    wishlists: number;
  };
}

interface CustomerSegment {
  segment: string;
  count: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface CustomerOrder {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search) params.set('search', search);
      const response = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Failed to load customers');
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const loadSegments = async () => {
    try {
      const res = await fetch('/api/ai/admin?type=customers');
      if (res.ok) {
        const data = await res.json();
        setSegments(data.segments || []);
      }
    } catch (_error) {
      console.error('Failed to load segments:', _error);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const loadCustomerOrders = async (customerId: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders?userId=${customerId}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
      }
    } catch (_error) {
      console.error('Failed to load orders:', _error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openDrawer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
    await loadCustomerOrders(String(customer.id));
  };

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const searchLower = search.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.phone?.includes(search)
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    const totalCustomers = total;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const repeatCustomers = customers.filter(c => c.orderCount > 1).length;
    return { totalCustomers, totalRevenue, avgSpend, repeatCustomers };
  }, [customers, total]);

  const getCustomerSegment = (customer: Customer) => {
    if (customer.orderCount >= 5 && customer.totalSpent >= 500) {
      return { label: 'VIP', color: 'bg-amber-500/10 text-amber-400' };
    }
    if (customer.orderCount >= 3) {
      return { label: 'Regular', color: 'bg-emerald-500/10 text-emerald-400' };
    }
    if (customer.orderCount === 1) {
      return { label: 'New', color: 'bg-blue-500/10 text-blue-400' };
    }
    return { label: 'One-time', color: 'bg-zinc-500/10 text-zinc-400' };
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Customers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Customer management & segmentation</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => void loadCustomers()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button disabled className="px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-500 cursor-not-allowed opacity-50 flex items-center gap-2" title="Tính năng đang phát triển">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Total Customers</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.totalCustomers}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-teal-400 mt-1">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Avg. Spend</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{formatPrice(stats.avgSpend)}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Repeat Customers</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.repeatCustomers}</p>
        </div>
      </div>

      {/* Segment Cards */}
      {segments.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {segments.slice(0, 4).map((seg) => (
            <div key={seg.segment} className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-teal-400" />
                <p className="text-xs font-semibold uppercase text-zinc-400">{seg.segment}</p>
              </div>
              <p className="text-xl font-bold text-zinc-100">{seg.count}</p>
              <p className="text-xs text-zinc-500 mt-1">Avg. {formatPrice(seg.avgOrderValue)}/order</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Segment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Orders</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Spent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Last Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Reviews</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-12 w-48 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-12 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-8 w-8 bg-zinc-800 rounded" /></td>
                </tr>
              ))
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center">
                  <User className="mx-auto h-10 w-10 text-zinc-500" />
                  <h3 className="mt-4 text-sm font-medium text-zinc-400">No customers found</h3>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const segment = getCustomerSegment(customer);
                return (
                  <tr key={customer.id} className="transition-colors hover:bg-zinc-900/30">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{customer.name || 'No name'}</p>
                        <p className="text-xs text-zinc-500">{customer.email}</p>
                        {customer.phone && (
                          <p className="text-xs text-zinc-500">{customer.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${segment.color}`}>
                        {segment.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {customer.orderCount}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-zinc-200">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {customer.lastOrderAt ? getTimeSince(customer.lastOrderAt) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {customer._count.reviews > 0 && (
                          <>
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                            <span className="text-sm text-zinc-300">{customer._count.reviews}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => openDrawer(customer)}
                        className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between border-t border-zinc-700/50 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 disabled:opacity-40"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(total / 15)) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded-md text-xs font-medium ${
                    page === i + 1 
                      ? 'bg-teal-600 text-white' 
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDrawer 
        customer={selectedCustomer}
        orders={customerOrders}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={ordersLoading}
      />
    </div>
  );
}

// Customer Detail Drawer
function CustomerDrawer({ 
  customer, 
  orders, 
  open, 
  onClose,
  loading 
}: { 
  customer: Customer | null; 
  orders: CustomerOrder[];
  open: boolean; 
  onClose: () => void;
  loading: boolean;
}) {
  if (!open) return null;

  const segment = customer ? (
    customer.orderCount >= 5 ? { label: 'VIP', color: 'bg-amber-500/10 text-amber-400' } :
    customer.orderCount >= 3 ? { label: 'Regular', color: 'bg-emerald-500/10 text-emerald-400' } :
    customer.orderCount === 1 ? { label: 'New', color: 'bg-blue-500/10 text-blue-400' } :
    { label: 'One-time', color: 'bg-zinc-500/10 text-zinc-400' }
  ) : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-zinc-700/50 bg-[#0A0A0B] shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700/50 bg-[#0A0A0B] px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Customer Details</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{customer?.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {customer && (
          <div className="p-4 space-y-4">
            {/* Segment & Stats */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase ${segment?.color}`}>
                  {segment?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Total Spent</p>
                  <p className="text-xl font-bold text-teal-400">{formatPrice(customer.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Orders</p>
                  <p className="text-xl font-bold text-zinc-100">{customer.orderCount}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</h3>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-500" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  {customer.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Calendar className="h-4 w-4 text-zinc-500" />
                Joined {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Recent Orders</h3>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-xs text-zinc-500">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-2 rounded bg-zinc-900/50">
                      <div>
                        <p className="text-xs font-mono text-zinc-300">#{order.id}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-200">{formatPrice(order.total)}</p>
                        <p className="text-[10px] text-zinc-500">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button disabled className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-500 cursor-not-allowed opacity-50" title="Tính năng đang phát triển">
                  Send Email
                </button>
                <button disabled className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-500 cursor-not-allowed opacity-50" title="Tính năng đang phát triển">
                  Add to Segment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
