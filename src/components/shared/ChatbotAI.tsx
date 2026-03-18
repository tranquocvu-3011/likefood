"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Smart Hybrid ChatbotAI — AI Chat + Live Chat nhân viên
 * Powered by ChatGPT + Polling realtime
 * Copyright (c) 2026 LIKEFOOD Team
 */

// Force Turbopack recompile - no Bot icon used here
import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { analytics } from "@/lib/analytics/sdk";
import { useLanguage } from "@/lib/i18n/context";
import DOMPurify from "isomorphic-dompurify";
import {
  ArrowUp,
  RotateCcw,
  Sparkles,
  X,
  Minus,
  Zap,
  Headphones,
  ArrowLeft,
} from "lucide-react";

/* ─── Types ─── */
interface Message {
  id: number;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  senderType?: "USER" | "ADMIN" | "AI";
}

type ChatMode = "ai" | "live";
type LiveChatStatus = "OPEN" | "ASSIGNED" | "CLOSED" | null;

const INITIAL_MESSAGE_VI = {
  id: 1,
  role: "model" as const,
  content:
    "Xin chào! 👋 Mình là **LIKEFOOD AI** — trợ lý ẩm thực thông minh của bạn.\n\n🛒 Gợi ý sản phẩm phù hợp\n📦 Theo dõi đơn hàng\n🎁 Tư vấn combo & quà biếu\n💬 Giải đáp mọi thắc mắc\n\nBạn cần mình giúp gì nào? 😊",
  timestamp: new Date(),
};

const INITIAL_MESSAGE_EN = {
  id: 2,
  role: "model" as const,
  content:
    "Hello! 👋 I'm **LIKEFOOD AI** — your smart food shopping assistant.\n\n🛒 Product recommendations\n📦 Order tracking\n🎁 Gift combos & suggestions\n💬 Answer your questions\n\nHow can I help you today? 😊",
  timestamp: new Date(),
};

const QUICK_REPLIES_VI = [
  { emoji: "🍵", text: "Gợi ý trà & cà phê" },
  { emoji: "🎁", text: "Combo quà biếu" },
  { emoji: "🚚", text: "Phí giao hàng" },
  { emoji: "📦", text: "Theo dõi đơn hàng" },
];

const QUICK_REPLIES_EN = [
  { emoji: "🍵", text: "Tea & Coffee suggestions" },
  { emoji: "🎁", text: "Gift combos" },
  { emoji: "🚚", text: "Shipping fees" },
  { emoji: "📦", text: "Track order" },
];

/* ─── Helpers ─── */
function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMarkdown(text: string) {
  const rawHtml = text
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-600 underline hover:text-emerald-700" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
  });
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <BotAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm border border-slate-100">
        <div className="flex items-center gap-1">
          <motion.span className="block h-2 w-2 rounded-full bg-emerald-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
          <motion.span className="block h-2 w-2 rounded-full bg-emerald-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
          <motion.span className="block h-2 w-2 rounded-full bg-emerald-400" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Bot Avatar ─── */
function BotAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const imgSize = size === "sm" ? 20 : 26;
  return (
    <div className={`${dims} shrink-0 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 ring-2 ring-white overflow-hidden`}>
      <Image src="/ChatBotAI.png" alt="AI" width={imgSize} height={imgSize} className="object-contain" />
    </div>
  );
}

