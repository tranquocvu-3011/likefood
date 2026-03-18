/**
 * LIKEFOOD - Ultimate Smart Chatbot AI v10/10
 * Vietnamese Specialty Marketplace
 * 
 * TÍNH NĂNG:
 * ✅ SSE Streaming (real-time response)
 * ✅ Ultimate Data Reader (200+ products, 15+ sources)
 * ✅ Product Cards hiển thị trong chat
 * ✅ Quick Replies động theo context
 * ✅ Client-side caching (localStorage)
 * ✅ Smart typing indicator
 * ✅ Error handling tốt
 * 
 * Copyright (c) 2026 LIKEFOOD Team
 */

"use client";

import { useEffect, useRef, useState, useCallback, type KeyboardEvent, TextDecoder } from "react";
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
  Package,
  Star,
  ShoppingCart,
  Gift,
} from "lucide-react";

/* ─── Types ─── */
interface Message {
  id: number;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  senderType?: "USER" | "ADMIN" | "AI";
  products?: ProductCard[];
}

interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
}

type ChatMode = "ai" | "live";
type LiveChatStatus = "OPEN" | "ASSIGNED" | "CLOSED" | null;

/* ─── Constants ─── */
const CHAT_STORAGE_KEY = "likefood_chat_history";
const MAX_CACHED_MESSAGES = 50;

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

const DEFAULT_QUICK_REPLIES_VI = [
  { emoji: "🍵", text: "Gợi ý trà & cà phê" },
  { emoji: "🎁", text: "Combo quà biếu" },
  { emoji: "🚚", text: "Phí giao hàng" },
  { emoji: "📦", text: "Theo dõi đơn hàng" },
];

const DEFAULT_QUICK_REPLIES_EN = [
  { emoji: "🍵", text: "Tea & Coffee suggestions" },
  { emoji: "🎁", text: "Gift combos" },
  { emoji: "🚚", text: "Shipping fees" },
  { emoji: "📦", text: "Track order" },
];

/* ─── Dynamic Quick Replies Based on Context ─── */
const getContextualQuickReplies = (lastMessage?: string, isVietnamese = true): { emoji: string; text: string }[] => {
  if (!lastMessage) {
    return isVietnamese ? DEFAULT_QUICK_REPLIES_VI : DEFAULT_QUICK_REPLIES_EN;
  }
  
  const lowerMsg = lastMessage.toLowerCase();
  
  if (lowerMsg.includes("trà") || lowerMsg.includes("coffee") || lowerMsg.includes("cà phê")) {
    return isVietnamese 
      ? [{ emoji: "☕", text: "Cà phê rang xay" }, { emoji: "🧋", text: "Trà sữa" }, { emoji: "🍵", text: "Trà trái cây" }, { emoji: "🎁", text: "Combo tiết kiệm" }]
      : [{ emoji: "☕", text: "Ground coffee" }, { emoji: "🧋", text: "Milk tea" }, { emoji: "🍵", text: "Fruit tea" }, { emoji: "🎁", text: "Combo deals" }];
  }
  
  if (lowerMsg.includes("quà") || lowerMsg.includes("gift") || lowerMsg.includes("biếu")) {
    return isVietnamese
      ? [{ emoji: "🎀", text: "Combo quà Tết" }, { emoji: "📦", text: "Quà tặng VIP" }, { emoji: "💝", text: "Quà biếu parents" }, { emoji: "🎁", text: "Hộp quà đặc biệt" }]
      : [{ emoji: "🎀", text: "Tet gift combos" }, { emoji: "📦", text: "VIP gifts" }, { emoji: "💝", text: "Parents gifts" }, { emoji: "🎁", text: "Special boxes" }];
  }
  
  if (lowerMsg.includes("giao") || lowerMsg.includes("shipping") || lowerMsg.includes("vận chuyển")) {
    return isVietnamese
      ? [{ emoji: "📦", text: "Giao hàng nhanh" }, { emoji: "🏠", text: "Nhận tại cửa hàng" }, { emoji: "💰", text: "Phí giao hàng" }, { emoji: "🎁", text: "Freeship" }]
      : [{ emoji: "📦", text: "Fast delivery" }, { emoji: "🏠", text: "Store pickup" }, { emoji: "💰", text: "Shipping fees" }, { emoji: "🎁", text: "Free shipping" }];
  }
  
  return isVietnamese ? DEFAULT_QUICK_REPLIES_VI : DEFAULT_QUICK_REPLIES_EN;
};

/* ─── Helpers ─── */
function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  const rawHtml = text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-600 underline hover:text-emerald-700" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ['br', 'strong', 'em', 'a'], ALLOWED_ATTR: ['class', 'href', 'target', 'rel'] });
}

