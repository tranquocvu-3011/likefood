"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bell,
  CreditCard,
  Globe,
  LayoutDashboard,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminCard, AdminPageContainer } from "@/components/admin/AdminPageContainer";

const ALLOWED_SETTINGS = [
  "site_name",
  "site_description",
  "site_logo",
  "site_favicon",
  "contact_email",
  "contact_phone",
  "contact_address",
  "shipping_fee",
  "free_shipping_threshold",
  "tax_rate",
  "maintenance_mode",
  "maintenance_message",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "youtube_url",
  "points_per_order",
  "points_redemption_rate",
  "checkin_points",
  "referral_points",
  "meta_title",
  "meta_description",
  "meta_keywords",
  "announcement_bar",
  "announcement_text",
  // Payment settings — Stripe only
  "payment_stripe_enabled",
  "stripe_secret_key", "stripe_webhook_secret", "stripe_publishable_key",
  // Security
  "security_captcha_enabled",
  "turnstile_site_key",
  "turnstile_secret_key",
  // ===== CONNECTIONS / INTEGRATIONS =====
  // Database (Docker)
  "db_host", "db_port", "db_name", "db_user", "db_password",
  // Redis
  "redis_url", "redis_password",
  // Rate Limiting (Upstash)
  "upstash_redis_rest_url", "upstash_redis_rest_token",
  // AI / OpenAI
  "openai_api_key",
  // Telegram
  "telegram_bot_token", "telegram_chat_id",
  // Stripe
  "stripe_secret_key", "stripe_webhook_secret", "stripe_publishable_key",
  // Sentry
  "sentry_org", "sentry_project", "sentry_auth_token", "sentry_dsn",
  // Cloudflare
  "cloudflare_api_token", "cloudflare_zone_id",
  // Google OAuth
  "google_client_id", "google_client_secret",
  // AWS S3
  "aws_s3_bucket", "aws_access_key_id", "aws_secret_access_key", "aws_region",
  // Analytics
  "ga_tracking_id", "fb_pixel_id", "gtm_id",
  // Health check
  "health_secret",
] as const;

type SettingKey = (typeof ALLOWED_SETTINGS)[number];
type TabKey = "store" | "commerce" | "channels" | "operations" | "profile" | "payment" | "security" | "connections";
type SettingsState = Partial<Record<SettingKey, string>>;

type ProfileState = {
  id: number;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
};

type BroadcastState = {
  title: string;
  message: string;
  link: string;
  channelInApp: boolean;
  channelEmail: boolean;
};

const DEFAULT_PROFILE: ProfileState = {
  id: Number(""),
  email: "",
  name: "",
  phone: "",
  createdAt: "",
};

const DEFAULT_BROADCAST: BroadcastState = {
  title: "",
  message: "",
  link: "",
  channelInApp: true,
  channelEmail: false,
};

