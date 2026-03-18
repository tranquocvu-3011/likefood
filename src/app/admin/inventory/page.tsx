"use client";

/**
 * LIKEFOOD - Premium Inventory Management Module
 * Phase 3: Low-Stock-First Workflow, Risk Emphasis
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Download, 
  Package, 
  RefreshCw, 
  Search, 
  X,
  Plus,
  Minus,
  History } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

interface InventoryProduct {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  category: string;
  price: number;
  inventory: number;
  soldCount: number;
  lastRestocked?: string;
  reorderPoint?: number;
}

const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adjustingId, setAdjustingId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/inventory?sort=name");
      if (!res.ok) throw new Error("Không thể tải dữ liệu kho");
      const data = await res.json();
      const items: InventoryProduct[] = (data.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        category: p.category,
        price: p.price,
        inventory: p.inventory ?? 0,
        soldCount: p.soldCount ?? 0,
        lastRestocked: p.lastRestocked,
        reorderPoint: p.reorderPoint,
      }));
      setProducts(items);
    } catch (error) {
      toast.error("Không thể tải dữ liệu kho");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Stock filter
    if (stockFilter === "CRITICAL") {
      result = result.filter(p => p.inventory <= CRITICAL_STOCK_THRESHOLD);
    } else if (stockFilter === "LOW") {
      result = result.filter(p => p.inventory > CRITICAL_STOCK_THRESHOLD && p.inventory < LOW_STOCK_THRESHOLD);
    } else if (stockFilter === "OUT") {
      result = result.filter(p => p.inventory <= 0);
    } else if (stockFilter === "IN_STOCK") {
      result = result.filter(p => p.inventory >= LOW_STOCK_THRESHOLD);
    }
    
    // Category filter
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    return result;
  }, [products, search, stockFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => p.inventory <= 0).length;
    const critical = products.filter(p => p.inventory > 0 && p.inventory <= CRITICAL_STOCK_THRESHOLD).length;
    const low = products.filter(p => p.inventory > CRITICAL_STOCK_THRESHOLD && p.inventory < LOW_STOCK_THRESHOLD).length;
    const inStock = products.filter(p => p.inventory >= LOW_STOCK_THRESHOLD).length;
    return { total, outOfStock, critical, low, inStock };
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const quickAdjust = async (productId: number, delta: number) => {
    setAdjustingId(productId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, delta }),
      });
      if (!res.ok) throw new Error("Không thể điều chỉnh tồn kho");
      toast.success(`Đã điều chỉnh tồn kho ${delta > 0 ? '+' : ''}${delta}`);
      await fetchProducts();
    } catch {
      toast.error("Không thể điều chỉnh tồn kho");
    } finally {
      setAdjustingId(null);
    }
  };

  const getStockStatus = (inventory: number) => {
    if (inventory <= 0) return { label: "Hết hàng", color: "bg-red-500/10 text-red-400", priority: 1 };
    if (inventory <= CRITICAL_STOCK_THRESHOLD) return { label: "Nguy hiểm", color: "bg-red-500/10 text-red-400", priority: 2 };
    if (inventory < LOW_STOCK_THRESHOLD) return { label: "Sắp hết", color: "bg-amber-500/10 text-amber-400", priority: 3 };
    return { label: "Còn hàng", color: "bg-emerald-500/10 text-emerald-400", priority: 4 };
  };

  const openDrawer = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Kho hàng</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Quản lý tồn kho & cảnh báo hết hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => void fetchProducts()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button className="px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* Risk Alert Banner */}
      {(stats.critical > 0 || stats.outOfStock > 0) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-400">Cần chú ý</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {stats.outOfStock > 0 && `${stats.outOfStock} sản phẩm hết hàng. `}
                {stats.critical > 0 && `${stats.critical} sản phẩm ở mức nguy hiểm (<${CRITICAL_STOCK_THRESHOLD} đơn vị).`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Tổng sản phẩm</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Còn hàng</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.inStock}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Sắp hết</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.low}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Nguy hiểm</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{stats.critical}</p>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase">Hết hàng</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Tìm theo tên, SKU, danh mục..."
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
          
          <div className="flex items-center gap-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
            >
              <option value="ALL">Tất cả</option>
              <option value="IN_STOCK">Còn hàng</option>
              <option value="LOW">Sắp hết</option>
              <option value="CRITICAL">Nguy hiểm</option>
              <option value="OUT">Hết hàng</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stock Adjustment */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Giá</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Tồn kho</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Điều chỉnh</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-48 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-6 w-16 bg-zinc-800 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="h-8 w-24 bg-zinc-800 rounded" /></td>
                  <td className="px-4 py-4"><div className="h-8 w-8 bg-zinc-800 rounded" /></td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center">
                  <Package className="mx-auto h-10 w-10 text-zinc-500" />
                  <h3 className="mt-4 text-sm font-medium text-zinc-400">Không tìm thấy sản phẩm</h3>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const status = getStockStatus(product.inventory);
                return (
                  <tr key={product.id} className="transition-colors hover:bg-zinc-900/30">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.soldCount} đã bán</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400 font-mono">
                      {product.sku || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {product.category}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-zinc-200">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-zinc-200">{product.inventory}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => quickAdjust(product.id, -1)}
                          disabled={adjustingId === product.id || product.inventory <= 0}
                          className="p-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-red-400 hover:border-red-500/50 disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => quickAdjust(product.id, 1)}
                          disabled={adjustingId === product.id}
                          className="p-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openDrawer(product)}
                          className="p-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => openDrawer(product)}
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
      </div>

      {/* Detail Drawer */}
      <InventoryDrawer 
        product={selectedProduct}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdjust={quickAdjust}
      />
    </div>
  );
}

