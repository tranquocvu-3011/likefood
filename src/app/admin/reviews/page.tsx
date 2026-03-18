"use client";

/**
 * LIKEFOOD - Admin Reviews Management
 * Duyệt, phản hồi, và quản lý đánh giá sản phẩm từ khách hàng
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useEffect, useCallback } from "react";
import {
  Star, Search, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Trash2, MessageSquare,
  Eye, Clock, ThumbsUp, ThumbsDown, Loader2
} from "lucide-react";
import { toast } from "sonner";

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
  { value: "PENDING", label: "Chờ duyệt", icon: Clock, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { value: "APPROVED", label: "Đã duyệt", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { value: "REJECTED", label: "Đã từ chối", icon: XCircle, color: "bg-red-500/10 text-red-400 border-red-500/30" },
  { value: "ALL", label: "Tất cả", icon: Eye, color: "bg-zinc-500/10 text-zinc-400 border-zinc-700" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  // Reply modal
  const [replyTarget, setReplyTarget] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

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
      toast.error("Không thể tải danh sách đánh giá");
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
        toast.success(status === "APPROVED" ? "Đã duyệt đánh giá!" : "Đã từ chối đánh giá!");
        setReplyTarget(null);
        setReplyText("");
        void fetchReviews();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("Xóa đánh giá này? (soft-delete, chuyển sang REJECTED)")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Đã xóa đánh giá!");
        void fetchReviews();
      }
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`} />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${opt.color}`}>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Quản lý Đánh giá</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {total} đánh giá{pendingCount > 0 ? ` — ${pendingCount} chờ duyệt` : ""}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-md border border-zinc-700/50 bg-zinc-900 p-0.5">
            {STATUS_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    active
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo sản phẩm, khách hàng..."
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] px-6 py-16 text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              <span className="text-sm">Đang tải...</span>
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-lg border border-zinc-700/50 bg-[#111113] px-6 py-16 text-center">
            <Star className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 text-sm font-medium text-zinc-400">Không có đánh giá nào</h3>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="rounded-lg border border-zinc-700/50 bg-[#111113] hover:border-zinc-600 transition overflow-hidden">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStars(review.rating)}
                      {getStatusBadge(review.status)}
                      <span className="text-xs text-zinc-500">
                        #{review.id} • {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-200 mt-1.5 truncate">
                      {review.product.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      bởi <span className="text-zinc-300 font-medium">{review.user.name || review.user.email}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {review.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => void handleModerate(review.id, "APPROVED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                          title="Duyệt"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Duyệt
                        </button>
                        <button
                          onClick={() => void handleModerate(review.id, "REJECTED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                          title="Từ chối"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setReplyTarget(review); setReplyText(review.adminReply || ""); }}
                      className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-teal-400 transition-colors"
                      title="Phản hồi"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => void handleDelete(review.id)}
                      className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="bg-zinc-900/50 rounded-md p-3 mt-2">
                    <p className="text-sm text-zinc-300 leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {/* Media */}
                {review.media && review.media.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {review.media.map(m => (
                      <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-md overflow-hidden border border-zinc-700 hover:border-teal-500 transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Admin Reply */}
                {review.adminReply && (
                  <div className="mt-3 bg-teal-500/5 rounded-md p-3 border-l-2 border-teal-500">
                    <p className="text-xs font-semibold text-teal-400 mb-1">💬 Phản hồi từ Admin</p>
                    <p className="text-sm text-zinc-300">{review.adminReply}</p>
                    {review.repliedAt && (
                      <p className="text-xs text-zinc-500 mt-1">{new Date(review.repliedAt).toLocaleDateString("vi-VN")}</p>
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
        <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-[#111113] px-4 py-3">
          <p className="text-xs text-zinc-500">
            Trang {page} / {totalPages} — Tổng {total} đánh giá
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

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setReplyTarget(null); setReplyText(""); }}>
          <div className="bg-[#0A0A0B] rounded-lg border border-zinc-700/50 shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-zinc-700/50">
              <h3 className="text-lg font-semibold text-zinc-100">💬 Phản hồi đánh giá</h3>
              <p className="text-sm text-zinc-500 mt-1">
                {replyTarget.product.name} — {renderStars(replyTarget.rating)} bởi {replyTarget.user.name || replyTarget.user.email}
              </p>
              {replyTarget.comment && (
                <div className="bg-zinc-900/50 rounded-md p-3 mt-2 text-sm text-zinc-400">
                  &ldquo;{replyTarget.comment}&rdquo;
                </div>
              )}
            </div>

            <div className="px-6 py-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Nội dung phản hồi</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Cảm ơn bạn đã đánh giá..."
                className="w-full px-3 py-2.5 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-teal-500 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700/50 bg-zinc-900/30 rounded-b-lg">
              <button
                onClick={() => { setReplyTarget(null); setReplyText(""); }}
                className="px-4 py-2.5 rounded-md border border-zinc-700 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              {replyTarget.status === "PENDING" && (
                <button
                  onClick={() => void handleModerate(replyTarget.id, "APPROVED", replyText)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "✅ Duyệt + Phản hồi"}
                </button>
              )}
              {replyTarget.status !== "PENDING" && (
                <button
                  onClick={() => void handleModerate(replyTarget.id, replyTarget.status as "APPROVED" | "REJECTED", replyText)}
                  disabled={saving || !replyText.trim()}
                  className="px-4 py-2.5 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "💬 Gửi phản hồi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
