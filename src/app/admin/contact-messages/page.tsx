"use client";

/**
 * LIKEFOOD - Admin Contact Messages
 * Quản lý tin nhắn liên hệ từ khách hàng
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw, Download, Search, Eye, Clock, CheckCircle2, AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/contact?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error("Không thể tải tin nhắn liên hệ");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleStatusUpdate = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Đã cập nhật trạng thái → ${status === "READ" ? "Đã đọc" : status === "REPLIED" ? "Đã phản hồi" : status}`);
      fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = () => {
    const header = "STT\tTên\tEmail\tSĐT\tChủ đề\tNội dung\tTrạng thái\tNgày gửi";
    const rows = filtered.map((m, i) =>
      `${i + 1}\t${m.name}\t${m.email}\t${m.phone || ""}\t${m.subject}\t${m.message.replace(/\t/g, " ").replace(/\n/g, " ")}\t${statusLabel(m.status)}\t${new Date(m.createdAt).toLocaleString("vi-VN")}`
    );
    const content = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contact_messages_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filtered.length} tin nhắn`);
  };

  const statusLabel = (s: string) => {
    if (s === "PENDING") return "Chờ xử lý";
    if (s === "READ") return "Đã đọc";
    if (s === "REPLIED") return "Đã phản hồi";
    return s;
  };

  const statusColor = (s: string) => {
    if (s === "PENDING") return "bg-amber-500/10 text-amber-400";
    if (s === "READ") return "bg-cyan-500/10 text-cyan-400";
    if (s === "REPLIED") return "bg-emerald-500/10 text-emerald-400";
    return "bg-zinc-500/10 text-zinc-400";
  };

  const statusIcon = (s: string) => {
    if (s === "PENDING") return <Clock className="h-3.5 w-3.5" />;
    if (s === "READ") return <Eye className="h-3.5 w-3.5" />;
    if (s === "REPLIED") return <CheckCircle2 className="h-3.5 w-3.5" />;
    return <AlertCircle className="h-3.5 w-3.5" />;
  };

  const filtered = messages.filter(m => {
    const text = `${m.name} ${m.email} ${m.subject} ${m.message}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const pendingCount = messages.filter(m => m.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Tin nhắn liên hệ</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {messages.length} tin nhắn{pendingCount > 0 && <span className="text-amber-400"> · {pendingCount} chờ xử lý</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchMessages()} disabled={isLoading} className="text-zinc-400">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={handleExport} disabled={filtered.length === 0} className="bg-teal-500 hover:bg-teal-400 text-white">
            <Download className="h-4 w-4" />
            Xuất TXT
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-[#111113] border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-zinc-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, chủ đề..."
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-700 bg-[#111113] p-1">
          {[
            { value: "all", label: "Tất cả" },
            { value: "PENDING", label: "Chờ xử lý" },
            { value: "READ", label: "Đã đọc" },
            { value: "REPLIED", label: "Đã phản hồi" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${filterStatus === value ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        {/* List */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center rounded-lg border border-zinc-700/50 bg-[#111113]">
              <Inbox className="h-8 w-8 text-zinc-700 mx-auto" />
              <p className="text-sm text-zinc-500 mt-2">Không có tin nhắn</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (msg.status === "PENDING") handleStatusUpdate(msg.id, "READ");
                }}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedMessage?.id === msg.id ? "border-teal-500/50 bg-teal-500/5" : "border-zinc-700/50 bg-[#111113] hover:border-zinc-600"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100 truncate">{msg.name}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor(msg.status)}`}>
                        {statusIcon(msg.status)}
                        {statusLabel(msg.status)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{msg.email}</p>
                    <p className="text-sm text-zinc-300 font-medium truncate mt-1">{msg.subject}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{msg.message}</p>
                  </div>
                  <p className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Pane */}
        <div className="rounded-lg border border-zinc-700/50 bg-[#111113] sticky top-20">
          {selectedMessage ? (
            <div>
              <div className="p-4 border-b border-zinc-700/50">
                <h3 className="text-sm font-semibold text-zinc-100">{selectedMessage.subject}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span>{selectedMessage.name}</span>
                  <span>•</span>
                  <span>{selectedMessage.email}</span>
                  {selectedMessage.phone && <><span>•</span><span>{selectedMessage.phone}</span></>}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {new Date(selectedMessage.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="p-4">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
              </div>
              <div className="p-4 border-t border-zinc-700/50 flex gap-2">
                {selectedMessage.status !== "REPLIED" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedMessage.id, "REPLIED")}
                    disabled={updatingId === selectedMessage.id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    {updatingId === selectedMessage.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Đánh dấu đã phản hồi
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`)}
                  className="text-xs"
                >
                  <Mail className="h-3 w-3" />
                  Gửi email
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Mail className="h-8 w-8 text-zinc-700 mx-auto" />
              <p className="text-sm text-zinc-500 mt-2">Chọn tin nhắn để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
