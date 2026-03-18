"use client";

/**
 * LIKEFOOD - Admin Newsletter Subscribers
 * Quản lý danh sách email đăng ký nhận tin
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw, Download, Trash2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Subscriber {
  id: number;
  email: string;
  subscribedAt: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter");
      if (!res.ok) throw new Error("Không thể tải danh sách");
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch {
      toast.error("Không thể tải danh sách email đăng ký");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa email này khỏi danh sách?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Đã xóa email");
      fetchSubscribers();
    } catch {
      toast.error("Không thể xóa email");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const header = "STT\tEmail\tNgày đăng ký";
    const rows = filtered.map((s, i) =>
      `${i + 1}\t${s.email}\t${new Date(s.subscribedAt).toLocaleString("vi-VN")}`
    );
    const content = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filtered.length} email`);
  };

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Email đăng ký nhận tin</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {subscribers.length} email đã đăng ký
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchSubscribers()}
            disabled={isLoading}
            className="text-zinc-400"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="bg-teal-500 hover:bg-teal-400 text-white"
          >
            <Download className="h-4 w-4" />
            Xuất TXT
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          className="w-full bg-[#111113] border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-zinc-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm email..."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <Mail className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{subscribers.length}</p>
              <p className="text-xs text-zinc-500">Tổng đăng ký</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">
                {subscribers.filter(s => {
                  const d = new Date(s.subscribedAt);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-xs text-zinc-500">Đăng ký tháng này</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Download className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{filtered.length}</p>
              <p className="text-xs text-zinc-500">Hiển thị / tìm kiếm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/30">
            <tr className="text-xs text-zinc-400">
              <th className="px-4 py-3 text-left font-medium w-12">#</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Ngày đăng ký</th>
              <th className="px-4 py-3 text-right font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500 mx-auto" />
                  <p className="text-xs text-zinc-500 mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <Mail className="h-8 w-8 text-zinc-700 mx-auto" />
                  <p className="text-sm text-zinc-500 mt-2">
                    {search ? "Không tìm thấy email" : "Chưa có email đăng ký"}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((sub, i) => (
                <tr key={sub.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-200">{sub.email}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(sub.subscribedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deletingId === sub.id}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                      {deletingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
