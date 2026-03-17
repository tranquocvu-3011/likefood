"use client";

/**
 * LIKEFOOD - Admin AI Knowledge Base Manager
 * CRUD interface for managing AI chatbot knowledge entries
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useEffect, useCallback } from "react";
import { AdminPageContainer } from "@/components/admin/AdminPageContainer";
import {
  BookOpen, Plus, Search, Trash2, Edit3, Save, X, Filter,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
} from "lucide-react";

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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Edit/Create modal
  const [editItem, setEditItem] = useState<Partial<KnowledgeItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast("Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterLanguage]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const handleSave = async () => {
    if (!editItem?.answer || !editItem?.category) {
      showToast("Vui lòng nhập danh mục và câu trả lời", "error");
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
        showToast(isCreating ? "Đã tạo thành công!" : "Đã cập nhật!");
        setEditItem(null);
        setIsCreating(false);
        void fetchItems();
      } else {
        showToast(data.error || "Lỗi", "error");
      }
    } catch {
      showToast("Lỗi kết nối", "error");
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
        showToast("Đã xóa!");
        void fetchItems();
      }
    } catch {
      showToast("Lỗi xóa", "error");
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
      showToast("Lỗi", "error");
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

  return (
    <AdminPageContainer
      title="AI Knowledge Base"
      subtitle={`Quản lý kiến thức cho AI Chatbot — ${total} entries`}
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm câu hỏi, câu trả lời..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-400"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select
            value={filterLanguage}
            onChange={e => { setFilterLanguage(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Ngôn ngữ</option>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 w-12">#</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 w-24">Danh mục</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Câu hỏi</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Câu trả lời</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 w-16">Ngôn ngữ</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 w-16">Ưu tiên</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600 w-20">Active</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Không tìm thấy kết quả
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * 15 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-slate-700" title={item.question || ""}>
                      {item.question || <span className="text-slate-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-600" title={item.answer}>
                      {item.answer.slice(0, 100)}...
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.language === "vi" ? "🇻🇳" : item.language === "en" ? "🇺🇸" : "🌐"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.priority >= 9 ? "bg-red-50 text-red-600" : item.priority >= 7 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void handleToggleActive(item)}
                        className={`h-5 w-9 rounded-full transition relative ${item.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${item.isActive ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition" title="Sửa">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => void handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition" title="Xóa">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Trang {page} / {totalPages} — Tổng {total} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {isCreating ? "➕ Thêm Knowledge Entry" : "✏️ Sửa Knowledge Entry"}
              </h3>
              <button onClick={() => { setEditItem(null); setIsCreating(false); }} className="p-2 rounded-lg hover:bg-slate-100 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Category + Language + Priority row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Danh mục *</label>
                  <select
                    value={editItem.category || ""}
                    onChange={e => setEditItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                  >
                    {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngôn ngữ</label>
                  <select
                    value={editItem.language || "both"}
                    onChange={e => setEditItem(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ưu tiên (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editItem.priority ?? 5}
                    onChange={e => setEditItem(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Câu hỏi</label>
                <input
                  type="text"
                  value={editItem.question || ""}
                  onChange={e => setEditItem(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="VD: Phí giao hàng bao nhiêu?"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Câu trả lời *</label>
                <textarea
                  value={editItem.answer || ""}
                  onChange={e => setEditItem(prev => ({ ...prev, answer: e.target.value }))}
                  rows={5}
                  placeholder="Phí giao hàng tùy khu vực..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 resize-y"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Từ khóa (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={editItem.keywords || ""}
                  onChange={e => setEditItem(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="giao hang, phi ship, delivery"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => { setEditItem(null); setIsCreating(false); }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageContainer>
  );
}