const TABS: Array<{ id: TabKey; label: string; icon: typeof Store; description: string }> = [
  { id: "store", label: "Cửa hàng", icon: Store, description: "Thương hiệu & tìm kiếm" },
  { id: "commerce", label: "Thương mại", icon: Truck, description: "Vận chuyển & tích điểm" },
  { id: "channels", label: "Kênh liên lạc", icon: Link2, description: "Liên hệ & tích hợp" },
  { id: "payment", label: "Thanh toán", icon: CreditCard, description: "Phương thức & mã QR" },
  { id: "operations", label: "Vận hành", icon: Settings2, description: "Thông báo & bảo trì" },
  { id: "security", label: "Bảo mật", icon: ShieldCheck, description: "CAPTCHA & lớp phòng vệ" },
  { id: "connections", label: "Kết nối", icon: Database, description: "API keys & dịch vụ bên thứ 3" },
  { id: "profile", label: "Hồ sơ", icon: UserRound, description: "Cài đặt tài khoản admin" },
];

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("store");
  const [settings, setSettings] = useState<SettingsState>({});
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [broadcast, setBroadcast] = useState<BroadcastState>(DEFAULT_BROADCAST);
  const [isFetching, setIsFetching] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const isSuperAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const load = async () => {
      setIsFetching(true);
      try {
        const [settingsResponse, profileResponse] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/user/profile"),
        ]);

        if (settingsResponse.ok) {
          const data = await settingsResponse.json().catch(() => ({}));
          setSettings(pickAllowedSettings(data));
        }

        if (profileResponse.ok) {
          const data = await profileResponse.json().catch(() => null);
          if (data) {
            setProfile({
              id: data.id || "",
              email: data.email || "",
              name: data.name || "",
              phone: data.phone || "",
              createdAt: data.createdAt || "",
            });
          }
        }
      } catch {
        toast.error("Không thể tải cài đặt hệ thống.");
      } finally {
        setIsFetching(false);
      }
    };

    void load();
  }, []);

  const summary = useMemo(
    () => ({
      maintenance: (settings.maintenance_mode || "OFF") === "ON" ? "Bật" : "Tắt",
      shipping: settings.free_shipping_threshold || "500",
      support: settings.contact_email || "Chưa cấu hình",
      announcement: (settings.announcement_bar || "OFF") === "ON" ? "Đang hiển thị" : "Ẩn",
    }),
    [settings]
  );

  const updateSetting = (key: SettingKey, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickAllowedSettings(settings)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to save settings.");
      }
      toast.success("Đã lưu cài đặt hệ thống.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Không thể cập nhật hồ sơ quản trị.");
      }
      setProfile((prev) => ({
        ...prev,
        name: data.name || "",
        phone: data.phone || "",
      }));
      toast.success("Đã cập nhật hồ sơ quản trị.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const sendBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcast.title,
          message: broadcast.message,
          link: broadcast.link || undefined,
          channelInApp: broadcast.channelInApp,
          channelEmail: broadcast.channelEmail,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Không thể gửi thông báo.");
      }
      setBroadcast(DEFAULT_BROADCAST);
      toast.success("Đã gửi thông báo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi thông báo.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <AdminPageContainer
      title="Kiểm soát hệ thống"
      subtitle="Cấu hình cài đặt thương hiệu, thương mại, kênh liên lạc và vận hành từ một nơi duy nhất."
      action={
        <>
          <Link href="/admin/ai">
            <Button variant="outline" size="lg">
              <Sparkles className="h-4 w-4" />
              Mở phòng lab AI
            </Button>
          </Link>
          <Button size="lg" onClick={() => void saveSettings()} disabled={isSavingSettings}>
            {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu cài đặt
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <AdminCard className="p-5">
          <Stat label="Chế độ bảo trì" value={summary.maintenance} tone="text-zinc-100" />
        </AdminCard>
        <AdminCard className="p-5">
          <Stat label="Miễn phí vận chuyển từ" value={`$${summary.shipping}`} tone="text-emerald-600" />
        </AdminCard>
        <AdminCard className="p-5">
          <Stat label="Hộp thư hỗ trợ" value={summary.support} tone="text-sky-600" compact />
        </AdminCard>
        <AdminCard className="p-5">
          <Stat label="Thanh thông báo" value={summary.announcement} tone="text-violet-600" />
        </AdminCard>
      </div>

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AdminCard className="p-4">
          <div className="space-y-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                    active
                      ? "border-teal-600 bg-teal-600/10 text-teal-400"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-teal-600/20" : "bg-zinc-800"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase">{tab.label}</p>
                      <p className={`mt-0.5 text-xs ${active ? "text-teal-400/70" : "text-zinc-500"}`}>{tab.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </AdminCard>

        <div className="space-y-8">
          {activeTab === "store" ? (
            <div className="grid gap-8">
              <AdminCard>
                <SectionHeader icon={Globe} eyebrow="Thông tin cửa hàng" title="Cài đặt thương hiệu & tìm kiếm" description="Kiểm soát thông tin thương hiệu hiển thị trên toàn bộ trang web." />
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Field label="Tên cửa hàng">
                    <input value={settings.site_name || ""} onChange={(event) => updateSetting("site_name", event.target.value)} className="admin-input" placeholder="LIKEFOOD" />
                  </Field>
                  <Field label="Mô tả cửa hàng">
                    <input value={settings.site_description || ""} onChange={(event) => updateSetting("site_description", event.target.value)} className="admin-input" placeholder="Vietnamese specialty marketplace in the US" />
                  </Field>
                  <Field label="Tiêu đề SEO">
                    <input value={settings.meta_title || ""} onChange={(event) => updateSetting("meta_title", event.target.value)} className="admin-input" placeholder="LIKEFOOD | Premium Vietnamese specialties" />
                  </Field>
                  <Field label="Từ khóa SEO">
                    <input value={settings.meta_keywords || ""} onChange={(event) => updateSetting("meta_keywords", event.target.value)} className="admin-input" placeholder="dried seafood, spice, tea, gifts" />
                  </Field>
                  <Field label="Email hỗ trợ">
                    <input value={settings.contact_email || ""} onChange={(event) => updateSetting("contact_email", event.target.value)} className="admin-input" placeholder="support@example.com" />
                  </Field>
                  <Field label="Số điện thoại hỗ trợ">
                    <input value={settings.contact_phone || ""} onChange={(event) => updateSetting("contact_phone", event.target.value)} className="admin-input" placeholder="+1 555 000 1234" />
                  </Field>
                  <Field label="Mô tả SEO" className="md:col-span-2">
                    <textarea value={settings.meta_description || ""} onChange={(event) => updateSetting("meta_description", event.target.value)} className="admin-textarea" rows={4} placeholder="Short description used by search engines and social previews." />
                  </Field>
                  <Field label="Địa chỉ liên hệ" className="md:col-span-2">
                    <textarea value={settings.contact_address || ""} onChange={(event) => updateSetting("contact_address", event.target.value)} className="admin-textarea" rows={4} placeholder="Omaha, NE 68136, United States" />
                  </Field>
                </div>
              </AdminCard>
            </div>
          ) : null}

          {activeTab === "commerce" ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <AdminCard>
                <SectionHeader icon={Truck} eyebrow="Vận chuyển mặc định" title="Ngưỡng thương mại" description="Thiết lập phí vận chuyển và các ngưỡng áp dụng cho toàn bộ đơn hàng." />
                <div className="mt-6 grid gap-5">
                  <Field label="Phí vận chuyển tiêu chuẩn (USD)">
                    <input value={settings.shipping_fee || "5.99"} onChange={(event) => updateSetting("shipping_fee", event.target.value)} className="admin-input" placeholder="5.99" />
                  </Field>
                  <Field label="Ngưỡng miễn phí vận chuyển (USD)">
                    <input value={settings.free_shipping_threshold || "500"} onChange={(event) => updateSetting("free_shipping_threshold", event.target.value)} className="admin-input" placeholder="500" />
                  </Field>
                  <Field label="Thuế suất (%)">
                    <input value={settings.tax_rate || "0"} onChange={(event) => updateSetting("tax_rate", event.target.value)} className="admin-input" placeholder="0" />
                  </Field>
                </div>
              </AdminCard>

              <AdminCard>
                <SectionHeader icon={ShieldCheck} eyebrow="Chương trình tích điểm" title="Điểm & phần thưởng" description="Điều chỉnh ưu đãi nhằm khuyến khích khách hàng mua lại." />
                <div className="mt-6 grid gap-5">
                  <Field label="Điểm mỗi đơn hàng">
                    <input value={settings.points_per_order || "0"} onChange={(event) => updateSetting("points_per_order", event.target.value)} className="admin-input" placeholder="10" />
                  </Field>
                  <Field label="Tỷ lệ đổi điểm">
                    <input value={settings.points_redemption_rate || "0"} onChange={(event) => updateSetting("points_redemption_rate", event.target.value)} className="admin-input" placeholder="0.01" />
                  </Field>
                  <Field label="Điểm check-in hàng ngày">
                    <input value={settings.checkin_points || "0"} onChange={(event) => updateSetting("checkin_points", event.target.value)} className="admin-input" placeholder="1" />
                  </Field>
                  <Field label="Điểm giới thiệu">
                    <input value={settings.referral_points || "0"} onChange={(event) => updateSetting("referral_points", event.target.value)} className="admin-input" placeholder="20" />
                  </Field>
                </div>
              </AdminCard>
            </div>
          ) : null}

          {activeTab === "channels" ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <AdminCard>
                <SectionHeader icon={Link2} eyebrow="Mạng xã hội" title="Kênh khách hàng" description="Cập nhật các kênh hỗ trợ và thương hiệu mà không cần chỉnh sửa code." />
                <div className="mt-6 grid gap-5">
                  <Field label="Facebook URL">
                    <input value={settings.facebook_url || ""} onChange={(event) => updateSetting("facebook_url", event.target.value)} className="admin-input" placeholder="https://facebook.com/likefood" />
                  </Field>
                  <Field label="Instagram URL">
                    <input value={settings.instagram_url || ""} onChange={(event) => updateSetting("instagram_url", event.target.value)} className="admin-input" placeholder="https://instagram.com/likefood" />
                  </Field>
                  <Field label="TikTok URL">
                    <input value={settings.tiktok_url || ""} onChange={(event) => updateSetting("tiktok_url", event.target.value)} className="admin-input" placeholder="https://tiktok.com/@likefood" />
                  </Field>
                  <Field label="YouTube URL">
                    <input value={settings.youtube_url || ""} onChange={(event) => updateSetting("youtube_url", event.target.value)} className="admin-input" placeholder="https://youtube.com/@likefood" />
                  </Field>
                </div>
              </AdminCard>

              <AdminCard>
                <SectionHeader icon={Mail} eyebrow="Gửi email" title="Cấu hình SMTP" description="Thiết lập địa chỉ gửi email cho các quy trình thông báo." />
                <div className="mt-6 grid gap-5">
                  <Field label="Máy chủ SMTP">
                    <input type="text" value={settings.smtp_host || ""} onChange={(event) => updateSetting("smtp_host", event.target.value)} className="admin-input" placeholder="smtp.example.com" />
                  </Field>
                  <Field label="Cổng SMTP">
                    <input type="number" value={settings.smtp_port || "587"} onChange={(event) => updateSetting("smtp_port", event.target.value)} className="admin-input" placeholder="587" />
                  </Field>
                  <Field label="Tài khoản SMTP">
                    <input type="email" value={settings.smtp_user || ""} onChange={(event) => updateSetting("smtp_user", event.target.value)} className="admin-input" placeholder="noreply@example.com" />
                  </Field>
                  <Field label="Mật khẩu SMTP">
                    <input type="password" value={settings.smtp_pass || ""} onChange={(event) => updateSetting("smtp_pass", event.target.value)} className="admin-input" placeholder="••••••••" />
                  </Field>
                  <Field label="Email gửi từ (From)">
                    <input type="email" value={settings.smtp_from || ""} onChange={(event) => updateSetting("smtp_from", event.target.value)} className="admin-input" placeholder="noreply@likefood.com" />
                  </Field>
                </div>
              </AdminCard>

              <AdminCard>
                <SectionHeader icon={MessageCircle} eyebrow="Telegram Bot" title="Thông báo Telegram" description="Nhận thông báo đơn hàng và cảnh báo cửa hàng qua Telegram bot." />
                <div className="mt-6 space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <p className="text-sm text-amber-400 font-medium">
                      📌 Để kích hoạt Telegram Bot, thêm các biến môi trường sau vào file .env:
                    </p>
                    <ul className="mt-2 text-xs text-amber-500 space-y-1">
                      <li>• TELEGRAM_BOT_TOKEN: Token từ @BotFather</li>
                      <li>• TELEGRAM_CHAT_ID: Chat ID của bạn (dùng @userinfobot để lấy)</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/admin/telegram", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "test" }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(data.message);
                        } else {
                          toast.error(data.message);
                        }
                      } catch {
                        toast.error("Không thể kết nối Telegram.");
                      }
                    }}
                    className="w-full"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Kiểm tra kết nối Telegram
                  </Button>
                </div>
              </AdminCard>
            </div>
          ) : null}

          {activeTab === "payment" ? (
            <div className="grid gap-8">
              <AdminCard>
                <SectionHeader icon={CreditCard} eyebrow="Stripe" title="Thanh toán qua Stripe" description="Website sử dụng Stripe làm cổng thanh toán duy nhất." />
                <div className="mt-6 rounded-lg border border-zinc-700/50 bg-zinc-900 p-5">
                  <p className="text-sm text-zinc-400">
                    🔑 Cấu hình API keys Stripe tại tab <button type="button" onClick={() => setActiveTab("connections")} className="text-teal-400 font-semibold hover:underline">Kết nối</button> → mục &quot;Cổng thanh toán Stripe&quot;.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Stripe Endpoint: <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">/api/webhooks/stripe</code>
                  </p>
                </div>
              </AdminCard>
            </div>
          ) : null}

          {activeTab === "operations" ? (
            <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <AdminCard>
                <SectionHeader icon={Megaphone} eyebrow="Thông báo cửa hàng" title="Thông báo & bảo trì" description="Cập nhật thông báo vận hành mà không cần sửa template hay route handler." />
                <div className="mt-6 grid gap-5">
                  <ToggleField
                    label="Thanh thông báo"
                    value={settings.announcement_bar || "OFF"}
                    onChange={(value) => updateSetting("announcement_bar", value)}
                  />
                  <Field label="Nội dung thông báo">
                    <textarea value={settings.announcement_text || ""} onChange={(event) => updateSetting("announcement_text", event.target.value)} className="admin-textarea" rows={4} placeholder="Example: Free standard shipping on orders over $500." />
                  </Field>
                  <ToggleField
                    label="Chế độ bảo trì"
                    value={settings.maintenance_mode || "OFF"}
                    onChange={(value) => updateSetting("maintenance_mode", value)}
                  />
                  <Field label="Nội dung bảo trì">
                    <textarea value={settings.maintenance_message || ""} onChange={(event) => updateSetting("maintenance_message", event.target.value)} className="admin-textarea" rows={4} placeholder="Message shown when the storefront is temporarily paused." />
                  </Field>
                </div>
              </AdminCard>

              <AdminCard>
                <SectionHeader icon={Bell} eyebrow="Phát sóng quản trị" title="Gửi thông báo toàn cửa hàng" description="Quản trị cấp cao có thể thông báo cho khách hàng trong app và xếp hàng gửi email." />
                {isSuperAdmin ? (
                  <div className="mt-6 grid gap-5">
                    <Field label="Tiêu đề thông báo">
                      <input value={broadcast.title} onChange={(event) => setBroadcast((prev) => ({ ...prev, title: event.target.value }))} className="admin-input" placeholder="Weekend shipping update" />
                    </Field>
                    <Field label="Nội dung">
                      <textarea value={broadcast.message} onChange={(event) => setBroadcast((prev) => ({ ...prev, message: event.target.value }))} className="admin-textarea" rows={5} placeholder="Tell customers exactly what changed and what they should expect next." />
                    </Field>
                    <Field label="Liên kết (tùy chọn)">
                      <input value={broadcast.link} onChange={(event) => setBroadcast((prev) => ({ ...prev, link: event.target.value }))} className="admin-input" placeholder="https://example.com/help/shipping" />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <CheckCard title="Thông báo trong app" description="Tạo thông báo cho tất cả người dùng." checked={broadcast.channelInApp} onClick={() => setBroadcast((prev) => ({ ...prev, channelInApp: !prev.channelInApp }))} />
                      <CheckCard title="Hàng chờ email" description="Đánh dấu yêu cầu gửi email hàng loạt cho nhà cung cấp đã cấu hình." checked={broadcast.channelEmail} onClick={() => setBroadcast((prev) => ({ ...prev, channelEmail: !prev.channelEmail }))} />
                    </div>
                    <Button
                      size="lg"
                      onClick={() => void sendBroadcast()}
                      disabled={isBroadcasting || !broadcast.title.trim() || !broadcast.message.trim() || (!broadcast.channelInApp && !broadcast.channelEmail)}
                    >
                      {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                      Gửi thông báo
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-6 text-sm text-zinc-500">
                    Chức năng này chỉ dành cho quản trị viên cấp cao.
                  </div>
                )}
              </AdminCard>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <div className="grid gap-8">
              <AdminCard>
                <SectionHeader
                  icon={ShieldCheck}
                  eyebrow="Phòng vệ hệ thống"
                  title="CAPTCHA & chống lạm dụng"
                  description="Bật/tắt CAPTCHA Cloudflare Turnstile cho các form public (đăng ký, đăng nhập, quên mật khẩu, liên hệ, magic link). Có thể cấu hình key ngay tại đây hoặc dùng biến môi trường."
                />
                <div className="mt-6 grid gap-5">
                  <ToggleField
                    label="CAPTCHA (Cloudflare Turnstile)"
                    value={settings.security_captcha_enabled || "ON"}
                    onChange={(value) => updateSetting("security_captcha_enabled", value)}
                  />
                  <Field label="Turnstile Site Key (hiển thị phía client)">
                    <input
                      type="text"
                      value={settings.turnstile_site_key ?? ""}
                      onChange={(e) => updateSetting("turnstile_site_key", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="0x4AAAAAAA..."
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Lấy tại Cloudflare Dashboard → Turnstile. Ưu tiên giá trị ở đây, không cần set NEXT_PUBLIC_TURNSTILE_SITE_KEY nếu đã nhập.</p>
                  </Field>
                  <Field label="Turnstile Secret Key (chỉ dùng phía server)">
                    <input
                      type="password"
                      value={settings.turnstile_secret_key ?? ""}
                      onChange={(e) => updateSetting("turnstile_secret_key", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="0x4AAAAAAA..."
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Bảo mật, không gửi ra trình duyệt. Có thể dùng TURNSTILE_SECRET_KEY trong .env thay thế.</p>
                  </Field>
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-900 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Ghi chú triển khai</p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                      <li>
                        - Ưu tiên key lưu tại đây; nếu để trống, hệ thống dùng biến môi trường <code className="bg-zinc-800 px-1 rounded">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> / <code className="bg-zinc-800 px-1 rounded">TURNSTILE_SECRET_KEY</code>.
                      </li>
                      <li>- Nếu bật CAPTCHA nhưng thiếu cả key tại đây và trong env, hệ thống sẽ log cảnh báo và không chặn người dùng (fail-safe).</li>
                      <li>- Lấy key miễn phí tại: https://dash.cloudflare.com/?to=/:account/turnstile</li>
                    </ul>
                  </div>
                </div>
              </AdminCard>
            </div>
          ) : null}

          {activeTab === "connections" ? (
            <div className="grid gap-6">
              {/* AI & OpenAI */}
              <AdminCard>
                <SectionHeader
                  icon={Sparkles}
                  eyebrow="AI Integration"
                  title="OpenAI GPT (ChatGPT)"
                  description="Cấu hình API key OpenAI để cung cấp AI chatbot, tạo mô tả sản phẩm, phân tích đánh giá và các tính năng thông minh. Hệ thống sử dụng gpt-4o-mini (nhanh) và gpt-4o (chất lượng cao) tùy theo tác vụ."
                />
                <div className="mt-6 grid gap-4">
                  <Field label="OpenAI API Key">
                    <input
                      type="password"
                      value={(settings as Record<string, string>).openai_api_key ?? ""}
                      onChange={(e) => updateSetting("openai_api_key" as SettingKey, e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="sk-proj-..."
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Lấy tại: https://platform.openai.com/api-keys — Model: gpt-4o-mini (chat, summarize), gpt-4o (admin insights, product analysis, content generation)</p>
                  </Field>
                </div>
              </AdminCard>

              {/* Rate Limiting - Upstash Redis */}
              <AdminCard>
                <SectionHeader
                  icon={ShieldCheck}
                  eyebrow="Rate Limiting"
                  title="Upstash Redis"
                  description="Bảo vệ API khỏi bị tấn công brute-force và giới hạn tốc độ request."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Upstash Redis REST URL">
                    <input
                      type="url"
                      value={settings.upstash_redis_rest_url ?? ""}
                      onChange={(e) => updateSetting("upstash_redis_rest_url", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="Upstash Redis REST Token">
                    <input
                      type="password"
                      value={settings.upstash_redis_rest_token ?? ""}
                      onChange={(e) => updateSetting("upstash_redis_rest_token", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="..."
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Lấy tại: https://console.upstash.com</p>
                  </Field>
                </div>
              </AdminCard>

              {/* Telegram Bot */}
              <AdminCard>
                <SectionHeader
                  icon={MessageCircle}
                  eyebrow="Notifications"
                  title="Telegram Bot"
                  description="Nhận thông báo đơn hàng mới qua Telegram."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Telegram Bot Token">
                    <input
                      type="password"
                      value={settings.telegram_bot_token ?? ""}
                      onChange={(e) => updateSetting("telegram_bot_token", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="123456:ABC-DEF..."
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Lấy từ @BotFather trên Telegram</p>
                  </Field>
                  <Field label="Telegram Chat ID">
                    <input
                      type="text"
                      value={settings.telegram_chat_id ?? ""}
                      onChange={(e) => updateSetting("telegram_chat_id", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="123456789"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Lấy từ @userinfobot trên Telegram</p>
                  </Field>
                </div>
              </AdminCard>

              {/* Payment Gateways — Stripe only */}
              <AdminCard>
                <SectionHeader
                  icon={CreditCard}
                  eyebrow="Payment Gateway"
                  title="Cổng thanh toán Stripe"
                  description="Cấu hình Stripe để nhận thanh toán. Lấy keys từ dashboard.stripe.com."
                />
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Stripe Publishable Key">
                      <input
                        type="text"
                        value={settings.stripe_publishable_key ?? ""}
                        onChange={(e) => updateSetting("stripe_publishable_key", e.target.value)}
                        className="admin-input font-mono text-sm"
                        placeholder="pk_test_..."
                      />
                    </Field>
                    <Field label="Stripe Secret Key">
                      <input
                        type="password"
                        value={settings.stripe_secret_key ?? ""}
                        onChange={(e) => updateSetting("stripe_secret_key", e.target.value)}
                        className="admin-input font-mono text-sm"
                        placeholder="sk_test_..."
                        autoComplete="off"
                      />
                    </Field>
                    <Field label="Stripe Webhook Secret">
                      <input
                        type="password"
                        value={settings.stripe_webhook_secret ?? ""}
                        onChange={(e) => updateSetting("stripe_webhook_secret", e.target.value)}
                        className="admin-input font-mono text-sm"
                        placeholder="whsec_..."
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                </div>
              </AdminCard>

              {/* Google OAuth */}
              <AdminCard>
                <SectionHeader
                  icon={Globe}
                  eyebrow="Authentication"
                  title="Google OAuth"
                  description="Cho phép đăng nhập bằng tài khoản Google."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Google Client ID">
                    <input
                      type="text"
                      value={settings.google_client_id ?? ""}
                      onChange={(e) => updateSetting("google_client_id", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="...apps.googleusercontent.com"
                    />
                  </Field>
                  <Field label="Google Client Secret">
                    <input
                      type="password"
                      value={settings.google_client_secret ?? ""}
                      onChange={(e) => updateSetting("google_client_secret", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="..."
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Lấy tại: Google Cloud Console → APIs & Services → Credentials</p>
                  </Field>
                </div>
              </AdminCard>

              {/* AWS S3 */}
              <AdminCard>
                <SectionHeader
                  icon={Database}
                  eyebrow="File Storage"
                  title="AWS S3"
                  description="Lưu trữ hình ảnh và file trên AWS S3."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="S3 Bucket Name">
                    <input
                      type="text"
                      value={settings.aws_s3_bucket ?? ""}
                      onChange={(e) => updateSetting("aws_s3_bucket", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="likefood-images"
                    />
                  </Field>
                  <Field label="AWS Region">
                    <input
                      type="text"
                      value={settings.aws_region ?? ""}
                      onChange={(e) => updateSetting("aws_region", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="us-east-1"
                    />
                  </Field>
                  <Field label="AWS Access Key ID">
                    <input
                      type="password"
                      value={settings.aws_access_key_id ?? ""}
                      onChange={(e) => updateSetting("aws_access_key_id", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="AKIA..."
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="AWS Secret Access Key">
                    <input
                      type="password"
                      value={settings.aws_secret_access_key ?? ""}
                      onChange={(e) => updateSetting("aws_secret_access_key", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="..."
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </AdminCard>

              {/* Analytics */}
              <AdminCard>
                <SectionHeader
                  icon={Bell}
                  eyebrow="Analytics"
                  title="Theo dõi & Phân tích"
                  description="Cấu hình Google Analytics, Facebook Pixel, Google Tag Manager."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Field label="Google Analytics Tracking ID">
                    <input
                      type="text"
                      value={settings.ga_tracking_id ?? ""}
                      onChange={(e) => updateSetting("ga_tracking_id", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </Field>
                  <Field label="Facebook Pixel ID">
                    <input
                      type="text"
                      value={settings.fb_pixel_id ?? ""}
                      onChange={(e) => updateSetting("fb_pixel_id", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="1234567890"
                    />
                  </Field>
                  <Field label="Google Tag Manager ID">
                    <input
                      type="text"
                      value={settings.gtm_id ?? ""}
                      onChange={(e) => updateSetting("gtm_id", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="GTM-XXXXXXX"
                    />
                  </Field>
                </div>
              </AdminCard>

              {/* Sentry */}
              <AdminCard>
                <SectionHeader
                  icon={ShieldCheck}
                  eyebrow="Error Monitoring"
                  title="Sentry"
                  description="Theo dõi lỗi và crash reports."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Sentry Organization">
                    <input
                      type="text"
                      value={settings.sentry_org ?? ""}
                      onChange={(e) => updateSetting("sentry_org", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="likefood"
                    />
                  </Field>
                  <Field label="Sentry Project">
                    <input
                      type="text"
                      value={settings.sentry_project ?? ""}
                      onChange={(e) => updateSetting("sentry_project", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="likefood-frontend"
                    />
                  </Field>
                  <Field label="Sentry Auth Token">
                    <input
                      type="password"
                      value={settings.sentry_auth_token ?? ""}
                      onChange={(e) => updateSetting("sentry_auth_token", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="sntrys..."
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Sentry DSN">
                    <input
                      type="text"
                      value={settings.sentry_dsn ?? ""}
                      onChange={(e) => updateSetting("sentry_dsn", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="https://...@sentry.io/..."
                    />
                  </Field>
                </div>
              </AdminCard>

              {/* Health Check */}
              <AdminCard>
                <SectionHeader
                  icon={ShieldCheck}
                  eyebrow="Health Check"
                  title="Health Check Secret"
                  description="Bảo vệ endpoint health check bằng secret."
                />
                <div className="mt-6">
                  <Field label="Health Secret">
                    <input
                      type="password"
                      value={settings.health_secret ?? ""}
                      onChange={(e) => updateSetting("health_secret", e.target.value)}
                      className="admin-input font-mono text-sm"
                      placeholder="Tạo ngẫu nhiên: openssl rand -hex 32"
                      autoComplete="off"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">Dùng cho /api/health?secret=...</p>
                  </Field>
                </div>
              </AdminCard>

              <div className="rounded-lg border border-zinc-700/50 bg-zinc-900 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Ghi chú quan trọng</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                  <li>- <strong>Ưu tiên</strong>: Giá trị lưu trong Admin → Database → Environment. Nếu để trống, hệ thống sẽ dùng biến môi trường trong file .env.</li>
                  <li>- <strong>Bảo mật</strong>: Các trường secret/password chỉ hiển thị dấu chấm (••••), không lưu plain text vào localStorage.</li>
                  <li>- <strong>Khôi phục</strong>: Nếu cần reset về mặc định, xóa giá trị trong Admin và hệ thống sẽ dùng .env.</li>
                </ul>
              </div>
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
              <AdminCard>
                <SectionHeader icon={UserRound} eyebrow="Hồ sơ quản trị" title="Thông tin cá nhân" description="Cập nhật thông tin quản trị để phục vụ kiểm duyệt nội bộ và hỗ trợ vận hành." />
                <div className="mt-6 grid gap-5">
                  <Field label="Họ và tên">
                    <input value={profile.name} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} className="admin-input" placeholder="Admin user" />
                  </Field>
                  <Field label="Số điện thoại">
                    <input value={profile.phone} onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))} className="admin-input" placeholder="+1 555 000 1234" />
                  </Field>
                  <Field label="Email">
                    <input value={profile.email} readOnly className="admin-input bg-zinc-800 text-zinc-300" />
                  </Field>
                  <Field label="Ngày tham gia">
                    <input value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""} readOnly className="admin-input bg-zinc-800 text-zinc-300" />
                  </Field>
                  <Button size="lg" onClick={() => void saveProfile()} disabled={isSavingProfile}>
                    {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu hồ sơ
                  </Button>
                </div>
              </AdminCard>

              <AdminCard>
                <SectionHeader icon={LayoutDashboard} eyebrow="Tổng quan cài đặt" title="Trang này quản lý những gì" description="Cấu hình quản trị được kết nối trực tiếp với API thực thay vì các trường form bị bỏ lại." />
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <MiniTile title="Thông tin cửa hàng" body="Nội dung thương hiệu, metadata, thông tin hỗ trợ và địa chỉ đều có thể chỉnh sửa tại đây." />
                  <MiniTile title="Thương mại" body="Phí vận chuyển, ngưỡng miễn phí, thuế và điểm tích lũy đều có thể điều chỉnh." />
                  <MiniTile title="Kênh liên lạc" body="Liên kết mạng xã hội và cấu hình SMTP có thể cập nhật mà không cần sửa code." />
                  <MiniTile title="Thanh toán" body="Cấu hình phương thức thanh toán, tài khoản ngân hàng và mã QR để thanh toán thuận tiện." />
                  <MiniTile title="Vận hành" body="Thanh thông báo, chế độ bảo trì và gửi thông báo hàng loạt được quản lý tập trung." />
                  <MiniTile title="Kết nối" body="API keys, OAuth, S3, Sentry và các dịch vụ bên thứ 3." />
                </div>
              </AdminCard>
            </div>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          min-height: 3.35rem;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.875rem 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: rgb(15 23 42);
          outline: none;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .admin-input:focus {
          border-color: rgba(15, 23, 42, 0.32);
          background: white;
        }
        .admin-textarea {
          width: 100%;
          border-radius: 1.15rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 1rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: rgb(15 23 42);
          outline: none;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .admin-textarea:focus {
          border-color: rgba(15, 23, 42, 0.32);
          background: white;
        }
      `}</style>
    </AdminPageContainer>
  );
}

function pickAllowedSettings(source: Record<string, unknown>): SettingsState {
  return ALLOWED_SETTINGS.reduce<SettingsState>((acc, key) => {
    const value = source[key];
    if (typeof value === "string") {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Globe;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-zinc-800 text-zinc-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="admin-input">
        <option value="OFF">Tắt</option>
        <option value="ON">Bật</option>
      </select>
    </Field>
  );
}

function CheckCard({
  title,
  description,
  checked,
  onClick,
}: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${checked ? "border-teal-600 bg-teal-600/10 text-teal-400" : "border-zinc-700 bg-zinc-900 text-zinc-300"}`}
    >
      <p className="font-semibold">{title}</p>
      <p className={`mt-2 text-sm ${checked ? "text-teal-400/70" : "text-zinc-500"}`}>{description}</p>
    </button>
  );
}

function MiniTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900 p-4">
      <p className="font-semibold text-zinc-200">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className={`mt-2 font-black ${compact ? "truncate text-lg" : "text-3xl"} ${tone}`}>{value}</p>
    </div>
  );
}
