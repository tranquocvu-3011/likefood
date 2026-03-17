"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Zap, CalendarRange, Clock, Loader2, Trash2, PackageSearch } from "lucide-react";
import { toast } from "sonner";

interface FlashSaleCampaign {
    id: number;
    name: string;
    startAt: string;
    endAt: string;
    isActive: boolean;
    products: FlashSaleProduct[];
}

interface FlashSaleProduct {
    id: number;
    productId: number;
    flashSalePrice: number;
    stockLimit: number | null;
    soldCount: number;
    product: {
        id: number;
        name: string;
        slug: string | null;
        image: string | null;
        price: number;
        category: string;
        ratingAvg: number;
        soldCount: number;
    };
}

interface ProductOption {
    id: number;
    name: string;
    price: number;
    category: string;
}

export default function AdminFlashSalesPage() {
    const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newStartAt, setNewStartAt] = useState("");
    const [newEndAt, setNewEndAt] = useState("");
    const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
    const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [flashPrice, setFlashPrice] = useState("");
    const [stockLimit, setStockLimit] = useState("");
    const [isDeletingCampaignId, setIsDeletingCampaignId] = useState<number | null>(null);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/flash-sales");
            if (!res.ok) {
                toast.error("Không thể tải danh sách Flash Sale");
                return;
            }
            const data = await res.json();
            setCampaigns(data);
        } catch {
            toast.error("Lỗi kết nối tới server");
        } finally {
            setIsLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            setIsLoadingProducts(true);
            const res = await fetch("/api/products?limit=100");
            if (!res.ok) return;
            const data = await res.json();
            const items: ProductOption[] = (data.products || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
            }));
            setAvailableProducts(items);
        } catch {
            // silent
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleCreateCampaign = async () => {
        if (!newName || !newStartAt || !newEndAt) {
            toast.error("Vui lòng nhập đủ tên, thời gian bắt đầu và kết thúc");
            return;
        }
        try {
            setIsCreating(true);
            const res = await fetch("/api/flash-sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, startAt: newStartAt, endAt: newEndAt }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                toast.error(err?.error || "Không thể tạo campaign mới");
                return;
            }
            toast.success("Đã tạo Flash Sale mới");
            setNewName(""); setNewStartAt(""); setNewEndAt("");
            await loadCampaigns();
        } catch { toast.error("Lỗi kết nối khi tạo campaign"); }
        finally { setIsCreating(false); }
    };

    const handleAddProductToCampaign = async () => {
        if (!selectedCampaignId || !selectedProductId || !flashPrice) {
            toast.error("Chọn campaign, sản phẩm và giá flash sale");
            return;
        }
        const price = parseFloat(flashPrice);
        if (Number.isNaN(price) || price <= 0) { toast.error("Giá flash sale không hợp lệ"); return; }
        try {
            const res = await fetch(`/api/flash-sales/${selectedCampaignId}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: selectedProductId, flashSalePrice: price, stockLimit: stockLimit ? parseInt(stockLimit, 10) : undefined }),
            });
            if (!res.ok) { const err = await res.json().catch(() => null); toast.error(err?.error || "Không thể thêm sản phẩm vào Flash Sale"); return; }
            toast.success("Đã thêm sản phẩm vào Flash Sale");
            setFlashPrice(""); setStockLimit(""); setSelectedProductId("");
            await loadCampaigns();
        } catch { toast.error("Lỗi kết nối khi thêm sản phẩm"); }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm("Xóa toàn bộ chiến dịch này? Thao tác không thể hoàn tác.")) return;
        setIsDeletingCampaignId(Number(campaignId));
        try {
            const res = await fetch(`/api/flash-sales/${campaignId}`, { method: "DELETE" });
            if (!res.ok) { const err = await res.json().catch(() => null); toast.error(err?.error || "Không thể xóa chiến dịch"); return; }
            toast.success("Đã xóa chiến dịch Flash Sale");
            if (String(selectedCampaignId) === String(campaignId)) setSelectedCampaignId(null);
            await loadCampaigns();
        } catch { toast.error("Lỗi kết nối khi xóa chiến dịch"); }
        finally { setIsDeletingCampaignId(null); }
    };

    const handleRemoveProduct = async (campaignId: string, productId: number) => {
        try {
            const res = await fetch(`/api/flash-sales/${campaignId}/products?productId=${productId}`, { method: "DELETE" });
            if (!res.ok) { const err = await res.json().catch(() => null); toast.error(err?.error || "Không thể xoá sản phẩm khỏi Flash Sale"); return; }
            toast.success("Đã xoá sản phẩm khỏi Flash Sale");
            await loadCampaigns();
        } catch { toast.error("Lỗi kết nối khi xoá sản phẩm"); }
    };

    const inputClass = "w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 placeholder:text-zinc-500";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-semibold text-white">Flash Sale</h1>
                    <p className="text-zinc-500 text-sm">
                        Quản lý các chiến dịch Flash Sale, thời gian diễn ra và sản phẩm tham gia khuyến mãi.
                    </p>
                </div>
            </div>

            {/* Create campaign */}
            <div className="rounded-lg border border-zinc-800 bg-[#111113]">
                <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Tạo chiến dịch Flash Sale mới</h3>
                        <p className="text-xs text-zinc-500">Nhập tên và khoảng thời gian diễn ra chương trình.</p>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Tên chiến dịch</label>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Flash Sale cuối tuần" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Bắt đầu</label>
                            <input type="datetime-local" value={newStartAt} onChange={(e) => setNewStartAt(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500">Kết thúc</label>
                            <input type="datetime-local" value={newEndAt} onChange={(e) => setNewEndAt(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleCreateCampaign} disabled={isCreating} className="bg-orange-500 hover:bg-orange-400 text-white rounded-lg px-5 py-2 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/25">
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Tạo campaign
                        </Button>
                    </div>
                </div>
            </div>

            {/* Campaigns list */}
            <div className="rounded-lg border border-zinc-800 bg-[#111113]">
                <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                    <CalendarRange className="w-4 h-4 text-zinc-500" />
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-100">Danh sách chiến dịch</h3>
                        <p className="text-xs text-zinc-500">Bấm vào 1 campaign để quản lý sản phẩm tham gia.</p>
                    </div>
                </div>
                <div>
                    {isLoading ? (
                        <div className="py-10 flex items-center justify-center gap-3 text-zinc-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải danh sách Flash Sale...
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
                            <PackageSearch className="w-6 h-6 text-zinc-700" />
                            Chưa có campaign Flash Sale nào.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800/50">
                            {campaigns.map((c) => {
                                const start = new Date(c.startAt);
                                const end = new Date(c.endAt);
                                const now = new Date();
                                const isRunning = c.isActive && start <= now && end >= now;
                                return (
                                    <div key={c.id} className={`w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-800/40 transition-colors ${selectedCampaignId === c.id ? "bg-zinc-800/40" : ""}`}>
                                        <button className="flex-1 text-left" onClick={() => { setSelectedCampaignId(c.id); if (availableProducts.length === 0) loadProducts(); }}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-zinc-100">{c.name}</span>
                                                    {isRunning && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-orange-500/20 text-orange-400">
                                                            Đang chạy
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {start.toLocaleString("vi-VN")} - {end.toLocaleString("vi-VN")}
                                                    </span>
                                                    <span className="text-zinc-700">•</span>
                                                    <span>{c.products?.length || 0} sản phẩm</span>
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(String(c.id)); }}
                                            disabled={isDeletingCampaignId === c.id}
                                            className="flex-shrink-0 p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                                            title="Xóa chiến dịch"
                                        >
                                            {isDeletingCampaignId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign products manager */}
            <AnimatePresence>
                {selectedCampaignId && (
                    <motion.div key={selectedCampaignId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="rounded-lg border border-zinc-700/50 bg-[#111113]">
                            <div className="p-4 border-b border-zinc-700/50">
                                <h3 className="text-sm font-semibold text-zinc-100">Sản phẩm trong Flash Sale</h3>
                                <p className="text-xs text-zinc-500">Thêm sản phẩm vào chiến dịch đang chọn, đặt giá flash sale và giới hạn số lượng.</p>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Chọn sản phẩm</label>
                                        <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className={inputClass}>
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {availableProducts.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name} - ${p.price.toFixed(2)}</option>
                                            ))}
                                        </select>
                                        {isLoadingProducts && (
                                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Đang tải danh sách sản phẩm...
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Giá Flash Sale (USD)</label>
                                        <input type="number" min={0} step="0.01" value={flashPrice} onChange={(e) => setFlashPrice(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-zinc-500">Giới hạn số lượng (tuỳ chọn)</label>
                                        <input type="number" min={0} value={stockLimit} onChange={(e) => setStockLimit(e.target.value)} className={inputClass} placeholder="VD: 50" />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleAddProductToCampaign} className="bg-orange-500 hover:bg-orange-400 text-white rounded-lg px-5 py-2 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/25">
                                        <Plus className="w-4 h-4" /> Thêm sản phẩm
                                    </Button>
                                </div>

                                {/* Products table */}
                                <div className="mt-4 border border-zinc-700/50 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-800/30">
                                            <tr className="text-xs text-zinc-400">
                                                <th className="px-4 py-3 text-left font-medium">Sản phẩm</th>
                                                <th className="px-4 py-3 text-left font-medium">Giá gốc</th>
                                                <th className="px-4 py-3 text-left font-medium">Giá Flash</th>
                                                <th className="px-4 py-3 text-left font-medium">Đã bán</th>
                                                <th className="px-4 py-3 text-left font-medium">Giới hạn</th>
                                                <th className="px-4 py-3 text-right font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns
                                                .find((c) => c.id === selectedCampaignId)
                                                ?.products?.map((fp) => (
                                                    <tr key={fp.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-zinc-100 line-clamp-1">{fp.product.name}</span>
                                                                <span className="text-xs text-zinc-600">{fp.product.category}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-zinc-500 font-medium">${fp.product.price.toFixed(2)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-orange-400 font-semibold">${fp.flashSalePrice.toFixed(2)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-zinc-400 font-medium">{fp.soldCount}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-zinc-400 font-medium">{fp.stockLimit ?? "Không giới hạn"}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleRemoveProduct(String(selectedCampaignId), fp.productId)}
                                                                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {campaigns.find((c) => c.id === selectedCampaignId)?.products?.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-zinc-600">
                                                        Chưa có sản phẩm nào trong chiến dịch này.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
