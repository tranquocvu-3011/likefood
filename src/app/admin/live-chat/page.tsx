"use client";

/**
 * LIKEFOOD - Admin Live Chat Dashboard
 * Dark Theme - Consistent with Admin Panel
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  MessageCircle, Send, X, CheckCheck, Clock, 
  RefreshCw, ChevronLeft, Bot, Loader2, UserCheck, ShieldX
} from "lucide-react";

interface ChatSummary {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  adminId: number | null;
  adminName: string | null;
  status: "OPEN" | "ASSIGNED" | "CLOSED";
  subject: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  chatId: number;
  senderType: "USER" | "ADMIN" | "AI";
  senderId: number | null;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const STATUS_CONFIG = {
  OPEN: { label: "Đang chờ", color: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
  ASSIGNED: { label: "Đang xử lý", color: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
  CLOSED: { label: "Đã đóng", color: "bg-zinc-500/10 text-zinc-400", dot: "bg-zinc-500" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function AdminLiveChatPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [assigningChatId, setAssigningChatId] = useState<number | null>(null);
  const [closingChatId, setClosingChatId] = useState<number | null>(null);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-chat?status=${statusFilter}`);
      const data = await res.json();
      const chatList: ChatSummary[] = data.chats ?? [];
      setChats(chatList);
      setUnreadTotal(chatList.reduce((sum: number, c: ChatSummary) => sum + (c.unreadCount ?? 0), 0));
    } catch (err) {
      console.error("Fetch chats error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId: number) => {
    try {
      setRefreshingMessages(true);
      const res = await fetch(`/api/live-chat/${chatId}/messages`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setRefreshingMessages(false);
    }
  }, []);

  // Poll messages
  useEffect(() => {
    if (!selectedChat) return;
    void fetchMessages(selectedChat.id);
    pollRef.current = setInterval(() => fetchMessages(selectedChat.id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedChat, fetchMessages]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      await fetch(`/api/live-chat/${selectedChat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      setInput("");
      void fetchMessages(selectedChat.id);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  // Actions
  const handleAssign = async (chatId: number) => {
    setAssigningChatId(chatId);
    try {
      await fetch(`/api/live-chat/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign" }),
      });

      setSelectedChat((prev) =>
        prev && prev.id === chatId ? { ...prev, status: "ASSIGNED" } : prev
      );
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, status: "ASSIGNED" } : c)));
      void fetchChats();
    } finally {
      setAssigningChatId(null);
    }
  };

  const handleClose = async (chatId: number) => {
    setClosingChatId(chatId);
    try {
      await fetch(`/api/live-chat/${chatId}/close`, {
        method: "POST",
      });
      setSelectedChat((prev) => (prev && prev.id === chatId ? { ...prev, status: "CLOSED" } : prev));
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, status: "CLOSED" } : c)));
      void fetchMessages(chatId);
      void fetchChats();
    } finally {
      setClosingChatId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-400" />
            Live Chat
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {unreadTotal > 0 ? `${unreadTotal} tin nhắn chưa đọc` : "Quản lý hội thoại khách hàng"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["OPEN", "ASSIGNED", "CLOSED"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                statusFilter === s
                  ? "bg-teal-600 text-white"
                  : "border border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-lg border border-zinc-700/50 bg-[#111113] overflow-hidden flex h-[600px]">
        {/* Chat List */}
        <div className={`w-full md:w-[360px] border-r border-zinc-700/50 overflow-y-auto ${selectedChat ? "hidden md:block" : ""}`}>
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium text-sm">Không có cuộc hội thoại nào</p>
              <p className="text-xs text-zinc-500 mt-1">Đang chờ tin nhắn từ khách hàng...</p>
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left px-4 py-3.5 border-b border-zinc-700/50/50 hover:bg-zinc-900/50 transition ${
                  selectedChat?.id === chat.id ? "bg-teal-500/5 border-l-2 border-l-teal-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {chat.userName?.charAt(0)?.toUpperCase() ?? "K"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-zinc-200 truncate">{chat.userName}</p>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">
                        {timeAgo(chat.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{chat.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[chat.status].color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[chat.status].dot}`} />
                        {STATUS_CONFIG[chat.status].label}
                      </span>
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat Detail */}
        <div className={`flex-1 flex flex-col ${!selectedChat ? "hidden md:flex" : ""}`}>
          {!selectedChat ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Bot className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-lg text-zinc-400">Chọn một cuộc hội thoại</p>
              <p className="text-sm text-zinc-500">để bắt đầu trả lời khách hàng</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-zinc-800 transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-zinc-400" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                    {selectedChat.userName?.charAt(0)?.toUpperCase() ?? "K"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-200">{selectedChat.userName}</p>
                    <p className="text-[11px] text-zinc-500">{selectedChat.userEmail}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedChat.status === "OPEN" && (
                    <button
                      onClick={() => handleAssign(selectedChat.id)}
                      disabled={assigningChatId === selectedChat.id || closingChatId === selectedChat.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 disabled:opacity-60 transition"
                    >
                      {assigningChatId === selectedChat.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      Nhận xử lý
                    </button>
                  )}
                  {selectedChat.status === "ASSIGNED" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      Đang xử lý
                    </span>
                  )}
                  {selectedChat.status !== "CLOSED" && (
                    <button
                      onClick={() => handleClose(selectedChat.id)}
                      disabled={closingChatId === selectedChat.id || assigningChatId === selectedChat.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-700/40 bg-rose-950/20 text-rose-300 text-xs font-medium hover:bg-rose-950/40 disabled:opacity-60 transition"
                    >
                      {closingChatId === selectedChat.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldX className="w-3.5 h-3.5" />
                      )}
                      Đóng chat
                    </button>
                  )}
                  <button
                    onClick={() => fetchMessages(selectedChat.id)}
                    disabled={refreshingMessages}
                    className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-60 transition"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 text-zinc-500 ${refreshingMessages ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {selectedChat.status === "CLOSED" && (
                <div className="mx-4 mt-3 rounded-lg border border-zinc-700/70 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
                  Phiên chat đã đóng. Chỉ xem lịch sử, không thể gửi thêm tin nhắn.
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                    Chưa có tin nhắn trong phiên này.
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === "USER" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.senderType === "USER"
                        ? "bg-zinc-900 border border-zinc-700/50 text-zinc-300 rounded-bl-sm"
                        : msg.senderType === "AI"
                          ? "bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-br-sm"
                          : "bg-teal-600 text-white rounded-br-sm"
                    }`}>
                      {msg.senderType === "AI" && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-400 font-medium mb-1">
                          <Bot className="w-3 h-3" /> AI Auto-reply
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        msg.senderType === "USER" ? "text-zinc-500" : msg.senderType === "AI" ? "text-purple-500" : "text-white/60"
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        {msg.senderType !== "USER" && msg.isRead && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              {selectedChat.status !== "CLOSED" && (
                <div className="border-t border-zinc-700/50 bg-zinc-900/30 px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                      placeholder="Nhập tin nhắn trả lời..."
                      className="flex-1 h-10 px-4 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none transition"
                    />
                    <button
                      onClick={() => void sendMessage()}
                      disabled={!input.trim() || sending}
                      className="px-4 h-10 rounded-md bg-teal-600 text-white font-medium text-sm hover:bg-teal-500 disabled:opacity-50 transition flex items-center gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Gửi
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
