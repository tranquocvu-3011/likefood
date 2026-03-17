"use client";

/**
 * LIKEFOOD - Coupons Management Module
 * Dark Theme - Consistent with Admin Panel
 */

import { useState, useEffect, useCallback } from "react";
import {
    Ticket, Plus, Edit2, Trash2, X, Loader2,
    Search, Percent, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface Coupon {
    id: number;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number | null;
    startDate: string;
    endDate: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    createdAt: string;
}

const EMPTY_FORM = {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: "",
    endDate: "",
    usageLimit: 100,
    isActive: true,
};

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

    const fetchCoupons = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filter !== "all") params.set("status", filter);
            const res = await fetch(`/api/admin/coupons?${params}`);
            const data = await res.json();
            setCoupons(Array.isArray(data) ? data : (data.coupons || []));
        } catch {
            toast.error("Không thể tải danh sách mã giảm giá");
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId
                ? `/api/admin/coupons/${editingId}`
                : "/api/admin/coupons";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    discountValue: Number(form.discountValue),
                    minOrderValue: Number(form.minOrderValue),
                    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
                    usageLimit: Number(form.usageLimit),
                }),
            });

            if (res.ok) {
                toast.success(editingId ? "Cập nhật mã giảm giá thành công" : "Tạo mã giảm giá thành công");
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
                fetchCoupons();
            } else {
                const data = await res.json();
                // Show detailed field errors if available
                if (data.errors && Array.isArray(data.errors)) {
                    const messages = data.errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join('\n');
                    toast.error(messages || data.error || "Không thể lưu mã giảm giá");
                } else {
                    toast.error(data.error || "Không thể lưu mã giảm giá");
                }
            }
        } catch {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingId(coupon.id);
        setForm({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minOrderValue: coupon.minOrderValue,
            maxDiscount: coupon.maxDiscount || 0,
            startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "",
            endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split("T")[0] : "",
            usageLimit: coupon.usageLimit,
            isActive: coupon.isActive,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Đã xóa mã giảm giá");
                fetchCoupons();
            } else {
                toast.error("Không thể xóa mã giảm giá");
            }
        } catch {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setDeletingId(null);
        }
    };

    const getCouponStatus = (coupon: Coupon) => {
        const now = new Date();
        const end = new Date(coupon.endDate);
        const start = new Date(coupon.startDate);
        if (!coupon.isActive) return { label: "Tắt", color: "bg-zinc-500/10 text-zinc-400" };
        if (now > end) return { label: "Hết hạn", color: "bg-red-500/10 text-red-400" };
        if (now < start) return { label: "Sắp tới", color: "bg-blue-500/10 text-blue-400" };
        return { label: "Hoạt động", color: "bg-emerald-500/10 text-emerald-400" };
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">Mã giảm giá</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Quản lý voucher và khuyến mãi</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
                    className="px-3.5 py-2 rounded-md bg-teal-600 text-sm font-medium text-white hover:bg-teal-500 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Tạo mã mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase">Tổng mã</p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1">{coupons.length}</p>
                </div>
                <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {coupons.filter(c => c.isActive && new Date(c.endDate) > new Date()).length}
                    </p>
                </div>
                <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase">Hết hạn</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                        {coupons.filter(c => new Date(c.endDate) < new Date()).length}
                    </p>
                </div>
                <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase">Tổng lượt dùng</p>
                    <p className="text-2xl font-bold text-teal-400 mt-1">
                        {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                    </p>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm mã giảm giá..."
                            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {(["all", "active", "expired"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                                    filter === f
                                        ? "bg-teal-600 text-white"
                                        : "border border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                                }`}
                            >
                                {f === "all" ? "Tất cả" : f === "active" ? "Hoạt động" : "Hết hạn"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="rounded-lg border border-zinc-700/50 bg-[#0A0A0B] p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-100">
                                {editingId ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Mã giảm giá</label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="VD: SALE50, FREESHIP..."
                                    required
                                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none font-mono uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Loại giảm</label>
                                    <select
                                        value={form.discountType}
                                        onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                                    >
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                        <option value="FIXED">Số tiền ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Giá trị</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.discountValue}
                                            onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                                            min={0}
                                            required
                                            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                                            {form.discountType === "PERCENTAGE" ? "%" : "$"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Đơn tối thiểu ($)</label>
                                    <input
                                        type="number"
                                        value={form.minOrderValue}
                                        onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                                        min={0}
                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Giảm tối đa ($)</label>
                                    <input
                                        type="number"
                                        value={form.maxDiscount || ""}
                                        onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) || 0 })}
                                        min={0}
                                        placeholder="Không giới hạn"
                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        required
                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        required
                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Giới hạn sử dụng</label>
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                                        min={1}
                                        required
                                        className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            className="rounded border-zinc-600 bg-zinc-800 text-teal-500"
                                        />
                                        <span className="text-sm font-medium text-zinc-300">Kích hoạt ngay</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 bg-teal-600 text-white rounded-md font-medium text-sm hover:bg-teal-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Cập nhật" : "Tạo mã giảm giá"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupons Table */}
            <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Mã</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Loại</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Giá trị</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Đơn tối thiểu</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Thời hạn</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Đã dùng</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Trạng thái</th>
                                <th className="w-20 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-12 bg-zinc-800 rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full" /></td>
                                        <td className="px-4 py-4"><div className="h-8 w-16 bg-zinc-800 rounded" /></td>
                                    </tr>
                                ))
                            ) : filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-20 text-center">
                                        <Ticket className="mx-auto h-10 w-10 text-zinc-500" />
                                        <h3 className="mt-4 text-sm font-medium text-zinc-400">Chưa có mã giảm giá</h3>
                                        <p className="mt-1 text-xs text-zinc-500">Tạo mã giảm giá đầu tiên để thu hút khách hàng.</p>
                                    </td>
                                </tr>
                            ) : filteredCoupons.map((coupon) => {
                                const status = getCouponStatus(coupon);
                                return (
                                    <tr key={coupon.id} className="transition-colors hover:bg-zinc-900/30">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Ticket className="h-4 w-4 text-teal-400" />
                                                <span className="font-mono text-sm font-semibold text-teal-400">{coupon.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                {coupon.discountType === "PERCENTAGE" ? (
                                                    <Percent className="h-3.5 w-3.5 text-zinc-500" />
                                                ) : (
                                                    <DollarSign className="h-3.5 w-3.5 text-zinc-500" />
                                                )}
                                                <span className="text-sm text-zinc-400">
                                                    {coupon.discountType === "PERCENTAGE" ? "Phần trăm" : "Cố định"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-semibold text-zinc-200">
                                                {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-zinc-400">${coupon.minOrderValue}</td>
                                        <td className="px-4 py-4">
                                            <div className="text-xs text-zinc-500">
                                                <p>{new Date(coupon.startDate).toLocaleDateString("vi-VN")}</p>
                                                <p>→ {new Date(coupon.endDate).toLocaleDateString("vi-VN")}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-medium text-zinc-300">
                                                {coupon.usedCount} / {coupon.usageLimit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    disabled={deletingId === coupon.id}
                                                    className="p-2 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                                    title="Xóa"
                                                >
                                                    {deletingId === coupon.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