/* ─── Admin Avatar (for live chat) ─── */
function AdminAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div className={`${dims} shrink-0 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-200/50 ring-2 ring-white`}>
      <Headphones className={size === "sm" ? "h-3.5 w-3.5 text-white" : "h-4.5 w-4.5 text-white"} />
    </div>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isModel = message.role === "model";
  const isAdmin = message.senderType === "ADMIN";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex items-end gap-2.5 ${isModel ? "justify-start" : "justify-end"}`}
    >
      {isModel && (isAdmin ? <AdminAvatar size="sm" /> : <BotAvatar size="sm" />)}

      <div className={`group relative max-w-[82%] ${isModel ? "" : "order-1"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${isModel
            ? isAdmin
              ? "rounded-bl-md bg-blue-50 text-slate-700 shadow-sm border border-blue-100"
              : "rounded-bl-md bg-white text-slate-700 shadow-sm border border-slate-100"
            : "rounded-br-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/30"
            }`}
        >
          {isAdmin && (
            <p className="text-[10px] font-bold text-blue-500 mb-0.5">Nhân viên LIKEFOOD</p>
          )}
          <div
            className="whitespace-pre-wrap [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        </div>

        <div
          className={`mt-1 text-[10px] font-medium transition-opacity ${isLast ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } ${isModel ? "text-slate-400 pl-1" : "text-slate-400 text-right pr-1"}`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>

      
    </motion.div>
  );
}

/* ─── Waiting for Agent Banner ─── */
function WaitingBanner({ isVietnamese, status }: { isVietnamese: boolean; status: "OPEN" | "ASSIGNED" }) {
  const isAssigned = status === "ASSIGNED";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-3 mb-2 rounded-xl border px-3.5 py-3 ${
        isAssigned
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100"
          : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
      }`}
    >
      {/* Pulsing indicator */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="relative flex items-center justify-center">
          <span className={`absolute h-3 w-3 rounded-full animate-ping opacity-50 ${isAssigned ? "bg-emerald-400" : "bg-blue-400"}`} />
          <span className={`relative h-2.5 w-2.5 rounded-full ${isAssigned ? "bg-emerald-500" : "bg-blue-500"}`} />
        </div>
        <p className={`text-[11.5px] font-semibold ${isAssigned ? "text-emerald-700" : "text-blue-700"}`}>
          {isAssigned
            ? (isVietnamese ? "Đã kết nối với nhân viên" : "Connected with support agent")
            : (isVietnamese ? "Vui lòng đợi nhân viên kết nối..." : "Please wait for an agent to connect...")}
        </p>
      </div>

      {/* Contact links */}
      <p className="text-[10.5px] text-slate-500 mb-2">
        {isVietnamese
          ? "Trong khi đợi, bạn có thể liên hệ qua:"
          : "While waiting, you can reach us via:"}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <a href="mailto:tranquocvu3011@gmail.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-red-600 border border-red-100 hover:bg-red-50 transition shadow-sm">
          <span>✉️</span> Gmail
        </a>
        <a href="https://t.me/tranquocvu3011" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-sky-600 border border-sky-100 hover:bg-sky-50 transition shadow-sm">
          <span>✈️</span> Telegram
        </a>
        <a href="https://www.facebook.com/vudev05" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-blue-600 border border-blue-100 hover:bg-blue-50 transition shadow-sm">
          <span>💬</span> Facebook
        </a>
        <a href="tel:+14023158105"
          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-emerald-600 border border-emerald-100 hover:bg-emerald-50 transition shadow-sm">
          <span>📞</span> 402-315-8105
        </a>
      </div>

      {/* Browse products suggestion */}
      <Link href="/products" className="flex items-center gap-2 rounded-lg bg-white/80 border border-emerald-100 px-3 py-2 hover:bg-emerald-50 transition group">
        <span className="text-base">🛒</span>
        <div>
          <p className="text-[11px] font-semibold text-emerald-700 group-hover:text-emerald-800">
            {isVietnamese
              ? "Xem toàn bộ sản phẩm LIKEFOOD"
              : "Browse all LIKEFOOD products"}
          </p>
          <p className="text-[9.5px] text-slate-400">
            {isVietnamese
              ? "Có lẽ bạn sẽ thích đấy... 😊"
              : "You might find something you love... 😊"}
          </p>
        </div>
        <span className="ml-auto text-slate-300 group-hover:text-emerald-500 transition">→</span>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                             */
/* ═══════════════════════════════════════════════════════════ */

export default function ChatbotAI() {
  const { setChatOpen } = useChatOpen();
  const { t, language, isVietnamese } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([isVietnamese ? INITIAL_MESSAGE_VI : INITIAL_MESSAGE_EN]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [hasNotification, setHasNotification] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Live Chat State ───────────────────────────────────────
  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [liveChatId, setLiveChatId] = useState<number | null>(null);
  const [liveChatStatus, setLiveChatStatus] = useState<LiveChatStatus>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEndingLiveChat, setIsEndingLiveChat] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollTimeRef = useRef<string | null>(null);
  const closeNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingCloseNoticeRef = useRef(false);

  const resetToAiMode = useCallback(() => {
    if (closeNoticeTimerRef.current) {
      clearTimeout(closeNoticeTimerRef.current);
      closeNoticeTimerRef.current = null;
    }
    isShowingCloseNoticeRef.current = false;
    setChatMode("ai");
    setLiveChatId(null);
    setLiveChatStatus(null);
    lastPollTimeRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current);
    setInput("");
    setShowQuickReplies(true);
    setMessages([isVietnamese ? INITIAL_MESSAGE_VI : INITIAL_MESSAGE_EN]);
  }, [isVietnamese]);

  const showClosedNoticeThenExit = useCallback(() => {
    if (isShowingCloseNoticeRef.current) return;
    isShowingCloseNoticeRef.current = true;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setIsLoading(false);
    setIsConnecting(false);
    setIsEndingLiveChat(false);
    setInput("");

    const closeNotice = isVietnamese
      ? "Phiên chat đã được đóng bởi nhân viên. Cảm ơn bạn đã liên hệ LIKEFOOD! Đang chuyển hướng🙏"
      : "The chat session has been closed by support. Thank you for contacting LIKEFOOD! Redirecting🙏";

    setMessages((prev) => {
      const exists = prev.some((m) => m.content.includes("Đang chuyển hướng🙏") || m.content.includes("Redirecting🙏"));
      if (exists) return prev;
      return [
        ...prev,
        {
          id: Date.now() + 99,
          role: "model",
          content: closeNotice,
          timestamp: new Date(),
          senderType: "ADMIN",
        },
      ];
    });

    if (closeNoticeTimerRef.current) clearTimeout(closeNoticeTimerRef.current);
    closeNoticeTimerRef.current = setTimeout(() => {
      resetToAiMode();
      setIsOpen(false);
      setIsMinimized(false);
      setChatOpen(false);
    }, 3000);
  }, [isVietnamese, resetToAiMode, setChatOpen]);

  /* ─ Scroll hide for FAB ─ */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsVisible(y <= lastScrollY || y < 120);
      setLastScrollY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  /* ─ Auto-scroll on new message ─ */
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  /* ─ Focus textarea ─ */
  useEffect(() => {
    if (isOpen && !isMinimized) textareaRef.current?.focus();
  }, [isOpen, isMinimized]);

  /* ─ Escape to close ─ */
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeAssistant();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  /* ─ Polling for live chat messages ─ */
  useEffect(() => {
    if (chatMode !== "live" || !liveChatId || !isOpen) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const poll = async (isInitialPoll = false) => {
      try {
        const sinceParam = lastPollTimeRef.current ? `?since=${lastPollTimeRef.current}` : "";
        const res = await fetch(`/api/live-chat/${liveChatId}/messages${sinceParam}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.serverTime) lastPollTimeRef.current = data.serverTime;

        if (data.chatStatus === "OPEN" || data.chatStatus === "ASSIGNED") {
          setLiveChatStatus(data.chatStatus);
        }

        if (data.chatStatus === "CLOSED") {
          showClosedNoticeThenExit();
          return;
        }

        if (data.messages?.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs: Message[] = data.messages
              .filter((m: { id: number; senderType: string }) => {
                if (existingIds.has(m.id)) return false;
                // Initial load: lấy tất cả (history). Subsequent polls: chỉ ADMIN/AI
                if (!isInitialPoll && m.senderType === "USER") return false;
                return true;
              })
              .map((m: { id: number; senderType: string; content: string; createdAt: string }) => ({
                id: m.id,
                role: m.senderType === "USER" ? "user" as const : "model" as const,
                content: m.content,
                timestamp: new Date(m.createdAt),
                senderType: m.senderType,
              }));
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
          });
        }
      } catch {
        // Silent fail for polling
      }
    };

    // Initial fetch of all messages (history)
    if (!lastPollTimeRef.current) {
      void poll(true);
    }

    pollRef.current = setInterval(() => poll(false), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [chatMode, liveChatId, isOpen, resetToAiMode, showClosedNoticeThenExit]);

  /* ─ Cleanup on unmount ─ */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (closeNoticeTimerRef.current) clearTimeout(closeNoticeTimerRef.current);
    };
  }, []);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setChatOpen(true);
    setHasNotification(false);
    setNotifMessage("");
  }, [setChatOpen]);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setChatOpen(false);
    // Hiển thị notification sau 3 giây khi đóng chat
    setTimeout(() => {
      setHasNotification(true);
      setNotifMessage(language === "vi"
        ? "Bạn có tin nhắn từ LIKEFOOD AI👋"
        : "You have a message from LIKEFOOD AI👋");
    }, 3000);
  }, [setChatOpen, language]);

  const resetConversation = () => {
    setMessages([isVietnamese ? INITIAL_MESSAGE_VI : INITIAL_MESSAGE_EN]);
    setInput("");
    setShowQuickReplies(true);
    setChatMode("ai");
    setLiveChatId(null);
    lastPollTimeRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const endLiveChat = async () => {
    if (!liveChatId || chatMode !== "live") {
      resetToAiMode();
      return;
    }

    setIsEndingLiveChat(true);
    try {
      await fetch(`/api/live-chat/${liveChatId}/close`, { method: "POST" });
    } catch {
      // Even if close API fails transiently, user side still resets to a new AI conversation.
    } finally {
      showClosedNoticeThenExit();
    }
  };

  /* ─── Switch to Live Chat ─── */
  const enterLiveChatMode = () => {
    setChatMode("live");
    setLiveChatId(null);
    setLiveChatStatus(null);
    setShowQuickReplies(false);
  };

  const startLiveChatSession = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: isVietnamese
            ? "Xin chào, tôi muốn được hỗ trợ trực tiếp."
            : "Hello, I'd like to speak with a support agent.",
          subject: "Live Chat từ Chatbot",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            role: "model",
            content: isVietnamese
              ? "⚠️ Bạn cần **đăng nhập** để chat trực tiếp với nhân viên. Vui lòng đăng nhập rồi thử lại nhé!"
              : "⚠️ Please **log in** to chat with a support agent.",
            timestamp: new Date(),
          }]);
          return;
        }
        throw new Error(data?.error || "Không thể kết nối.");
      }

      const data = await res.json();
      setLiveChatId(data.chatId);
      setChatMode("live");
      // Always start in waiting state; switch to ASSIGNED only when admin clicks "Nhận xử lí".
      setLiveChatStatus("OPEN");
      lastPollTimeRef.current = null;
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "model",
        content: isVietnamese
          ? `❌ ${error instanceof Error ? error.message : "Không thể kết nối live chat."}`
          : `❌ ${error instanceof Error ? error.message : "Could not connect to live chat."}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsConnecting(false);
    }
  };

  /* ─── Back to AI mode ─── */
  const switchToAI = () => {
    setChatMode("ai");
    setLiveChatId(null);
    setLiveChatStatus(null);
    lastPollTimeRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current);
  };

  /* ─ Send message ─ */
  const sendMessage = async (value?: string) => {
    const nextInput = (value ?? input).trim();
    if (!nextInput || isLoading) return;

    setShowQuickReplies(false);

    const userMessage: Message = {
      id: Number(Date.now()),
      role: "user",
      content: nextInput,
      timestamp: new Date(),
      senderType: "USER",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      if (chatMode === "live" && liveChatId) {
        // ─── Live Chat Mode: gửi qua API ───────────────
        const res = await fetch(`/api/live-chat/${liveChatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: nextInput }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.error === "Phiên chat đã được đóng.") {
            showClosedNoticeThenExit();
            return;
          }
          throw new Error(data?.error || "Không thể gửi tin nhắn.");
        }

        // Update local message ID with server DB ID to prevent polling duplicates
        const data = await res.json();
        if (data.message?.id) {
          setMessages(prev =>
            prev.map(m =>
              m.id === userMessage.id ? { ...m, id: data.message.id } : m
            )
          );
        }

        // Live Chat: KHÔNG tự trả lời — chỉ chờ nhân viên
        // Message đã được gửi về server → Telegram notification tự động
      } else {
        // ─── AI Chat Mode: gửi qua AI API ──────────────
        const response = await fetch("/api/ai/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: nextInput,
            sessionId: analytics.getSessionId(),
            history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || (isVietnamese ? "Không thể kết nối. Vui lòng thử lại!" : "Connection failed. Please try again!"));
        }

        const replyContent = data.content ?? data.response ?? (isVietnamese ? "Mình chưa có câu trả lời phù hợp. Bạn thử hỏi lại cụ thể hơn nhé! 😊" : "I don't have a suitable answer. Try asking more specifically! 😊");

        const modelMessage: Message = {
          id: Number(Date.now() + 1),
          role: "model",
          content: replyContent,
          timestamp: new Date(),
          senderType: "AI",
        };

        setMessages((prev) => [...prev, modelMessage]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "model",
          content: error instanceof Error ? error.message : (isVietnamese ? "Kết nối tạm gián đoạn. Thử lại sau ít phút nhé! 🙏" : "Connection interrupted. Try again later! 🙏"),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const headerGradient = chatMode === "live"
    ? "from-blue-600 via-indigo-600 to-purple-600"
    : "from-emerald-600 via-teal-600 to-green-600";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-[5.5rem] right-3 z-[90] lg:bottom-6 lg:right-6 lg:z-[110]"
        >
          {/* ═══════ FAB Button ═══════ */}
          {!isOpen && (
            <motion.button
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.94 }}
              onClick={openAssistant}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-white/80 transition-shadow hover:shadow-2xl hover:shadow-emerald-500/40"
              aria-label={language === "vi" ? "LIKEFOOD AI - Mở chat" : "LIKEFOOD AI - Open chat"}
            >
              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/20" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
              <Image src="/ChatBotAI.png" alt="AI" width={28} height={28} className="relative drop-shadow object-contain" />
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow-lg ring-2 ring-white">
                <Zap className="h-2.5 w-2.5 text-amber-900" />
              </div>

              {/* Notification badge + tooltip */}
              {hasNotification && (
                <>
                  {/* Red dot */}
                  <span className="absolute -left-1 -top-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 ring-2 ring-white" />
                  </span>
                  {/* Notification popup */}
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className="absolute right-[4.2rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-white px-3.5 py-2 text-[11.5px] font-medium text-slate-700 shadow-xl border border-slate-200 max-w-[200px]"
                  >
                    <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🤖</span>
                      <span>{notifMessage}</span>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.button>
          )}

          {/* ═══════ Chat Window ═══════ */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeAssistant}
                className="fixed inset-0 z-[109] bg-black/20"
              />

              {/* Chat panel */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-[110] flex h-[75vh] max-h-[600px] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:bottom-4 sm:left-auto sm:right-4 sm:h-[600px] sm:max-h-none sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200/80"
              >
                {/* ─── Drag Handle (mobile) ─── */}
                <div className="flex justify-center pt-2 pb-1 sm:hidden bg-gradient-to-r from-emerald-600/5 to-teal-600/5">
                  <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>

                {/* ─── Header ─── */}
                <div className={`shrink-0 bg-gradient-to-r ${headerGradient} px-4 py-3`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-2 ring-white/30">
                        {chatMode === "live" ? (
                          <Headphones className="h-5 w-5 text-white" />
                        ) : (
                          <Image src="/ChatBotAI.png" alt="AI" width={24} height={24} className="object-contain" />
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ${chatMode === "live" ? "bg-blue-400 ring-indigo-600" : "bg-green-400 ring-emerald-600"
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white tracking-wide">
                          {chatMode === "live" ? "Live Chat" : "LIKEFOOD AI"}
                        </p>
                        {chatMode === "ai" && <Sparkles className="h-3.5 w-3.5 text-amber-300" />}
                      </div>
                      <p className="text-[11px] text-white/80 font-medium">
                        {chatMode === "live"
                          ? (isVietnamese ? "Chat trực tiếp với nhân viên" : "Live chat with support")
                          : isLoading
                            ? (isVietnamese ? "Đang soạn tin nhắn..." : "Typing...")
                            : (isVietnamese ? "Trực tuyến • Sẵn sàng hỗ trợ" : "Online • Ready to help")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Switch mode button */}
                      {chatMode === "live" ? (
                        <>
                          <button
                            onClick={switchToAI}
                            className="flex h-8 items-center gap-1 rounded-full bg-white/15 px-2.5 text-[10px] font-bold text-white transition hover:bg-white/25"
                            title={isVietnamese ? "Quay về AI" : "Back to AI"}
                            aria-label={isVietnamese ? "Quay về chat AI" : "Switch back to AI chat"}
                          >
                            <ArrowLeft className="h-3 w-3" />
                            AI
                          </button>
                          <button
                            onClick={() => void endLiveChat()}
                            disabled={isEndingLiveChat}
                            className="flex h-8 items-center gap-1 rounded-full bg-red-500/20 px-2.5 text-[10px] font-bold text-white transition hover:bg-red-500/30 disabled:opacity-60"
                            title={isVietnamese ? "Kết thúc đoạn chat" : "End chat session"}
                            aria-label={isVietnamese ? "Kết thúc đoạn chat" : "End current chat session"}
                          >
                            <X className="h-3 w-3" />
                            {isEndingLiveChat
                              ? (isVietnamese ? "Đang đóng..." : "Closing...")
                              : (isVietnamese ? "Kết thúc đoạn chat" : "End chat")}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={enterLiveChatMode}
                          disabled={isConnecting}
                          className="flex h-8 items-center gap-1 rounded-full bg-white/15 px-2.5 text-[10px] font-bold text-white transition hover:bg-white/25 disabled:opacity-50"
                          title={isVietnamese ? "Chat với nhân viên" : "Chat with agent"}
                          aria-label={isVietnamese ? "Kết nối nhân viên hỗ trợ" : "Connect to support agent"}
                        >
                          <Headphones className="h-3 w-3" />
                          {isConnecting
                            ? "..."
                            : (isVietnamese ? "Nhân viên" : "Agent")}
                        </button>
                      )}
                      <button
                        onClick={() => setIsMinimized(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                        aria-label={isVietnamese ? "Thu nhỏ" : "Minimize"}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={closeAssistant}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                        aria-label={isVietnamese ? "Đóng" : "Close"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isMinimized ? (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-600">{isVietnamese ? "Cuộc trò chuyện đang chờ..." : "Conversation on hold..."}</span>
                    <button
                      onClick={() => setIsMinimized(false)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      {isVietnamese ? "Mở lại" : "Resume"}
                    </button>
                  </div>
                ) : (
                  <>
                    {chatMode === "live" && !liveChatId && (
                      <div className="mx-3 mt-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5">
                        <p className="text-xs font-semibold text-blue-700">
                          {isVietnamese
                            ? "Bấm để bắt đầu cuộc trò chuyện với nhân viên"
                            : "Click to start conversation with support"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {isVietnamese
                            ? "Khi bắt đầu, hệ thống sẽ gửi thông báo đến nhân viên qua Telegram."
                            : "Once started, the system will notify support via Telegram."}
                        </p>
                        <button
                          onClick={() => void startLiveChatSession()}
                          disabled={isConnecting}
                          className="mt-2.5 inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {isConnecting
                            ? (isVietnamese ? "Đang bắt đầu..." : "Starting...")
                            : (isVietnamese ? "Bắt đầu cuộc trò chuyện" : "Start conversation")}
                        </button>
                      </div>
                    )}

                    {/* ─── Live Chat Waiting Banner ─── */}
                    {chatMode === "live" && liveChatId && liveChatStatus !== "CLOSED" && (
                      <WaitingBanner
                        isVietnamese={isVietnamese}
                        status={liveChatStatus === "ASSIGNED" ? "ASSIGNED" : "OPEN"}
                      />
                    )}

                    {/* ─── Messages ─── */}
                    <div
                      ref={scrollRef}
                      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-50 to-white"
                    >
                      {messages.map((msg, idx) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isLast={idx === messages.length - 1 && !isLoading}
                        />
                      ))}

                      {isLoading && <TypingIndicator />}

                      {/* Quick replies */}
                      {showQuickReplies && messages.length <= 1 && !isLoading && chatMode === "ai" && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="pt-2"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 pl-10">
                            {isVietnamese ? "Gợi ý nhanh" : "Quick suggestions"}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pl-10">
                            {(isVietnamese ? QUICK_REPLIES_VI : QUICK_REPLIES_EN).map((qr) => (
                              <button
                                key={qr.text}
                                onClick={() => void sendMessage(qr.text)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm active:scale-95"
                              >
                                <span>{qr.emoji}</span>
                                <span>{qr.text}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* ─── Input Area ─── */}
                    <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5 pb-safe">
                      <div className="flex items-end gap-2">
                        <button
                          onClick={resetConversation}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label={t("chat.newConversation")}
                          title={isVietnamese ? "Cuộc trò chuyện mới" : "New conversation"}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>

                        <div className="flex-1 flex items-end rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 transition-colors focus-within:border-emerald-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                          <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={chatMode === "live"
                              ? (isVietnamese ? "Nhắn tin cho nhân viên..." : "Message support agent...")
                              : (isVietnamese ? "Nhắn tin cho LIKEFOOD AI..." : "Message LIKEFOOD AI...")}
                            rows={1}
                            className="flex-1 resize-none border-0 bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 max-h-[120px]"
                            style={{ height: "auto" }}
                          />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => void sendMessage()}
                          disabled={!input.trim() || isLoading || isEndingLiveChat}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${input.trim() && !isLoading
                            ? chatMode === "live"
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50 hover:shadow-lg"
                              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50 hover:shadow-lg"
                            : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            }`}
                          aria-label={t("chat.send")}
                        >
                          <ArrowUp className="h-4.5 w-4.5" />
                        </motion.button>
                      </div>

                      <p className="mt-1.5 text-center text-[9px] font-medium text-slate-300 tracking-wide">
                        {chatMode === "live"
                          ? "LIKEFOOD Live Chat • Hỗ trợ trực tiếp"
                          : "LIKEFOOD AI"}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