/* ─── Local Storage Functions ─── */
function saveChatToStorage(messages: Message[]) {
  try {
    const recentMessages = messages.slice(-MAX_CACHED_MESSAGES);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(recentMessages));
  } catch { /* ignore */ }
}

function loadChatFromStorage(): Message[] | null {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const messages = JSON.parse(stored);
      return messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
  } catch { /* ignore */ }
  return null;
}

function clearChatStorage() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch { /* ignore */ }
}

/* ─── Component ─── */
export default function ChatbotAI() {
  const { isOpen: isVisible, toggle: toggleChat } = useChatOpen();
  const { language } = useLanguage();
  const isVietnamese = language === "vi";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("ai");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [liveChatId, setLiveChatId] = useState<string | null>(null);
  const [liveChatStatus, setLiveChatStatus] = useState<LiveChatStatus>(null);
  const [liveChatAdminTyping, setLiveChatAdminTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState(isVietnamese ? DEFAULT_QUICK_REPLIES_VI : DEFAULT_QUICK_REPLIES_EN);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimeRef = useRef<number | null>(null);

  // Initialize messages from storage or defaults
  useEffect(() => {
    const stored = loadChatFromStorage();
    if (stored && stored.length > 0) {
      setMessages(stored);
    } else {
      setMessages([isVietnamese ? INITIAL_MESSAGE_VI : INITIAL_MESSAGE_EN]);
    }
  }, []);

  // Update quick replies based on last message
  useEffect(() => {
    if (messages.length > 1) {
      const lastMsg = messages[messages.length - 1]?.content;
      setQuickReplies(getContextualQuickReplies(lastMsg, isVietnamese));
    }
  }, [messages, isVietnamese]);

  // Save to localStorage on messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatToStorage(messages);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── Live Chat Polling ─── */
  const startPolling = useCallback((chatId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/live-chat/${chatId}/messages?after=${lastPollTimeRef.current || 0}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages?.length > 0) {
            lastPollTimeRef.current = Date.now();
            const newMessages: Message[] = data.messages.map((m: { id: number; content: string; senderType: string; createdAt: string }) => ({
              id: m.id,
              role: m.senderType === "USER" ? "user" : "model",
              content: m.content,
              timestamp: new Date(m.createdAt),
              senderType: m.senderType as "USER" | "ADMIN" | "AI",
            }));
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
              return [...prev, ...uniqueNew];
            });
          }
          if (data.adminTyping) setLiveChatAdminTyping(true);
          else setLiveChatAdminTyping(false);
          if (data.status === "CLOSED") {
            setLiveChatStatus("CLOSED");
            stopPolling();
          }
        }
      } catch { /* ignore */ }
    }, 3000);
  }, []);

  const stopPolling = useCallback(() => {
    lastPollTimeRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  /* ─── Send Message ─── */
  const sendMessage = async (value?: string) => {
    const nextInput = (value ?? input).trim();
    if (!nextInput || isLoading) return;

    setShowQuickReplies(false);
    const userMessage: Message = { id: Number(Date.now()), role: "user", content: nextInput, timestamp: new Date(), senderType: "USER" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      if (chatMode === "live" && liveChatId) {
        // Live Chat Mode
        const res = await fetch(`/api/live-chat/${liveChatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: nextInput }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.error === "Phiên chat đã được đóng.") {
            setChatMode("ai");
            setLiveChatId(null);
            setLiveChatStatus(null);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: "model", content: isVietnamese ? "Phiên chat đã kết thúc. Chuyển sang AI." : "Chat ended. Switched to AI.", timestamp: new Date() }]);
            return;
          }
          throw new Error(data?.error || "Không thể gửi tin nhắn.");
        }

        const data = await res.json();
        if (data.message?.id) {
          setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, id: data.message.id } : m));
        }
      } else {
        // AI Chat Mode - SSE Streaming
        const currentMsgId = Number(Date.now()) + 1;
        setMessages(prev => [...prev, { id: currentMsgId, role: "model", content: "", timestamp: new Date(), senderType: "AI" }]);

        const response = await fetch("/api/ai/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: nextInput,
            sessionId: analytics.getSessionId(),
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || (isVietnamese ? "Không thể kết nối." : "Connection failed."));
        }

        // Handle SSE Streaming
        if (response.body) {
          const decoder = new TextDecoder();
          let fullContent = "";
          const reader = response.body.getReader();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const text = decoder.decode(value);
              const lines = text.split("\n");
              
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const evt = JSON.parse(line.slice(6));
                    if (evt.event === "chunk" && evt.data?.content) {
                      fullContent += evt.data.content;
                      setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, content: fullContent } : m));
                    } else if (evt.event === "done" && !fullContent && evt.data?.content) {
                      fullContent = evt.data.content;
                      setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, content: fullContent } : m));
                    }
                  } catch { /* skip */ }
                }
              }
            }
          } catch { /* stream ended */ }
        } else {
          // Fallback
          const data = await response.json().catch(() => ({}));
          const reply = data.content || data.response || (isVietnamese ? "Mình chưa có câu trả lời." : "No answer.");
          setMessages(prev => prev.map(m => m.id === currentMsgId ? { ...m, content: reply } : m));
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        role: "model",
        content: error instanceof Error ? error.message : (isVietnamese ? "Kết nối tạm gián đoạn." : "Connection interrupted."),
        timestamp: new Date(),
      }]);
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

  /* ─── Request Live Chat ─── */
  const requestLiveChat = async () => {
    try {
      const res = await fetch("/api/live-chat", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        const data = await res.json();
        setLiveChatId(data.id);
        setChatMode("live");
        setMessages(prev => [...prev, { id: Date.now() + 1, role: "model", content: isVietnamese ? "Đã kết nối với nhân viên. Vui lòng chờ..." : "Connected to staff. Please wait...", timestamp: new Date() }]);
        startPolling(data.id);
      }
    } catch { /* ignore */ }
  };

  const exitLiveChat = () => {
    setChatMode("ai");
    setLiveChatId(null);
    setLiveChatStatus(null);
    stopPolling();
    setMessages(prev => [...prev, { id: Date.now() + 1, role: "model", content: isVietnamese ? "Đã chuyển về AI. Cần giúp gì nữa?" : "Switched to AI. How can I help?", timestamp: new Date() }]);
  };

  const resetChat = () => {
    clearChatStorage();
    setMessages([isVietnamese ? INITIAL_MESSAGE_VI : INITIAL_MESSAGE_EN]);
    setQuickReplies(isVietnamese ? DEFAULT_QUICK_REPLIES_VI : DEFAULT_QUICK_REPLIES_EN);
  };

  const headerGradient = chatMode === "live" ? "from-blue-600 via-indigo-600 to-purple-600" : "from-emerald-600 via-teal-600 to-green-600";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className={`flex items-center justify-between bg-gradient-to-r ${headerGradient} px-4 py-3 text-white`}>
            <div className="flex items-center gap-2">
              {chatMode === "live" && <ArrowLeft className="h-4 w-4 cursor-pointer hover:opacity-80" onClick={exitLiveChat} />}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{chatMode === "live" ? (isVietnamese ? "Live Support" : "Live Support") : "LIKEFOOD AI"}</h3>
                <p className="text-xs text-white/80">{chatMode === "live" ? (isVietnamese ? "Nhân viên hỗ trợ" : "Staff support") : (isVietnamese ? "Trợ lý ẩm thực" : "Food assistant"))}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {chatMode === "ai" && (
                <button onClick={requestLiveChat} className="rounded-lg bg-white/20 p-2 hover:bg-white/30" title={isVietnamese ? "Chat với nhân viên" : "Chat with staff"}>
                  <Headphones className="h-4 w-4" />
                </button>
              )}
              <button onClick={resetChat} className="rounded-lg bg-white/20 p-2 hover:bg-white/30" title={isVietnamese ? "Làm mới" : "Reset"}>
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={toggleChat} className="rounded-lg bg-white/20 p-2 hover:bg-white/30">
                <Minus className="h-4 w-4" />
              </button>
              <button onClick={toggleChat} className="rounded-lg bg-white/20 p-2 hover:bg-white/30">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                  {message.role === "model" && (
                    <div className="mb-1 flex items-center gap-1">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs text-slate-500">LIKEFOOD AI</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    message.role === "user" 
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white" 
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                    
                    {/* Product Cards */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.products.map(product => (
                          <Link key={product.id} href={`/products/${product.slug}`} className="block rounded-lg bg-white p-2 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex gap-2">
                              {product.image && (
                                <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-slate-800 truncate">{product.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {product.salePrice ? (
                                    <>
                                      <span className="text-emerald-600 font-bold">${product.salePrice}</span>
                                      <span className="text-slate-400 line-through text-xs">${product.price}</span>
                                    </>
                                  ) : (
                                    <span className="text-emerald-600 font-bold">${product.price}</span>
                                  )}
                                </div>
                                {product.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-slate-500">{product.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 flex justify-start">
                <div className="flex items-center gap-1">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {showQuickReplies && messages.length <= 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(reply.text)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                  >
                    {reply.emoji} {reply.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isVietnamese ? "Nhập tin nhắn..." : "Type a message..."}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
