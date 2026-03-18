"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, Loader2, Package, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";import { toast } from "sonner";
import { AdminPageContainer, AdminTableContainer } from "@/components/admin/AdminPageContainer";
import { AdminFilterBar } from "@/components/admin/AdminSearch";
import { useDebounce } from "@/hooks/useDebounce";

interface Brand {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    isActive: boolean;
    _count: {
        products: number;
    };
}

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({ name: "", logo: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const debouncedSearch = useDebounce(search, 300);

    const fetchBrands = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set("search", debouncedSearch);

            const res = await fetch(`/api/admin/brands?${params.toString()}`);
            const data = await res.json();
            setBrands(data.brands || []);
            setTotal(data.brands?.length || 0);
        } catch {
            toast.error("Không tải được danh sách thương hiệu");
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = editingBrand ? "/api/admin/brands" : "/api/admin/brands";
            const method = editingBrand ? "PATCH" : "POST";

            const body: Record<string, string | number> = { name: formData.name };
            if (formData.logo) body.logo = formData.logo;
            if (editingBrand) body.id = editingBrand.id;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Không thể lưu thương hiệu");
            }

            toast.success(editingBrand ? "Cập nhật thương hiệu thành công" : "Tạo thương hiệu thành công");
            setShowModal(false);
            setEditingBrand(null);
            setFormData({ name: "", logo: "" });
            fetchBrands();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Lỗi khi lưu thương hiệu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setFormData({ name: brand.name, logo: brand.logo || "" });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/brands?id=${id}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không thể xóa thương hiệu");
            }

            toast.success(data.deactivated ? "Đã vô hiệu hóa thương hiệu" : "Xóa thương hiệu thành công");
            fetchBrands();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Lỗi khi xóa thương hiệu");
        } finally {
            setIsSubmitting(false);
            setDeleteId(null);
        }
    };

    const openNewBrandModal = () => {
        setEditingBrand(null);
        setFormData({ name: "", logo: "" });
        setShowModal(true);
    };

    return (
        <AdminPageContainer
            title="Quản lý thương hiệu"
            subtitle={`${total} thương hiệu đang kinh doanh.`}
            action={
                <Button 
                    onClick={openNewBrandModal}
                    className="h-14 px-8 rounded-full bg-teal-500 hover:bg-teal-400 text-white font-bold uppercase tracking-widest shadow-xl shadow-teal-500/25 gap-2"
                >
                    <Plus className="w-5 h-5" /> Thêm thương hiệu
                </Button>
            }
        >
            <AdminFilterBar
                searchQuery={search}
                setSearchQuery={setSearch}
                searchPlaceholder="Tìm tên thương hiệu..."
            />

            <AdminTableContainer>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-zinc-700/50 bg-zinc-800/40">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Thương hiệu</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Slug</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Sản phẩm</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-zinc-800 rounded-full w-3/4" /></td>
                                </tr>
                            ))
                        ) : brands.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-20">
                                    <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 font-medium">Không tìm thấy thương hiệu nào</p>
                                </td>
                            </tr>
                        ) : brands.map((brand) => (
                            <tr key={brand.id} className="group hover:bg-zinc-800/40 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden relative flex-shrink-0">
                                            {brand.logo ? (
                                                <Image
                                                    src={brand.logo}
                                                    alt={brand.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                    unoptimized
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-full h-full flex items-center justify-center text-zinc-500 font-bold ${brand.logo ? 'hidden' : ''}`}>
                                                {brand.name[0]}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-zinc-100">{brand.name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-zinc-500 font-mono">{brand.slug}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-zinc-300">{brand._count.products}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                                        brand.isActive 
                                            ? "bg-emerald-500/10 text-emerald-400" 
                                            : "bg-zinc-800 text-zinc-500"
                                    }`}>
                                        {brand.isActive ? (
                                            <><Check className="w-3 h-3" /> Hoạt động</>
                                        ) : (
                                            <><X className="w-3 h-3" /> Không hoạt động</>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleEdit(brand)}
                                            className="p-2 rounded-lg hover:bg-teal-500/10 transition-colors text-zinc-400 hover:text-teal-400"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteId(brand.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-zinc-400 hover:text-red-400"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </AdminTableContainer>

            {/* Brand Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#18181B] rounded-xl border border-zinc-700 p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-lg font-semibold text-zinc-100 mb-6">
                            {editingBrand ? "Sửa thương hiệu" : "Thêm thương hiệu mới"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-2 block">
                                    Tên thương hiệu
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    placeholder="Nhập tên thương hiệu"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-2 block">
                                    Logo URL (tùy chọn)
                                </label>
                                <input
                                    type="url"
                                    value={formData.logo}
                                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingBrand(null); }}
                                    className="flex-1 h-10 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 font-medium"
                                    variant="outline"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 h-10 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-semibold shadow-lg shadow-teal-500/20"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : editingBrand ? (
                                        "Cập nhật"
                                    ) : (
                                        "Tạo mới"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#18181B] rounded-xl border border-zinc-700 p-6 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                            <Trash2 className="w-7 h-7 text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Xóa thương hiệu?</h3>
                        <p className="text-zinc-500 text-sm mb-6">Thương hiệu này sẽ bị xóa vĩnh viễn.</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 h-10 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 font-medium"
                                variant="outline"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={() => handleDelete(deleteId)}
                                disabled={isSubmitting}
                                className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold shadow-lg shadow-red-500/20"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Xóa"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageContainer>
    );
}