// Inventory Detail Drawer
function InventoryDrawer({ product, open, onClose, onAdjust }: { product: InventoryProduct | null; open: boolean; onClose: () => void; onAdjust: (id: number, delta: number) => Promise<void> }) {
  if (!open) return null;

  const status = product ? getStockStatus(product.inventory) : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-zinc-700/50 bg-[#0A0A0B] shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-700/50 bg-[#0A0A0B] px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Chi tiết tồn kho</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{product?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {product && (
          <div className="p-4 space-y-4">
            {/* Status Card */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <div className="flex items-center justify-between">
                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase ${status?.color}`}>
                  {status?.label}
                </span>
                <span className="text-2xl font-bold text-zinc-100">{product.inventory}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Mức tồn kho hiện tại</p>
            </div>

            {/* Product Info */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">SKU</span>
                <span className="text-sm font-mono text-zinc-300">{product.sku || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Danh mục</span>
                <span className="text-sm text-zinc-300">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Giá</span>
                <span className="text-sm font-semibold text-zinc-200">{formatPrice(product.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Đã bán</span>
                <span className="text-sm text-zinc-300">{product.soldCount}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Thao tác nhanh</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => void onAdjust(product.id, 10)} className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
                  +10 Tồn kho
                </button>
                <button onClick={() => void onAdjust(product.id, 50)} className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800">
                  +50 Tồn kho
                </button>
                <button disabled className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-500 cursor-not-allowed opacity-50" title="Tính năng đang phát triển">
                  Đặt hàng lại
                </button>
                <Link href={`/admin/products/${product.id}/edit`} onClick={onClose} className="px-3 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 text-center">
                  Xem sản phẩm
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function getStockStatus(inventory: number) {
  if (inventory <= 0) return { label: "Hết hàng", color: "bg-red-500/10 text-red-400", priority: 1 };
  if (inventory <= CRITICAL_STOCK_THRESHOLD) return { label: "Nguy hiểm", color: "bg-red-500/10 text-red-400", priority: 2 };
  if (inventory < LOW_STOCK_THRESHOLD) return { label: "Sắp hết", color: "bg-amber-500/10 text-amber-400", priority: 3 };
  return { label: "Còn hàng", color: "bg-emerald-500/10 text-emerald-400", priority: 4 };
}
