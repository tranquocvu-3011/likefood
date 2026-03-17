"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { useLanguage } from "@/lib/i18n/context";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Set greeting when opening for the first time
  useEffect(() => {
    if (open && !initialized) {
      setMessages([
        {
          role: "assistant",
          content: t("chatWidget.greeting"),
        },
      ]);
      setInitialized(true);
      trackEvent("view_home");
    }
  }, [open, initialized, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const QUICK_QUESTIONS = [
    t("chatWidget.quickQ1"),
    t("chatWidget.quickQ2"),
    t("chatWidget.quickQ3"),
    t("chatWidget.quickQ4"),
  ];

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError(null);
    setInput("");

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("chatWidget.sendError"));
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "..." },
      ]);
    } catch {
      setError(t("chatWidget.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden md:inline text-xs font-semibold">
            {t("chatWidget.chatNow")}
          </span>
        </button>
      )}

      {/* Chat box */}
      {open && (
        <div className="w-[320px] max-w-[90vw] h-[420px] rounded-3xl shadow-2xl bg-white border border-slate-200 flex flex-col overflow-hidden ring-4 ring-slate-900/5">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-800 text-white">
            <div>
              <p className="text-xs font-bold tracking-wide uppercase">
                LIKEFOOD
              </p>
              <p className="text-[11px] text-white/80">
                {t("chatWidget.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 px-3 py-2 space-y-2 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-slate-800 text-white rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                  }`}
                >
                  {m.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("chatWidget.typing")}
              </div>
            )}

            {error && (
              <p className="text-[11px] text-red-500 mt-1">{error}</p>
            )}

            {/* Quick questions */}
            <div className="pt-1 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                {t("chatWidget.quickSuggestions")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="px-2.5 py-1.5 rounded-lg bg-white text-[11px] border border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-100 bg-white px-3 py-2.5 flex items-center gap-2 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chatWidget.placeholder")}
              className="flex-1 text-[13px] px-3 py-2 rounded-full bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-full bg-slate-800 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
