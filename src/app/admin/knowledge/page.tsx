"use client";

/**
 * LIKEFOOD - Admin AI Knowledge Base Manager
 * CRUD interface for managing AI chatbot knowledge entries
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Trash2, Edit3, Save, X, Filter,
  ChevronLeft, ChevronRight, Brain, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface KnowledgeItem {
  id: number;
  category: string;
  question: string | null;
  answer: string;
  keywords: string | null;
  language: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "", label: "Tất cả" },
  { value: "faq", label: "FAQ" },
  { value: "product", label: "Sản phẩm" },
  { value: "shipping", label: "Giao hàng" },
  { value: "payment", label: "Thanh toán" },
  { value: "return", label: "Đổi trả" },
  { value: "order", label: "Đơn hàng" },
  { value: "account", label: "Tài khoản" },
  { value: "promotion", label: "Khuyến mãi" },
  { value: "support", label: "Hỗ trợ" },
  { value: "general", label: "Chung" },
  { value: "membership", label: "Thành viên" },
  { value: "gift", label: "Quà tặng" },
  { value: "nutrition", label: "Dinh dưỡng" },
  { value: "usage", label: "Cách dùng" },
  { value: "storage", label: "Bảo quản" },
  { value: "origin", label: "Nguồn gốc" },
  { value: "allergy", label: "Dị ứng" },
  { value: "bulk", label: "Mua sỉ" },
  { value: "policy", label: "Chính sách" },
  { value: "corporate", label: "Doanh nghiệp" },
];

const LANGUAGES = [
  { value: "vi", label: "🇻🇳 Tiếng Việt" },
  { value: "en", label: "🇺🇸 English" },
  { value: "both", label: "🌐 Cả hai" },
];

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");

  // Edit/Create modal
  const [editItem, setEditItem] = useState<Partial<KnowledgeItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (filterCategory) params.set("category", filterCategory);
      if (filterLanguage) params.set("language", filterLanguage);

      const res = await fetch(`/api/admin/knowledge?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterLanguage]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSave = async () => {
    if (!editItem?.answer || !editItem?.category) {
      toast.error("Vui lòng nhập danh mục và câu trả lời");
      return;
    }

    setSaving(true);
    try {
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch("/api/admin/knowledge", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isCreating ? "Đã tạo thành công!" : "Đã cập nhật!");
        setEditItem(null);
        setIsCreating(false);
        void fetchItems();
      } else {
        toast.error(data.error || "Lỗi");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa entry này?")) return;
    try {
      const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa!");
        void fetchItems();
      }
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  const handleToggleActive = async (item: KnowledgeItem) => {
    try {
      await fetch("/api/admin/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      void fetchItems();
    } catch {
      toast.error("Lỗi");
    }
  };

  const openCreate = () => {
    setEditItem({ category: "general", language: "both", priority: 5, isActive: true });
    setIsCreating(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setEditItem({ ...item });
    setIsCreating(false);
  };

  const getCategoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

  const selectClass = "h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">AI Knowledge Base</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Quản lý kiến thức cho AI Chatbot — {total} entries</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm câu hỏi, câu trả lời..."
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
              className={selectClass}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select
              value={filterLanguage}
              onChange={e => { setFilterLanguage(e.target.value); setPage(1); }}
              className={selectClass}
            >
              <option value="">Ngôn ngữ</option>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700/50 bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-24">Danh mục</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Câu hỏi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Câu trả lời</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-16">Ngôn ngữ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-16">Ưu tiên</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 w-20">Active</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Brain className="mx-auto h-10 w-10 text-zinc-600" />
                    <h3 className="mt-4 text-sm font-medium text-zinc-400">Không tìm thấy kết quả</h3>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 text-xs">{(page - 1) * 15 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-zinc-300" title={item.question || ""}>
                      {item.question || <span className="text-zinc-600 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-zinc-400" title={item.answer}>
                      {item.answer.slice(0, 100)}...
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {item.language === "vi" ? "🇻🇳" : item.language === "en" ? "🇺🇸" : "🌐"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.priority >= 9 ? "bg-red-500/10 text-red-400" : item.priority >= 7 ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void handleToggleActive(item)}
                        className={`h-5 w-9 rounded-full transition relative ${item.isActive ? "bg-emerald-500" : "bg-zinc-600"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${item.isActive ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-teal-400 transition-colors" title="Sửa">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => void handleDelete(item.id)} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors" title="Xóa">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700/50">
            <p className="text-xs text-zinc-500">
              Trang {page} / {totalPages} — Tổng {total} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditItem(null); setIsCreating(false); }}>
          <div className="bg-[#0A0A0B] rounded-lg border border-zinc-700/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50">
              <h3 className="text-lg font-semibold text-zinc-100">
                {isCreating ? "➕ Thêm Knowledge Entry" : "✏️ Sửa Knowledge Entry"}
              </h3>
              <button onClick={() => { setEditItem(null); setIsCreating(false); }} className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Category + Language + Priority row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Danh mục *</label>
                  <select
                    value={editItem.category || ""}
                    onChange={e => setEditItem(prev => ({ ...prev, category: e.target.value }))}
                    className={selectClass + " w-full"}
                  >
                    {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Ngôn ngữ</label>
                  <select
                    value={editItem.language || "both"}
                    onChange={e => setEditItem(prev => ({ ...prev, language: e.target.value }))}
                    className={selectClass + " w-full"}
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Ưu tiên (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editItem.priority ?? 5}
                    onChange={e => setEditItem(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Câu hỏi</label>
                <input
                  type="text"
                  value={editItem.question || ""}
                  onChange={e => setEditItem(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="VD: Phí giao hàng bao nhiêu?"
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Câu trả lời *</label>
                <textarea
                  value={editItem.answer || ""}
                  onChange={e => setEditItem(prev => ({ ...prev, answer: e.target.value }))}
                  rows={5}
                  placeholder="Phí giao hàng tùy khu vực..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none resize-y"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Từ khóa (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={editItem.keywords || ""}
                  onChange={e => setEditItem(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="giao hang, phi ship, delivery"
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700/50 bg-zinc-900/30 rounded-b-lg">
              <button
                onClick={() => { setEditItem(null); setIsCreating(false); }}
                className="px-4 py-2.5 rounded-md border border-zinc-700 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
