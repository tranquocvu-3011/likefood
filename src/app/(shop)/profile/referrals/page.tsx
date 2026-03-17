"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Referral & Rewards Page — User Dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Copy, Check, Share2, Gift, DollarSign, Clock,
  TrendingUp, Loader2, Award, ArrowLeft,
  MessageCircle, Mail, Smartphone, Wallet, ExternalLink,
  CheckCircle2, Circle, Star, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ReferralDashboard, MilestoneItem, ReferralHistoryItem, CommissionItem } from "@/lib/referral/types";

type Tab = "overview" | "history" | "commissions" | "milestones" | "cashout";

export default function ReferralPage() {
  const { language } = useLanguage();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashoutMethod, setCashoutMethod] = useState("");
  const [cashoutDest, setCashoutDest] = useState("");
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [editingCode, setEditingCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  const t = useCallback(
    (vi: string, en: string) => (language === "vi" ? vi : en),
    [language]
  );

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/profile/referrals");
    }
  }, [sessionStatus, router]);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setDashboardError(false);
    try {
      const res = await fetch("/api/user/referrals/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
        setCustomCode(data.profile.customCode || "");
      } else {
        setDashboardError(true);
        setDashboard(null);
      }
    } catch (error) {
      logger.error("Failed to load referral dashboard", error as Error, { context: "referrals-page" });
      setDashboardError(true);
      setDashboard(null);
    }
    finally { setIsLoading(false); }
  }, []);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch("/api/user/referrals/milestones");
      if (res.ok) {
        const data = await res.json();
        setMilestones(data.milestones || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/user/referrals/history?limit=20");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      const res = await fetch("/api/user/referrals/commissions?limit=20");
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.items || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchDashboard();
      fetchMilestones();
    }
  }, [sessionStatus, fetchDashboard, fetchMilestones]);

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) fetchHistory();
    if (activeTab === "commissions" && commissions.length === 0) fetchCommissions();
  }, [activeTab, history.length, commissions.length, fetchHistory, fetchCommissions]);

  const handleCopy = async (type: "code" | "link") => {
    if (!dashboard) return;
    const text = type === "code"
      ? (dashboard.profile.customCode || dashboard.profile.systemCode)
      : dashboard.shareLink;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(t("Đã sao chép!", "Copied!"));
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = (platform: string) => {
    if (!dashboard) return;
    const url = dashboard.shareLink;
    const text = t(
      "Mua sắm đặc sản Việt trên LIKEFOOD và nhận ưu đãi!",
      "Shop Vietnamese specialties on LIKEFOOD and get rewards!"
    );
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      sms: `sms:?body=${encodeURIComponent(text + " " + url)}`,
      email: `mailto:?subject=${encodeURIComponent(t("Mời bạn mua sắm tại LIKEFOOD", "Join LIKEFOOD"))}&body=${encodeURIComponent(text + "\n\n" + url)}`,
    };
    window.open(urls[platform], "_blank");
  };

  const handleSaveCode = async () => {
    setSavingCode(true);
    try {
      const res = await fetch("/api/user/referrals/code", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: customCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("Đã cập nhật mã giới thiệu!", "Referral code updated!"));
        setEditingCode(false);
        fetchDashboard();
      } else {
        toast.error(data.error || t("Lỗi cập nhật", "Update failed"));
      }
    } catch { toast.error(t("Lỗi kết nối", "Connection error")); }
    finally { setSavingCode(false); }
  };

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount);
    if (!amount || !cashoutMethod) return;
    setCashoutLoading(true);
    try {
      const res = await fetch("/api/user/referrals/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: cashoutMethod,
          destinationData: cashoutDest ? (
            cashoutMethod === "PAYPAL" 
              ? { email: cashoutDest }
              : cashoutMethod === "VENMO"
                ? { handle: cashoutDest.replace("@", "") }
                : { accountNumber: cashoutDest }
          ) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("Yêu cầu rút tiền đã được gửi!", "Cashout request submitted!"));
        setShowCashoutModal(false);
        setCashoutAmount("");
        setCashoutMethod("");
        setCashoutDest("");
        fetchDashboard();
      } else {
        toast.error(data.error || t("Lỗi xử lý", "Processing error"));
      }
    } catch { toast.error(t("Lỗi kết nối", "Connection error")); }
    finally { setCashoutLoading(false); }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-100">
          <h2 className="text-xl font-black text-slate-900 mb-3">
            {dashboardError
              ? t("Không thể tải dữ liệu giới thiệu", "Could not load referral data")
              : t("Đang khởi tạo dữ liệu", "Preparing referral data")}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {dashboardError
              ? t("Vui lòng thử tải lại hoặc đăng nhập lại.", "Please retry or sign in again.")
              : t("Vui lòng chờ trong giây lát.", "Please wait a moment.")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchDashboard()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
            >
              {t("Thử lại", "Retry")}
            </button>
            <Link
              href="/login?callbackUrl=/profile/referrals"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              {t("Đăng nhập lại", "Sign in again")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shareCode = dashboard.profile.customCode || dashboard.profile.systemCode;
  const stats = dashboard.stats;

  const statusLabel: Record<string, { vi: string; en: string; color: string }> = {
    SIGNED_UP: { vi: "Đã đăng ký", en: "Signed up", color: "bg-blue-100 text-blue-700" },
    LOCKED: { vi: "Đã khóa", en: "Locked", color: "bg-slate-100 text-slate-600" },
    QUALIFIED: { vi: "Hợp lệ", en: "Qualified", color: "bg-emerald-100 text-emerald-700" },
    REJECTED: { vi: "Từ chối", en: "Rejected", color: "bg-red-100 text-red-700" },
    FRAUD_REVIEW: { vi: "Đang xem xét", en: "Under review", color: "bg-amber-100 text-amber-700" },
    PENDING: { vi: "Chờ duyệt", en: "Pending", color: "bg-amber-100 text-amber-700" },
    AVAILABLE: { vi: "Sẵn sàng", en: "Available", color: "bg-emerald-100 text-emerald-700" },
    PAID: { vi: "Đã trả", en: "Paid", color: "bg-green-100 text-green-700" },
    VOID: { vi: "Đã hủy", en: "Voided", color: "bg-red-100 text-red-700" },
    CONVERTED: { vi: "Đã đổi", en: "Converted", color: "bg-violet-100 text-violet-700" },
  };

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t("Tổng quan", "Overview"), icon: <TrendingUp className="w-4 h-4" /> },
    { id: "milestones", label: t("Mốc thưởng", "Milestones"), icon: <Award className="w-4 h-4" /> },
    { id: "history", label: t("Lịch sử", "History"), icon: <Users className="w-4 h-4" /> },
    { id: "commissions", label: t("Hoa hồng", "Commissions"), icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pb-16">
      {/* ═══ VIP Hero Banner ═══ */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 25%, #0891b2 50%, #0e7490 75%, #065f46 100%)" }}>
        {/* Animated mesh overlay */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(52,211,153,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(6,182,212,0.3) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 50%, rgba(16,185,129,0.2) 0%, transparent 80%)" }} />
        {/* Floating orbs */}
        <motion.div className="absolute top-8 right-[20%] w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)" }} animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-4 left-[10%] w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }} animate={{ y: [0, 12, 0], scale: [1, 0.95, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(167,243,208,0.25) 0%, transparent 70%)" }} animate={{ x: [0, 20, 0], y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative w-full px-4 sm:px-6 lg:px-[8%] py-10 md:py-14">
          <Link href="/profile" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-bold mb-6 transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("Hồ sơ", "Profile")}
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left side - Title */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{t("Chương trình giới thiệu", "Referral Program")}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {t("Giới Thiệu Bạn Bè", "Refer & Earn")}
                <span className="block text-emerald-200/80 text-2xl md:text-3xl mt-1 font-extrabold">{t("Nhận Thưởng Không Giới Hạn", "Unlimited Rewards")}</span>
              </h1>
              <p className="text-white/60 mt-4 max-w-lg text-sm leading-relaxed">
                {t(
                  "Mời bạn bè mua sắm tại LIKEFOOD — bạn nhận hoa hồng, bạn bè nhận ưu đãi chào mừng!",
                  "Invite friends to shop at LIKEFOOD — earn commissions while they get welcome rewards!"
                )}
              </p>
            </motion.div>

            {/* Right side - Share Code Card (Glassmorphism) */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="relative min-w-[300px] max-w-[360px]">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-teal-400/30 rounded-3xl blur-xl" />
              <div className="relative bg-white/[0.12] backdrop-blur-xl border border-white/25 rounded-3xl p-6 shadow-2xl">
                <p className="text-emerald-200/80 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                  {t("Mã giới thiệu của bạn", "Your Referral Code")}
                </p>
                <div className="flex items-center gap-2">
                  {editingCode ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="text" value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10))}
                        className="bg-white/15 text-white border border-white/30 rounded-xl px-3 py-2.5 w-full outline-none font-black text-lg tracking-[0.15em] uppercase placeholder:text-white/30 focus:border-emerald-300/50 transition-colors"
                        placeholder="CODE" />
                      <button onClick={handleSaveCode} disabled={savingCode || customCode.length < 4}
                        className="p-2.5 bg-white text-emerald-700 rounded-xl font-bold disabled:opacity-50 hover:scale-105 transition-transform">
                        {savingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingCode(false); setCustomCode(dashboard.profile.customCode || ""); }}
                        className="text-white/50 hover:text-white text-sm font-bold transition-colors">✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white tracking-[0.15em] flex-1 drop-shadow-lg">{shareCode}</span>
                      <button onClick={() => handleCopy("code")}
                        className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-all text-white hover:scale-110 active:scale-95">
                        {copied === "code" ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingCode(true)}
                        className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-all text-white hover:scale-110 active:scale-95"
                        title={t("Đổi mã giới thiệu", "Change referral code")}>
                        <RefreshCw className="w-4 h-4" />
                        <span className="sr-only">{t("Đổi", "Edit")}</span>
                      </button>
                    </>
                  )}
                </div>
                {/* Copy link button */}
                <button onClick={() => handleCopy("link")}
                  className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 hover:border-white/25">
                  {copied === "link" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  {t("Sao chép link giới thiệu", "Copy Referral Link")}
                </button>
                {/* Share buttons */}
                <div className="flex items-center gap-2 mt-4">
                  {[
                    { id: "facebook", icon: <Share2 className="w-4 h-4" />, bg: "from-blue-500 to-blue-600" },
                    { id: "whatsapp", icon: <MessageCircle className="w-4 h-4" />, bg: "from-green-500 to-green-600" },
                    { id: "sms", icon: <Smartphone className="w-4 h-4" />, bg: "from-violet-500 to-purple-600" },
                    { id: "email", icon: <Mail className="w-4 h-4" />, bg: "from-orange-500 to-red-500" },
                  ].map((s) => (
                    <button key={s.id} onClick={() => handleShare(s.id)}
                      className={`flex-1 p-3 rounded-xl text-white transition-all bg-gradient-to-br ${s.bg} hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}>
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══ VIP Stats Row ═══ */}
      <div className="w-full px-4 sm:px-6 lg:px-[8%] -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t("Đã mời", "Invited"), value: stats.totalInvites, icon: <Users className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50", ring: "ring-blue-100" },
            { label: t("Hợp lệ", "Qualified"), value: stats.qualifiedInvites, icon: <CheckCircle2 className="w-5 h-5" />, gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
            { label: t("Chờ duyệt", "Pending"), value: `$${stats.pendingBalance.toFixed(2)}`, icon: <Clock className="w-5 h-5" />, gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50", ring: "ring-amber-100" },
            { label: t("Khả dụng", "Available"), value: `$${stats.availableBalance.toFixed(2)}`, icon: <Wallet className="w-5 h-5" />, gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
            { label: t("Đã rút", "Withdrawn"), value: `$${stats.withdrawnBalance.toFixed(2)}`, icon: <DollarSign className="w-5 h-5" />, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50", ring: "ring-violet-100" },
            { label: t("Đã đổi", "Converted"), value: `$${stats.convertedBalance.toFixed(2)}`, icon: <Gift className="w-5 h-5" />, gradient: "from-pink-500 to-rose-600", bg: "bg-pink-50", ring: "ring-pink-100" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className={`bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/60 text-center border border-slate-100/80 ring-1 ${s.ring} cursor-default transition-shadow hover:shadow-xl`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-2.5 text-white shadow-md`}>{s.icon}</div>
              <p className="text-xl font-black text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ Tabs + Content ═══ */}
      <div className="w-full px-4 sm:px-6 lg:px-[8%] mt-8">
        {/* Premium Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 bg-slate-100/70 rounded-2xl p-1.5 backdrop-blur-sm">
          {tabConfig.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white text-emerald-700 shadow-md shadow-emerald-100/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
          {dashboard.cashoutEligible && (
            <button onClick={() => setShowCashoutModal(true)}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap">
              <DollarSign className="w-4 h-4" /> {t("Rút tiền", "Cash Out")}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-6">
              {/* Next Milestone Preview */}
              {dashboard.nextMilestone && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40 rounded-3xl p-6 shadow-lg shadow-amber-100/30 border border-amber-100/60">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-bl-full" />
                  <h3 className="relative text-sm font-black uppercase tracking-wider text-amber-700/80 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                      <Star className="w-4 h-4" />
                    </div>
                    {t("Mốc tiếp theo", "Next Milestone")}
                  </h3>
                  <div className="relative flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-white shadow-xl shadow-orange-200/50">
                      <Award className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg text-slate-900">{dashboard.nextMilestone.milestone} {t("người bạn", "friends")}</p>
                      <p className="text-sm text-slate-500 font-medium">{dashboard.nextMilestone.rewardType} — <span className="text-emerald-600 font-bold">${dashboard.nextMilestone.rewardValue}</span></p>
                      <p className="text-xs text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {t("Còn", "Need")} {dashboard.nextMilestone.remaining} {t("người nữa", "more")}
                      </p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-slate-400 font-bold mb-1.5">{Math.round(((dashboard.nextMilestone.milestone - dashboard.nextMilestone.remaining) / dashboard.nextMilestone.milestone) * 100)}%</p>
                      <div className="w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((dashboard.nextMilestone.milestone - dashboard.nextMilestone.remaining) / dashboard.nextMilestone.milestone) * 100)}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* How it works - Premium */}
              <div className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/40 border border-slate-100/60">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  {t("Cách thức hoạt động", "How It Works")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  {/* Connecting line (desktop) */}
                  <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200" />
                  {[
                    { step: "01", title: t("Chia sẻ mã", "Share Code"), desc: t("Gửi mã/link cho bạn bè", "Send your code/link to friends"), icon: <Share2 className="w-6 h-6" />, gradient: "from-emerald-500 to-teal-600" },
                    { step: "02", title: t("Bạn bè mua hàng", "Friends Shop"), desc: t("Bạn bè đăng ký và đặt hàng", "Friends sign up and place orders"), icon: <Users className="w-6 h-6" />, gradient: "from-teal-500 to-cyan-600" },
                    { step: "03", title: t("Nhận thưởng", "Get Rewards"), desc: t(`Nhận ${(dashboard.config.commissionRate * 100).toFixed(0)}% hoa hồng mỗi đơn`, `Earn ${(dashboard.config.commissionRate * 100).toFixed(0)}% commission per order`), icon: <Gift className="w-6 h-6" />, gradient: "from-cyan-500 to-blue-600" },
                  ].map((s, i) => (
                    <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.15 }}
                      className="relative text-center p-5 rounded-2xl hover:bg-slate-50/80 transition-colors group">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}>{s.icon}</div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black tracking-wider mb-2">{t("Bước", "Step")} {s.step}</span>
                      <p className="font-black text-slate-800 text-base">{s.title}</p>
                      <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{s.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Milestones Tab */}
          {activeTab === "milestones" && (
            <motion.div key="milestones" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/40 border border-slate-100/60">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-8 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <Award className="w-4 h-4" />
                </div>
                {t("Mốc thưởng", "Reward Milestones")}
              </h3>
              {milestones.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">{t("Chưa có mốc thưởng", "No milestones configured")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((ms, i) => (
                    <motion.div key={ms.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all hover:shadow-md ${ms.achieved ? "bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200/60" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${ms.achieved ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" : "bg-white text-slate-300 border border-slate-200"}`}>
                        {ms.achieved ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900">{ms.milestone} {t("người bạn", "friends")}</p>
                        <p className="text-sm text-slate-500 font-medium">{language === "vi" ? ms.label : ms.labelEn || ms.label} — <span className="text-emerald-600 font-bold">{ms.rewardType} ${ms.rewardValue}</span></p>
                      </div>
                      {ms.achieved ? (
                        <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black rounded-full shadow-md shrink-0">{t("Đã nhận", "Claimed")}</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full shrink-0">{t("Còn", "Need")} {ms.remaining}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 overflow-hidden border border-slate-100/60">
              <div className="p-8 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Users className="w-4 h-4" />
                  </div>
                  {t("Bạn bè đã mời", "Invited Friends")}
                </h3>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">{t("Chưa có ai được mời", "No invites yet")}</p>
                  <p className="text-slate-300 text-sm mt-1">{t("Hãy chia sẻ mã giới thiệu của bạn!", "Share your referral code to get started!")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 rounded-xl">
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 first:rounded-l-xl">{t("Người dùng", "User")}</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">{t("Trạng thái", "Status")}</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 last:rounded-r-xl">{t("Ngày", "Date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.map((h) => {
                        const st = statusLabel[h.status] || { vi: h.status, en: h.status, color: "bg-slate-100 text-slate-600" };
                        return (
                          <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-800">{h.referredName || h.referredEmail}</td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.color}`}>
                                {language === "vi" ? st.vi : st.en}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-400 font-medium">{new Date(h.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Commissions Tab */}
          {activeTab === "commissions" && (
            <motion.div key="commissions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 overflow-hidden border border-slate-100/60">
              <div className="p-8 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  {t("Hoa hồng", "Commissions")}
                </h3>
              </div>
              {commissions.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">{t("Chưa có hoa hồng", "No commissions yet")}</p>
                  <p className="text-slate-300 text-sm mt-1">{t("Hoa hồng sẽ xuất hiện khi bạn bè đặt hàng", "Commissions appear when friends place orders")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 first:rounded-l-xl">{t("Đơn hàng", "Order")}</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">{t("Tỷ lệ", "Rate")}</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">{t("Hoa hồng", "Amount")}</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">{t("Trạng thái", "Status")}</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400 last:rounded-r-xl">{t("Ngày", "Date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {commissions.map((c) => {
                        const st = statusLabel[c.status] || { vi: c.status, en: c.status, color: "bg-slate-100" };
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-800">#{String(c.orderId).slice(-6)}</td>
                            <td className="px-5 py-4 text-slate-600 font-medium">{(c.rate * 100).toFixed(0)}%</td>
                            <td className="px-5 py-4 font-black text-emerald-600">${c.commissionAmount.toFixed(2)}</td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.color}`}>
                                {language === "vi" ? st.vi : st.en}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-400 font-medium">{new Date(c.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Premium Cashout Modal ═══ */}
      <AnimatePresence>
        {showCashoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/50">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black uppercase text-center text-slate-800 mb-2">
                {t("Rút tiền thưởng", "Cash Out Rewards")}
              </h3>
              <p className="text-slate-500 text-sm text-center mb-6">
                {t(`Số dư khả dụng: $${stats.availableBalance.toFixed(2)}`, `Available: $${stats.availableBalance.toFixed(2)}`)}
              </p>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 block">
                    {t("Số tiền ($)", "Amount ($)")}
                  </label>
                  <input type="number" value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    className="w-full bg-slate-50 ring-1 ring-slate-200/60 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-emerald-300 font-bold text-lg transition-all"
                    placeholder={`${t("Tối thiểu", "Min")} $${dashboard.config.minimumCashoutAmount}`}
                    min={dashboard.config.minimumCashoutAmount}
                    max={stats.availableBalance}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 block">
                    {t("Phương thức", "Method")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dashboard.config.enabledCashoutMethods.map((m) => (
                      <button key={m} onClick={() => setCashoutMethod(m)}
                        className={`px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                          cashoutMethod === m
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100/50"
                            : "border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                        }`}>
                        {m.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                {(cashoutMethod === "PAYPAL" || cashoutMethod === "VENMO") && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 block">
                      {cashoutMethod === "PAYPAL" ? "Email PayPal" : "Venmo Handle"}
                    </label>
                    <input type={cashoutMethod === "PAYPAL" ? "email" : "text"} value={cashoutDest}
                      onChange={(e) => setCashoutDest(e.target.value)}
                      className="w-full bg-slate-50 ring-1 ring-slate-200/60 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-emerald-300 font-medium transition-all"
                      placeholder={cashoutMethod === "PAYPAL" ? "you@email.com" : "@username"}
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6 pt-2">
                  <button onClick={handleCashout}
                    disabled={cashoutLoading || !cashoutAmount || !cashoutMethod || parseFloat(cashoutAmount) < dashboard.config.minimumCashoutAmount}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-40 disabled:hover:shadow-none">
                    {cashoutLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("Xác nhận", "Confirm")}
                  </button>
                  <button onClick={() => setShowCashoutModal(false)}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
                    {t("Hủy", "Cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
