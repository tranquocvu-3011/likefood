"use client";

/**
 * LIKEFOOD - Premium Orders Management Module
 * Phase 2: Enhanced Operations UX
 */

import { useCallback, useEffect, useState } from "react";
import { 
  CalendarDays, 
  ChevronDown, 
  ClipboardList, 
  Download, 
  Eye, 
  Loader2, 
  MoreHorizontal, 
  RefreshCw, 
  Search,
  X,
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

interface Order {
  id: number;
  userId: number;
  total: number;
  status: string;
  createdAt: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  itemCount?: number;
  shippingAddress?: string;
  paymentMethod?: string;
}

interface OrderDetail extends Order {
  items?: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  shipping?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  };
}

const STATUS_CONFIG = [
  { key: 'ALL', label: 'All', color: 'bg-zinc-500/10 text-zinc-400' },
  { key: 'PENDING', label: 'Pending', color: 'bg-amber-500/10 text-amber-400' },
  { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-500/10 text-blue-400' },
  { key: 'PROCESSING', label: 'Processing', color: 'bg-purple-500/10 text-purple-400' },
  { key: 'SHIPPING', label: 'Shipping', color: 'bg-cyan-500/10 text-cyan-400' },
  { key: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-500/10 text-emerald-400' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-teal-500/10 text-teal-400' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500/10 text-red-400' },
];

const NEXT_ACTIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
};

const PAGE_SIZE = 15;

const getStatusConfig = (statusKey: string) => {
  return STATUS_CONFIG.find(s => s.key === statusKey) || STATUS_CONFIG[0];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  // Selection & Drawer
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const debouncedSearch = search;

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: PAGE_SIZE.toString() 
      });
      if (status !== 'ALL') params.set('status', status);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      
      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Failed to load orders');
      
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotal(data.pagination?.total || data.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, debouncedSearch, dateFrom, dateTo]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, dateFrom, dateTo]);

  const updateStatus = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Failed to update status');
      
      toast.success(`Order #${String(orderId).slice(-6)} → ${nextStatus}`);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        loadOrderDetail(orderId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedOrders.size === 0) return;
    const ids = Array.from(selectedOrders);
    try {
      await Promise.all(ids.map(id => updateStatus(id, bulkStatus)));
      setSelectedOrders(new Set());
      setBulkStatus('');
    } catch {
      toast.error('Some orders failed to update');
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSelectedOrder(data);
      }
    } catch (error) {
      console.error('Failed to load order detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDrawer = (order: Order) => {
    setSelectedOrder(null);
    setDrawerOpen(true);
    loadOrderDetail(order.id);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const toggleSelect = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Orders</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage and track all orders</p>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="/api/admin/export?type=orders" 
            download
            className="px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
          <button 
            onClick={() => void loadOrders()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search order ID, phone, email..."
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

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-zinc-500" />
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
            />
            <span className="text-zinc-500">to</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_CONFIG.map((config) => (
          <button
            key={config.key}
            onClick={() => setStatus(config.key)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
              status === config.key
                ? 'bg-teal-600 text-white'
                : 'border border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-medium text-teal-400">
            {selectedOrders.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select 
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100"
            >
              <option value="">Update Status</option>
              {['CONFIRMED','PROCESSING','SHIPPING','DELIVERED','COMPLETED','CANCELLED'].map(s => (
                <option key={s} value={s}>→ {s}</option>
              ))}
            </select>
            <button 
              onClick={() => void applyBulkStatus()}
              disabled={!bulkStatus}
              className="h-8 px-3 rounded-md border border-teal-600/50 bg-teal-600/20 text-xs text-teal-300 hover:bg-teal-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            <button className="h-8 px-3 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
                <th className="w-10 px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-600 bg-zinc-800 text-teal-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-4 bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-8 bg-zinc-800 rounded" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-20 text-center">
                    <ClipboardList className="mx-auto h-10 w-10 text-zinc-500" />
                    <h3 className="mt-4 text-sm font-medium text-zinc-400">No orders found</h3>
                    <p className="mt-1 text-xs text-zinc-500">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusCfg = getStatusConfig(order.status);
                  return (
                    <tr 
                      key={order.id} 
                      className="transition-colors hover:bg-zinc-900/30"
                    >
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-zinc-600 bg-zinc-800 text-teal-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-sm font-semibold text-zinc-200">
                          #{order.id}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{order.itemCount || 0} items</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-zinc-200">{order.userName || 'Guest'}</p>
                        <p className="text-xs text-zinc-500">{order.userEmail || order.userPhone || '-'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {order.itemCount || 0}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-zinc-200">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => openDrawer(order)}
                          className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-zinc-700/50 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} orders
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 disabled:opacity-40"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(total / PAGE_SIZE)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-md text-xs font-medium ${
                      page === pageNum 
                        ? 'bg-teal-600 text-white' 
                        : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))}
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <OrderDrawer 
        order={selectedOrder}
        open={drawerOpen}
        onClose={closeDrawer}
        loading={detailLoading}
        updatingId={updatingId}
        onUpdateStatus={updateStatus}
      />
    </div>
  );
}

// Order Detail Drawer Component
function OrderDrawer({ 
  order, 
  open, 
  onClose, 
  loading,
  updatingId,
  onUpdateStatus 
}: { 
  order: OrderDetail | null; 
  open: boolean; 
  onClose: () => void;
  loading: boolean;
  updatingId: number | null;
  onUpdateStatus: (orderId: number, status: string) => void;
}) {
  if (!open) return null;

  const statusCfg = order ? getStatusConfig(order.status) : null;
  const nextActions = order ? NEXT_ACTIONS[order.status] : [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-zinc-700/50 bg-[#0A0A0B] shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700/50 bg-[#0A0A0B] px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {loading ? 'Loading...' : order ? `#${order.id}` : 'Order Details'}
            </h2>
            {order && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : order ? (
          <div className="p-4 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase ${statusCfg?.color}`}>
                  {statusCfg?.label}
                </span>
              </div>
              {nextActions.length > 0 && (
                <select
                  value=""
                  onChange={(e) => e.target.value && onUpdateStatus(order.id, e.target.value)}
                  disabled={String(updatingId) === String(order.id)}
                  className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100"
                >
                  <option value="">Update Status</option>
                  {nextActions.map(action => (
                    <option key={action} value={action}>→ {action}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Customer Info */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Customer
              </h3>
              <p className="text-sm font-medium text-zinc-200">{order.userName || 'Guest'}</p>
              <p className="text-xs text-zinc-500 mt-1">{order.userEmail || 'No email'}</p>
              {order.userPhone && (
                <p className="text-xs text-zinc-500">{order.userPhone}</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping
              </h3>
              <p className="text-sm text-zinc-300">{order.shippingAddress || 'No address provided'}</p>
            </div>

            {/* Payment */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment
              </h3>
              <p className="text-sm text-zinc-200">{order.paymentMethod || 'COD'}</p>
              <p className="text-lg font-bold text-teal-400 mt-2">{formatPrice(order.total)}</p>
            </div>

            {/* Items */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" /> Items ({order.itemCount || 0})
              </h3>
              <div className="space-y-3">
                {order.items ? order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                      <p className="text-xs text-zinc-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <p className="text-sm font-medium text-zinc-200">{formatPrice(item.quantity * item.price)}</p>
                  </div>
                )) : (
                  <p className="text-xs text-zinc-500">No item details available</p>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Timeline
              </h3>
              <div className="space-y-3">
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED'].map((step, i) => {
                  const stepIdx = STATUS_CONFIG.findIndex(s => s.key === order.status);
                  const isComplete = STATUS_CONFIG.findIndex(s => s.key === step) <= stepIdx;
                  const isCurrent = step === order.status;
                  
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        isComplete ? 'bg-teal-500' : 'bg-zinc-700'
                      }`} />
                      <span className={`text-xs ${
                        isCurrent ? 'font-semibold text-zinc-200' : 'text-zinc-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-zinc-500">
            Failed to load order details
          </div>
        )}
      </div>
    </>
  );
}
