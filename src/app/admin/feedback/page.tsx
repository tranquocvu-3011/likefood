"use client";

/**
 * LIKEFOOD - Admin Feedback
 * Xem và phân tích feedback từ khách hàng
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Minus, RefreshCw, Download, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FeedbackItem {
  id: number;
  userId: number | null;
  sessionId: string;
  message: string;
  feedback: string | null;
  createdAt: string;
}

interface FeedbackStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  positiveRate: string;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, positive: 0, neutral: 0, negative: 0, positiveRate: "0%" });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterRating !== "all") params.set("rating", filterRating);
      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      if (data.stats) setStats(data.stats);
    } catch {
      toast.error("Không thể tải danh sách feedback");
    } finally {
      setIsLoading(false);
    }
  }, [filterRating]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const parseFeedbackMessage = (msg: string) => {
    try {
      return JSON.parse(msg);
    } catch {
      return { comment: msg };
    }
  };

  const handleExport = () => {
    const header = "STT\tLoại\tĐánh giá\tBình luận\tNgày";
    const rows = filtered.map((f, i) => {
      const parsed = parseFeedbackMessage(f.message);
      return `${i + 1}\t${parsed.type || "general"}\t${f.feedback || "N/A"}\t${(parsed.comment || "").replace(/\t/g, " ").replace(/\n/g, " ")}\t${new Date(f.createdAt).toLocaleString("vi-VN")}`;
    });
    const content = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filtered.length} feedback`);
  };

  const filtered = feedbacks.filter(f => {
    const parsed = parseFeedbackMessage(f.message);
    const text = `${parsed.comment || ""} ${parsed.type || ""} ${f.feedback || ""}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const feedbackIcon = (rating: string | null) => {
    if (rating === "positive") return <ThumbsUp className="h-4 w-4 text-emerald-400" />;
    if (rating === "negative") return <ThumbsDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-amber-400" />;
  };

  const feedbackLabel = (rating: string | null) => {
    if (rating === "positive") return "Tích cực";
    if (rating === "negative") return "Tiêu cực";
    return "Trung tính";
  };

  const feedbackColor = (rating: string | null) => {
    if (rating === "positive") return "bg-emerald-500/10 text-emerald-400";
    if (rating === "negative") return "bg-red-500/10 text-red-400";
    return "bg-amber-500/10 text-amber-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Phản hồi khách hàng</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Theo dõi và phân tích ý kiến từ người dùng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchFeedbacks()} disabled={isLoading} className="text-zinc-400">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={handleExport} disabled={filtered.length === 0} className="bg-teal-500 hover:bg-teal-400 text-white">
            <Download className="h-4 w-4" />
            Xuất TXT
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng feedback", value: stats.total, icon: MessageSquare, color: "text-teal-400", bg: "bg-teal-500/15" },
          { label: "Tích cực", value: stats.positive, icon: ThumbsUp, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "Trung tính", value: stats.neutral, icon: Minus, color: "text-amber-400", bg: "bg-amber-500/15" },
          { label: "Tiêu cực", value: stats.negative, icon: ThumbsDown, color: "text-red-400", bg: "bg-red-500/15" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-[#111113] border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-zinc-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm feedback..."
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-700 bg-[#111113] p-1">
          {[
            { value: "all", label: "Tất cả" },
            { value: "positive", label: "👍" },
            { value: "neutral", label: "😐" },
            { value: "negative", label: "👎" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterRating(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterRating === value ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Satisfaction bar */}
      {stats.total > 0 && (
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-zinc-400">Tỷ lệ hài lòng</p>
            <p className="text-xs font-bold text-emerald-400">{stats.positiveRate}</p>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.positive / stats.total) * 100}%` }} />
            <div className="bg-amber-500 transition-all" style={{ width: `${(stats.neutral / stats.total) * 100}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${(stats.negative / stats.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500 mx-auto" />
            <p className="text-xs text-zinc-500 mt-2">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-zinc-700/50 bg-[#111113]">
            <Filter className="h-8 w-8 text-zinc-700 mx-auto" />
            <p className="text-sm text-zinc-500 mt-2">
              {search || filterRating !== "all" ? "Không tìm thấy feedback" : "Chưa có feedback nào"}
            </p>
          </div>
        ) : (
          filtered.map((fb) => {
            const parsed = parseFeedbackMessage(fb.message);
            return (
              <div key={fb.id} className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {feedbackIcon(fb.feedback)}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${feedbackColor(fb.feedback)}`}>
                        {feedbackLabel(fb.feedback)}
                      </span>
                      {parsed.type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                          {parsed.type}
                        </span>
                      )}
                      {parsed.rating && (
                        <span className="text-xs text-zinc-500">
                          ⭐ {parsed.rating}/5
                        </span>
                      )}
                    </div>
                    {parsed.comment && (
                      <p className="text-sm text-zinc-300 mt-1">{parsed.comment}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-500">{new Date(fb.createdAt).toLocaleString("vi-VN")}</p>
                    {fb.userId && <p className="text-[10px] text-zinc-600 mt-0.5">User #{fb.userId}</p>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
