"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FolderTree, Plus, Pencil, Trash2, Loader2, Package, Search, X, Save } from "lucide-react";
import { toast } from "sonner";

interface CategoryInfo {
    id: number;
    name: string;
    nameEn: string | null;
    slug: string;
    description: string | null;
    descriptionEn: string | null;
    isActive: boolean;
    isVisible: boolean;
    productCount: number;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editNameEn, setEditNameEn] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newCategoryEn, setNewCategoryEn] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch {
            toast.error("Không thể tải danh sách danh mục");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleRename = async (cat: CategoryInfo) => {
        if (!editName.trim() || editName.trim() === cat.name) {
            setEditingId(null);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: cat.id, name: editName.trim(), nameEn: editNameEn.trim() || null }),
            });
            if (res.ok) {
                toast.success(`Đã đổi tên "${cat.name}" → "${editName.trim()}"`);
                setEditingId(null);
                fetchCategories();
            } else {
                const data = await res.json();
                toast.error(data.error || "Không thể đổi tên danh mục");
            }
        } catch {
            toast.error("Lỗi kết nối");
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategory.trim()) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategory.trim(), nameEn: newCategoryEn.trim() || null }),
            });
            if (res.ok) {
                toast.success(`Đã tạo danh mục "${newCategory.trim()}"`);
                setNewCategory("");
                setNewCategoryEn("");
                setShowAdd(false);
                fetchCategories();
            } else {
                const data = await res.json();
                toast.error(data.error || "Không thể tạo danh mục");
            }
        } catch {
            toast.error("Lỗi kết nối");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat: CategoryInfo) => {
        if (cat.productCount > 0) {
            const ok = confirm(`Danh mục "${cat.name}" có ${cat.productCount} sản phẩm. Xóa sẽ gỡ liên kết danh mục khỏi các sản phẩm này. Tiếp tục?`);
            if (!ok) return;
        }
        setDeletingId(cat.id);
        try {
            const res = await fetch(`/api/admin/categories?id=${cat.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(`Đã xóa danh mục "${cat.name}"`);
                fetchCategories();
            } else {
                const data = await res.json();
                toast.error(data.error || "Không thể xóa danh mục");
            }
        } catch {
            toast.error("Lỗi kết nối");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Đang tải danh mục...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-white">Quản lý danh mục</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {categories.length} danh mục · {totalProducts} sản phẩm
                    </p>
                </div>
                <Button
                    onClick={() => setShowAdd(!showAdd)}
                    className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex gap-2 shadow-lg shadow-teal-500/25"
                >
                    <Plus className="w-4 h-4" />
                    Thêm danh mục
                </Button>
            </div>

            {/* Add Category */}
            {showAdd && (
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
                    <div className="space-y-3">
                        <div className="flex gap-3 items-center">
                            <input
                                className="flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 placeholder:text-zinc-500"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="🇻🇳 Tên danh mục mới..."
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                autoFocus
                            />
                            <Button
                                onClick={handleAdd}
                                disabled={saving || !newCategory.trim()}
                                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2.5"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { setShowAdd(false); setNewCategory(""); setNewCategoryEn(""); }}
                                className="rounded-lg text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <input
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-zinc-600"
                            value={newCategoryEn}
                            onChange={(e) => setNewCategoryEn(e.target.value)}
                            placeholder="🇺🇸 Category name (EN)..."
                        />
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    className="w-full bg-[#111113] border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-zinc-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm danh mục..."
                />
            </div>

            {/* Categories List */}
            <div className="space-y-2">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-16 bg-[#111113] rounded-lg border border-zinc-800">
                        <FolderTree className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">
                            {search ? "Không tìm thấy danh mục" : "Chưa có danh mục nào"}
                        </p>
                        {!search && (
                            <p className="text-zinc-600 text-sm mt-2">
                                Nhấn &quot;Thêm danh mục&quot; để tạo danh mục mới
                            </p>
                        )}
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <div key={cat.id} className="rounded-lg border border-zinc-700/50 bg-[#111113] hover:border-zinc-600 transition-colors">
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                                        <FolderTree className="w-4 h-4 text-teal-400" />
                                    </div>
                                    {editingId === cat.id ? (
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="🇻🇳 Tên danh mục"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleRename(cat);
                                                        if (e.key === "Escape") setEditingId(null);
                                                    }}
                                                    autoFocus
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRename(cat)}
                                                    disabled={saving}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                                                >
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(null)}
                                                    className="rounded-lg text-zinc-500 hover:text-zinc-300"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <input
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                value={editNameEn}
                                                onChange={(e) => setEditNameEn(e.target.value)}
                                                placeholder="🇺🇸 Category name (EN)"
                                            />
                                        </div>
                                    ) : (
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-zinc-100 truncate">{cat.name || "Chưa phân loại"}</h3>
                                            {cat.nameEn && <p className="text-xs text-blue-400 font-medium">🇺🇸 {cat.nameEn}</p>}
                                            <p className="text-xs text-zinc-600 font-medium">slug: {cat.slug}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5">
                                        <Package className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-sm font-semibold text-zinc-300">{cat.productCount}</span>
                                        <span className="text-xs text-zinc-600">SP</span>
                                    </div>

                                    {editingId !== cat.id && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingId(cat.id);
                                                    setEditName(cat.name || "");
                                                    setEditNameEn(cat.nameEn || "");
                                                }}
                                                className="p-2 rounded-lg text-zinc-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                disabled={deletingId === cat.id}
                                                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                                            >
                                                {deletingId === cat.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Info */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="text-xs text-zinc-500 leading-relaxed">
                    <strong className="text-zinc-400">Lưu ý:</strong> Danh mục tạo tại đây sẽ hiển thị ngay trong Sidebar lọc trang Shop và Mega Menu điều hướng. Khi xóa danh mục, sản phẩm thuộc danh mục đó sẽ không còn liên kết danh mục (vẫn tồn tại sản phẩm).
                </p>
            </div>
        </div>
    );
}