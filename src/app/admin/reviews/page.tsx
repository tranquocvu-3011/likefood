"use client";

/**
 * LIKEFOOD - Admin Reviews Management
 * Duyệt, phản hồi, và quản lý đánh giá sản phẩm từ khách hàng
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useEffect, useCallback } from "react";
import { AdminPageContainer } from "@/components/admin/AdminPageContainer";
import {
  Star, Search, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Trash2, MessageSquare, AlertCircle,
  Eye, Clock, ThumbsUp, ThumbsDown } from "lucide-react";

interface ReviewUser {
  id: number;
  name: string | null;
  email: string;
}

interface ReviewProduct {
  id: number;
  name: string;
  slug: string;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  status: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: ReviewUser;
  product: ReviewProduct;
  media: Array<{ id: number; url: string; type: string }>;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ duyệt", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { value: "APPROVED", label: "Đã duyệt", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { value: "REJECTED", label: "Đã từ chối", icon: XCircle, color: "bg-red-50 text-red-500 border-red-200" },
  { value: "ALL", label: "Tất cả", icon: Eye, color: "bg-slate-50 text-slate-600 border-slate-200" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Reply modal
  const [replyTarget, setReplyTarget] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: "15",
      });
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      showToast("Không thể tải danh sách đánh giá", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { void fetchReviews(); }, [fetchReviews]);

  const handleModerate = async (reviewId: number, status: "APPROVED" | "REJECTED", adminReply?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminReply: adminReply || null }),
      });
      if (res.ok) {
        showToast(status === "APPROVED" ? "Đã duyệt đánh giá!" : "Đã từ chối đánh giá!");
        setReplyTarget(null);
        setReplyText("");
        void fetchReviews();
      } else {
        const data = await res.json();
        showToast(data.error || "Lỗi", "error");
      }
    } catch {
      showToast("Lỗi kết nối", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("Xóa đánh giá này? (soft-delete, chuyển sang REJECTED)")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Đã xóa đánh giá!");
        void fetchReviews();
      }
    } catch {
      showToast("Lỗi xóa", "error");
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${opt.color}`}>
        <Icon className="h-3 w-3" />
        {opt.label}
      </span>
    );
  };

  // Filter by search
  const filteredReviews = search
    ? reviews.filter(r =>
        r.product.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user.email.toLowerCase().includes(search.toLowerCase()) ||
        r.comment?.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  const pendingCount = statusFilter === "PENDING" ? total : 0;

  return (
    <AdminPageContainer
      title="Quản lý Đánh giá"
      subtitle={`${total} đánh giá${pendingCount > 0 ? ` — ${pendingCount} chờ duyệt` : ""}`}
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
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${active ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo sản phẩm, khách hàng..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-16 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              Đang tải...
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-16 text-center text-slate-400">
            Không có đánh giá nào
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition overflow-hidden shadow-sm">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStars(review.rating)}
                      {getStatusBadge(review.status)}
                      <span className="text-xs text-slate-400">
                        #{review.id} • {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1.5 truncate">
                      {review.product.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      bởi <span className="text-slate-600 font-medium">{review.user.name || review.user.email}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {review.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => void handleModerate(review.id, "APPROVED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition"
                          title="Duyệt"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Duyệt
                        </button>
                        <button
                          onClick={() => void handleModerate(review.id, "REJECTED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition"
                          title="Từ chối"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setReplyTarget(review); setReplyText(review.adminReply || ""); }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                      title="Phản hồi"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => void handleDelete(review.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="bg-slate-50 rounded-xl p-3 mt-2">
                    <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {/* Media */}
                {review.media && review.media.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {review.media.map(m => (
                      <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Admin Reply */}
                {review.adminReply && (
                  <div className="mt-3 bg-blue-50 rounded-xl p-3 border-l-3 border-blue-400">
                    <p className="text-xs font-semibold text-blue-600 mb-1">💬 Phản hồi từ Admin</p>
                    <p className="text-sm text-blue-800">{review.adminReply}</p>
                    {review.repliedAt && (
                      <p className="text-xs text-blue-400 mt-1">{new Date(review.repliedAt).toLocaleDateString("vi-VN")}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-400">
            Trang {page} / {totalPages} — Tổng {total} đánh giá
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

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">💬 Phản hồi đánh giá</h3>
              <p className="text-sm text-slate-400 mt-1">
                {replyTarget.product.name} — {renderStars(replyTarget.rating)} bởi {replyTarget.user.name || replyTarget.user.email}
              </p>
              {replyTarget.comment && (
                <div className="bg-slate-50 rounded-lg p-3 mt-2 text-sm text-slate-600">
                  &ldquo;{replyTarget.comment}&rdquo;
                </div>
              )}
            </div>

            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nội dung phản hồi</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Cảm ơn bạn đã đánh giá..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => { setReplyTarget(null); setReplyText(""); }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              {replyTarget.status === "PENDING" && (
                <button
                  onClick={() => void handleModerate(replyTarget.id, "APPROVED", replyText)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? "..." : "✅ Duyệt + Phản hồi"}
                </button>
              )}
              {replyTarget.status !== "PENDING" && (
                <button
                  onClick={() => void handleModerate(replyTarget.id, replyTarget.status as "APPROVED" | "REJECTED", replyText)}
                  disabled={saving || !replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "..." : "💬 Gửi phản hồi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageContainer>
  );
}
