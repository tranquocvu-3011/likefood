"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Save,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  variant?: { name?: string | null; weight?: string | null; flavor?: string | null; sku?: string | null } | null;
  product: {
    id: number;
    slug?: string | null;
    name: string;
    image?: string | null;
    price: number;
  };
}

interface OrderEvent {
  id: number;
  status: string;
  note?: string | null;
  createdAt: string;
}

interface Order {
  id: number;
  status: string;
  total: number;
  subtotal?: number | null;
  shippingFee?: number;
  discount?: number;
  couponCode?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingZipCode?: string | null;
  shippingPhone?: string | null;
  shippingMethod?: string | null;
  trackingCode?: string | null;
  carrier?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items?: OrderItem[];
  orderItems?: OrderItem[];
  user?: {
    id: number;
    email: string;
    name: string | null;
    phone?: string | null;
  };
  events?: OrderEvent[];
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Đang chờ xác nhận", desc: "Mới tạo", icon: Clock3, tone: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "CONFIRMED", label: "Đã xác nhận", desc: "Đã nhận đơn", icon: CheckCircle2, tone: "bg-sky-100 text-sky-700 border-sky-200" },
  { value: "PROCESSING", label: "Đang chuẩn bị", desc: "Đóng gói", icon: Package, tone: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "SHIPPING", label: "Đang giao", desc: "Fulfillment", icon: Truck, tone: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { value: "DELIVERED", label: "Đã giao", desc: "Đã đến nơi", icon: Check, tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "COMPLETED", label: "Hoàn thành", desc: "Đóng đơn", icon: CheckCircle2, tone: "bg-green-100 text-green-700 border-green-200" },
  { value: "CANCELLED", label: "Đã hủy", desc: "Dừng xử lý", icon: XCircle, tone: "bg-rose-100 text-rose-700 border-rose-200" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shippingLabel(value?: string | null) {
  if (value === "express") return "Giao nhanh";
  if (value === "overnight") return "Ưu tiên";
  return "Tiêu chuẩn";
}

function paymentLabel(value?: string | null) {
  if (value === "COD") return "Thanh toán khi nhận";
  if (value === "BANK_TRANSFER" || value === "BANK") return "Chuyển khoản";
  if (value === "PAYPAL") return "PayPal";
  if (value === "STRIPE") return "Thẻ thanh toán";
  return value || "Chưa cài đặt";
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("");

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Không thể tải đơn hàng.");
      setOrder({ ...data, items: data.items || data.orderItems || [], events: data.events || [] });
      setStatus(data.status || "PENDING");
      setNotes(data.notes || "");
      setTrackingCode(data.trackingCode || "");
      setCarrier(data.carrier || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      void fetchOrder();
    }
  }, [orderId]);

  const selectedStatus = useMemo(() => STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0], [status]);
  const items = order?.items || [];
  const events = useMemo(() => [...(order?.events || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [order?.events]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes, trackingCode, carrier }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Không thể cập nhật đơn hàng.");
      toast.success("Đã cập nhật đơn hàng.");
      await fetchOrder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật đơn hàng.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#111113] p-8">
        <Card className="mx-auto max-w-3xl rounded-[2rem] border border-rose-500/30 bg-[#111113]">
          <CardContent className="p-10 text-center">
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h1 className="mt-4 text-2xl font-black text-zinc-100">Không thể mở đơn hàng</h1>
            <p className="mt-2 text-sm text-zinc-400">{error || "Dữ liệu không tồn tại hoặc bạn không có quyền truy cập."}</p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/admin/orders">Quay lại danh sách đơn</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111113] p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 transition hover:text-teal-400">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đơn hàng
        </Link>

        <section className="overflow-hidden rounded-[2.5rem] border border-zinc-700/50 bg-[#111113] shadow-[0_20px_70px_rgba(0,0,0,0.5)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full border ${selectedStatus.tone}`}>
                <selectedStatus.icon className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Chi tiết đơn hàng</p>
                <h1 className="text-4xl font-black tracking-tight text-zinc-100 lg:text-5xl">#{order.id}</h1>
                <p className="max-w-2xl text-base leading-7 text-zinc-400 lg:text-lg">{selectedStatus.label} · {selectedStatus.desc}. Theo dõi khách hàng, fulfillment và payment trong cùng một màn hình.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-zinc-400">
                <span className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-4 py-2">Tạo lúc {formatDate(order.createdAt)}</span>
                <span className="rounded-full border border-zinc-700/50 bg-zinc-900/50 px-4 py-2">Cập nhật {formatDate(order.updatedAt)}</span>
                <span className={`rounded-full border px-4 py-2 ${selectedStatus.tone}`}>{selectedStatus.label}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Tổng tiền", value: formatPrice(order.total) },
                { label: "Thanh toán", value: order.paymentStatus === "PAID" ? "Đã thanh toán" : order.paymentStatus || "Chờ xử lý" },
                { label: "Vận chuyển", value: shippingLabel(order.shippingMethod) },
              ].map((entry) => (
                <div key={entry.label} className="rounded-[1.75rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">{entry.label}</p>
                  <p className="mt-2 text-base font-black text-zinc-100">{entry.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-teal-500" />
                  <h2 className="text-2xl font-black tracking-tight text-zinc-100">Khách hàng & vận chuyển</h2>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Khách hàng</p>
                    <p className="mt-2 text-lg font-black text-zinc-100">{order.user?.name || "Khách vãng lai"}</p>
                    <p className="mt-1 text-sm text-zinc-400">{order.user?.email || "Không có email"}</p>
                    <p className="mt-1 text-sm text-zinc-400">{order.user?.phone || order.shippingPhone || "Không có số điện thoại"}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Địa chỉ giao hàng</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-zinc-100">{[order.shippingAddress, order.shippingCity, order.shippingZipCode].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</p>
                    <p className="mt-2 text-sm text-zinc-400">Hình thức: {shippingLabel(order.shippingMethod)}</p>
                    {(order.trackingCode || order.carrier) && <p className="mt-1 text-sm text-zinc-400">Mã vận đơn: {order.carrier || "Chờ đơn vị vận chuyển"} · {order.trackingCode || "Chờ mã vận đơn"}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.25rem] border border-zinc-700/50 bg-[#111113]">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-teal-500" />
                  <h2 className="text-2xl font-black tracking-tight text-zinc-100">Sản phẩm trong đơn</h2>
                </div>
                <div className="mt-6 space-y-4">
                  {items.map((item) => {
                    const variantLabel = item.variant?.name || [item.variant?.weight, item.variant?.flavor, item.variant?.sku].filter(Boolean).join(" · ");
                    return (
                      <div key={item.id} className="flex gap-4 rounded-[1.75rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                        <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-700">
                          {item.product.image ? (
                            <Image src={item.product.image} alt={item.product.name} fill sizes="84px" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-600">
                              <Package className="h-7 w-7" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/products/${item.product.slug || item.product.id}`} className="block text-lg font-black tracking-tight text-zinc-100 transition hover:text-teal-400">{item.product.name}</Link>
                          {variantLabel && <p className="mt-1 text-sm text-zinc-500">{variantLabel}</p>}
                          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-500">
                            <span>{item.quantity} x {formatPrice(item.price)}</span>
                            <span className="text-lg font-black text-zinc-100">{formatPrice(item.quantity * item.price)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {events.length > 0 && (
              <Card className="rounded-[2.25rem] border-zinc-700/50 bg-[#111113] shadow-sm">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-teal-500" />
                    <h2 className="text-2xl font-black tracking-tight text-zinc-100">Lịch sử trạng thái</h2>
                  </div>
                  <div className="mt-6 space-y-5">
                    {events.map((event, index) => {
                      const meta = STATUS_OPTIONS.find((item) => item.value === event.status) || STATUS_OPTIONS[0];
                      const EventIcon = meta.icon;
                      return (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${meta.tone}`}>
                              <EventIcon className="h-4 w-4" />
                            </div>
                            {index < events.length - 1 && <div className="mt-2 h-full w-px bg-zinc-800" />}
                          </div>
                          <div className="pb-2">
                            <p className="text-sm font-black text-zinc-100">{meta.label}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{formatDate(event.createdAt)}</p>
                            {event.note && <p className="mt-2 text-sm leading-6 text-zinc-400">{event.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8 xl:sticky xl:top-8 xl:self-start">
            <Card className="rounded-[2.25rem] border-zinc-700/50 bg-[#111113] shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Điều chỉnh đơn hàng</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Cập nhật trạng thái</h2>
                  </div>
                  <div className={`rounded-full border px-4 py-2 text-sm font-black ${selectedStatus.tone}`}>{selectedStatus.label}</div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((option) => {
                    const OptionIcon = option.icon;
                    const active = option.value === status;
                    return (
                      <button key={option.value} type="button" onClick={() => setStatus(option.value)} className={`rounded-[1.35rem] border p-4 text-left transition ${active ? option.tone : "border-zinc-700/50 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-zinc-700/70" : "bg-zinc-800"}`}>
                            <OptionIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-black">{option.label}</p>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{option.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Mã vận đơn</label>
                    <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="UPS123456789" className="mt-2 h-12 w-full rounded-2xl border border-zinc-700/50 bg-zinc-900/50 px-4 text-sm font-medium text-zinc-300 outline-none transition focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Đơn vị vận chuyển</label>
                    <input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="UPS, FedEx, USPS..." className="mt-2 h-12 w-full rounded-2xl border border-zinc-700/50 bg-zinc-900/50 px-4 text-sm font-medium text-zinc-300 outline-none transition focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Ghi chú nội bộ</label>
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Them ghi chu cho doi van hanh, giao nhan hoac ho tro khach hang..." className="mt-2 min-h-[150px] w-full rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 px-4 py-4 text-sm leading-6 text-zinc-300 outline-none transition focus:border-teal-500" />
                  </div>
                </div>

                <Button size="xl" className="mt-6 w-full justify-between" onClick={handleSave} disabled={isSaving}>
                  <span className="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Lưu cập nhật
                  </span>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2.25rem] border-zinc-700/50 bg-[#111113] shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <h2 className="text-2xl font-black tracking-tight text-zinc-100">Thanh toán & Tổng tiền</h2>
                <div className="mt-6 space-y-4 text-sm text-zinc-400">
                  <SummaryRow label="Tạm tính" value={formatPrice(order.subtotal || 0)} />
                  <SummaryRow label="Phí vận chuyển" value={formatPrice(order.shippingFee || 0)} />
                  <SummaryRow label="Giảm giá" value={`-${formatPrice(order.discount || 0)}`} />
                  {order.couponCode && <SummaryRow label="Mã giảm giá" value={order.couponCode} />}
                  <SummaryRow label="Phương thức thanh toán" value={paymentLabel(order.paymentMethod)} />
                  <SummaryRow label="Trạng thái thanh toán" value={order.paymentStatus || "Chờ xử lý"} />
                  <div className="border-t border-dashed border-zinc-700/50 pt-4">
                    <SummaryRow label="Tổng đơn hàng" value={formatPrice(order.total)} strong />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.25rem] border-zinc-700/50 bg-[#111113] shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-teal-500" />
                  <h2 className="text-2xl font-black tracking-tight text-zinc-100">Tóm tắt vận hành</h2>
                </div>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Liên hệ</p>
                    <p className="mt-2 text-sm font-bold text-zinc-100">{order.user?.email || "Khách"}</p>
                    <p className="mt-1 text-sm text-zinc-400">{order.user?.phone || order.shippingPhone || "Không có SĐT"}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Trạng thái vận đơn</p>
                    <p className="mt-2 text-sm font-bold text-zinc-100">{trackingCode ? "Tracking code đã sẵn sàng" : "Cần thêm tracking code khi giao hàng"}</p>
                    <p className="mt-1 text-sm text-zinc-400">{carrier ? `Carrier: ${carrier}` : "Carrier chưa được gán"}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-zinc-700/50 bg-zinc-900/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">Mốc giao hàng</p>
                    <p className="mt-2 text-sm font-bold text-zinc-100">{order.deliveredAt ? `Delivered ${formatDate(order.deliveredAt)}` : "Chưa ghi nhận mốc giao thành công"}</p>
                    <p className="mt-1 text-sm text-zinc-400">{order.shippedAt ? `Shipped ${formatDate(order.shippedAt)}` : "Chưa ghi nhận mốc giao vận chuyển"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "text-base font-black text-zinc-100" : "font-medium text-zinc-500"}>{label}</span>
      <span className={strong ? "text-xl font-black text-zinc-100" : "font-black text-zinc-100"}>{value}</span>
    </div>
  );
}



