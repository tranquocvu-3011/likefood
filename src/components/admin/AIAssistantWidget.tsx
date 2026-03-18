"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Maximize2, Minimize2, RefreshCw, Send, Sparkles, TrendingUp, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DashboardSnapshot {
  revenue: number;
  orders: number;
  customers: number;
  topProduct?: string;
  summary?: string;
}

const QUICK_PROMPTS = [
  "Tuần này nhóm quản trị cần ưu tiên xử lý gì trước?",
  "Sản phẩm nào có khả năng cần nhập thêm hàng sớm nhất?",
  "Tóm tắt các rủi ro doanh thu lớn nhất hiện tại.",
  "Chúng ta nên cải thiện trải nghiệm khách hàng ở điểm nào tiếp theo?",
];

const INITIAL_MESSAGE: Message = {
  id: 1,
  role: "assistant",
  content: "Tôi có thể giúp bạn phân tích tín hiệu cửa hàng, ưu tiên công việc và chuyển dữ liệu quản trị thành hành động cụ thể.",
  timestamp: new Date(),
};

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>({ revenue: 0, orders: 0, customers: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSnapshot = async () => {
    setIsLoadingSnapshot(true);
    try {
      const [dashboardRes, summaryRes] = await Promise.all([
        fetch("/api/analytics/dashboard"),
        fetch("/api/ai/admin?type=summary"),
      ]);

      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;
      const summaryData = summaryRes.ok ? await summaryRes.json() : null;

      setSnapshot({
        revenue: dashboardData?.revenue?.total || 0,
        orders: dashboardData?.orders?.total || 0,
        customers: dashboardData?.customers?.total || 0,
        topProduct: dashboardData?.topProducts?.[0]?.name,
        summary: summaryData?.summary || "",
      });
    } catch (error) {
      console.error("Failed to load admin AI snapshot:", error);
      setSnapshot({ revenue: 0, orders: 0, customers: 0, summary: "" });
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending, isOpen, isMinimized]);

  const summaryPreview = useMemo(() => {
    if (!snapshot.summary) return "Chưa tải được tóm tắt AI.";
    return snapshot.summary;
  }, [snapshot.summary]);

  const sendMessage = async (prompt?: string) => {
    const message = (prompt ?? input).trim();
    if (!message || isSending) return;

    const userMessage: Message = {
      id: Number(Date.now()),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message,
          context: {
            recentOrders: snapshot.orders,
            totalCustomers: snapshot.customers,
            totalRevenue: snapshot.revenue,
            topProducts: snapshot.topProduct ? [snapshot.topProduct] : [],
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Không thể kết nối với trợ lý AI quản trị.");
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: data.response || "Không nhận được phản hồi.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: error instanceof Error ? error.message : "Trợ lý AI quản trị tạm thời không khả dụng.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-[2rem] border border-zinc-700/50 bg-[#111113] shadow-[0_28px_90px_rgba(0,0,0,0.5)]"
          >
            <div className="border-b border-zinc-700/50 bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_45%,#1d4ed8_100%)] px-5 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white/12 ring-1 ring-white/15 backdrop-blur">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                      <Sparkles className="h-3.5 w-3.5" />
                      Trợ lý quản trị
                    </div>
                    <h3 className="mt-1 text-xl font-black tracking-tight">Bảng điều khiển AI</h3>
                    <p className="mt-1 text-sm leading-6 text-white/75">Hỗ trợ ra quyết định về doanh thu, khách hàng, tồn kho và các bước tiếp theo.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMinimized((current) => !current)}
                    className="rounded-full border border-white/15 bg-white/10 p-2 text-white/85 transition hover:bg-white/15"
                    aria-label={isMinimized ? "Mở rộng bảng" : "Thu nhỏ bảng"}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full border border-white/15 bg-white/10 p-2 text-white/85 transition hover:bg-white/15"
                    aria-label="Đóng bảng"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {isMinimized ? (
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <p className="text-sm text-zinc-400">Trợ lý quản trị sẵn sàng khi bạn cần ra quyết định tiếp theo.</p>
                <Button size="sm" onClick={() => setIsMinimized(false)}>Mở rộng</Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 border-b border-zinc-700/50 bg-zinc-900/50 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Dữ liệu quản trị trực tiếp</p>
                      <p className="mt-1 text-sm text-zinc-400">Lấy từ các endpoint dashboard và tóm tắt AI.</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => void loadSnapshot()} disabled={isLoadingSnapshot}>
                      {isLoadingSnapshot ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric label="Doanh thu" value={formatPrice(snapshot.revenue)} icon={TrendingUp} />
                    <Metric label="Đơn hàng" value={`${snapshot.orders}`} icon={Sparkles} />
                    <Metric label="Khách hàng" value={`${snapshot.customers}`} icon={Users} />
                  </div>
                  <div className="rounded-[1.4rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Tóm tắt AI</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-300">{summaryPreview}</p>
                    {snapshot.topProduct ? <p className="mt-3 text-xs font-semibold text-zinc-500">Sản phẩm bán chạy hiện tại: {snapshot.topProduct}</p> : null}
                  </div>
                </div>

                <div className="border-b border-zinc-700/50 px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div ref={scrollRef} className="max-h-[340px] space-y-4 overflow-y-auto bg-[#0A0A0B] px-5 py-5">
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    return (
                      <div key={message.id} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[88%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 ${isAssistant ? "border border-zinc-700 bg-zinc-800/50 text-zinc-200" : "bg-teal-600 text-white"}`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`mt-2 text-[11px] font-black uppercase tracking-[0.16em] ${isAssistant ? "text-zinc-500" : "text-white/55"}`}>
                            {isAssistant ? "AI" : "Bạn"} · {message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {isSending ? (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang phân tích dữ liệu cửa hàng...
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-zinc-700/50 bg-[#111113] px-5 py-4">
                  <div className="rounded-[1.6rem] border border-zinc-700/50 bg-zinc-900/50 p-3">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      rows={4}
                      placeholder="Hỏi nên ưu tiên gì tiếp theo, điều gì đang cản trở tăng trưởng, hoặc khu vực quản trị nào cần chú ý."
                      className="min-h-[110px] w-full resize-none border-0 bg-transparent text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-500"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-zinc-500">Dựa trên số liệu quản trị hiện tại khi có sẵn.</p>
                      <Button onClick={() => void sendMessage()} disabled={!input.trim() || isSending} className="rounded-full">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Gửi
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="pointer-events-auto overflow-hidden rounded-[1.9rem] border border-zinc-700/50 bg-[linear-gradient(135deg,#111827_0%,#0f766e_45%,#1d4ed8_100%)] px-5 py-4 text-left text-white shadow-[0_18px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white/12 ring-1 ring-white/15 backdrop-blur">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Trợ lý AI</p>
            <p className="mt-1 text-base font-black tracking-tight">Mở bảng quản trị AI</p>
            <p className="mt-1 text-sm text-white/72">Doanh thu, khách hàng, tồn kho và lên kế hoạch hành động trong một bảng.</p>
          </div>
        </div>
      </motion.button>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sparkles }) {
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 text-lg font-bold text-zinc-100">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
