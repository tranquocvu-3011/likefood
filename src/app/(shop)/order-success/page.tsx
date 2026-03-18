"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 *
 * Order Success Page — Premium design with confetti celebration
 * Shown after successful payment via Stripe
 */

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CheckCircle2, Package, ShoppingBag,
    Truck, ArrowRight, Sparkles, Copy, Check
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";
import { analytics } from "@/lib/analytics/sdk";

// ─── Confetti Particle System ──────────────────────────────────────────
interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    velocityX: number;
    velocityY: number;
    rotationSpeed: number;
    opacity: number;
    shape: "circle" | "rect" | "star";
}

const CONFETTI_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FDCB6E",
    "#6C5CE7", "#FF85A2", "#2ECC71", "#F39C12",
    "#E74C3C", "#3498DB", "#1ABC9C", "#9B59B6",
];

function ConfettiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);
    const _burstCountRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const createBurst = (count: number) => {
            const particles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() * Math.PI * 2);
                const speed = 4 + Math.random() * 8;
                particles.push({
                    id: Date.now() + i,
                    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                    y: canvas.height * 0.35,
                    size: 4 + Math.random() * 8,
                    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                    rotation: Math.random() * 360,
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed - 6,
                    rotationSpeed: (Math.random() - 0.5) * 10,
                    opacity: 1,
                    shape: (["circle", "rect", "star"] as const)[Math.floor(Math.random() * 3)],
                });
            }
            particlesRef.current.push(...particles);
        };

        // Initial burst
        createBurst(80);

        // Additional bursts
        const burstTimers = [
            setTimeout(() => createBurst(50), 300),
            setTimeout(() => createBurst(40), 700),
            setTimeout(() => createBurst(30), 1200),
        ];

        const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const method = i === 0 ? "moveTo" : "lineTo";
                ctx[method](x + Math.cos(angle) * size, y + Math.sin(angle) * size);
            }
            ctx.closePath();
            ctx.fill();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const alive: Particle[] = [];

            for (const p of particlesRef.current) {
                p.x += p.velocityX;
                p.y += p.velocityY;
                p.velocityY += 0.12; // gravity
                p.velocityX *= 0.99; // friction
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.004;

                if (p.opacity <= 0 || p.y > canvas.height + 20) continue;
                alive.push(p);

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;

                if (p.shape === "circle") {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === "rect") {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    drawStar(ctx, 0, 0, p.size / 2);
                }
                ctx.restore();
            }

            particlesRef.current = alive;

            if (alive.length > 0) {
                animFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animFrameRef.current);
            burstTimers.forEach(clearTimeout);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
}

// ─── Order Types ──────────────────────────────────────────────────────
interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        id: number;
        slug?: string | null;
        name: string;
        image?: string | null;
    };
}

interface Order {
    id: number;
    status: string;
    total: number;
    discount?: number | null;
    shippingFee?: number | null;
    createdAt: string;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    shippingMethod?: string | null;
    paymentMethod?: string | null;
    items: OrderItem[];
}

function getShippingLabel(method: string | null | undefined, vi: boolean) {
    const labels: Record<string, string> = {
        pickup: vi ? "Nhận tại cửa hàng" : "Store Pickup",
        standard: vi ? "Tiêu chuẩn (3-5 ngày)" : "Standard (3-5 days)",
        express: vi ? "Nhanh (1-2 ngày)" : "Express (1-2 days)",
        overnight: vi ? "Trong ngày" : "Same day",
    };
    return labels[method || ""] || (vi ? "Tiêu chuẩn" : "Standard");
}

// ─── Main Component ──────────────────────────────────────────────────
export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showConfetti, setShowConfetti] = useState(true);
    const { language } = useLanguage();
    const vi = language === "vi";
    const trackedRef = useRef(false);

    const fetchOrder = useCallback(async () => {
        if (!orderId) {
            router.push("/");
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetch(`/api/user/orders/${orderId}`);
            if (!response.ok) {
                router.push("/");
                return;
            }
            const data = await response.json();
            setOrder(data);
        } catch (error) {
            logger.error("Failed to fetch order", error as Error, { context: "order-success-page" });
            router.push("/");
        } finally {
            setIsLoading(false);
        }
    }, [orderId, router]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    // Hide confetti after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Track purchase event (only once)
    useEffect(() => {
        if (!order || trackedRef.current) return;
        trackedRef.current = true;
        try {
            analytics.trackPurchase(
                order.id,
                order.total,
                "USD",
                order.items.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.price,
                }))
            );
        } catch (err) {
            logger.error("Failed to track purchase event", err as Error, { context: "order-success-page" });
        }
    }, [order]);

    const copyOrderId = () => {
        if (order) {
            navigator.clipboard.writeText(`#${order.id}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const orderDate = useMemo(() => {
        if (!order?.createdAt) return "";
        return new Date(order.createdAt).toLocaleString(vi ? "vi-VN" : "en-US", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    }, [order?.createdAt, vi]);

    const subtotal = useMemo(() => {
        if (!order) return 0;
        return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [order]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-14 h-14 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-500">{vi ? "Đang tải đơn hàng..." : "Loading order..."}</p>
                </motion.div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <>
            {/* Confetti celebration */}
            {showConfetti && <ConfettiCanvas />}

            <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/40 to-teal-100/20 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-blue-100/30 to-transparent rounded-full blur-3xl -z-10" />

                <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
                    {/* ─── Success Header ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center mb-8"
                    >
                        {/* Animated check icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="relative mx-auto mb-6 w-20 h-20"
                        >
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                            <div className="absolute inset-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-lg shadow-emerald-500/30" />
                            <div className="relative flex items-center justify-center w-full h-full">
                                <CheckCircle2 className="w-10 h-10 text-white drop-shadow-sm" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                                <Sparkles className="w-3.5 h-3.5" />
                                {vi ? "Thanh toán thành công" : "Payment Successful"}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                                {vi ? "Cảm ơn bạn đã đặt hàng!" : "Thank you for your order!"}
                            </h1>
                            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                {vi
                                    ? "Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ xử lý và giao hàng sớm nhất."
                                    : "Your order has been confirmed. We'll process and deliver it as soon as possible."}
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* ─── Order ID Card ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Package className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{vi ? "Mã đơn hàng" : "Order number"}</p>
                                <p className="text-lg font-extrabold text-slate-900 font-mono">#{order.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={copyOrderId}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? (vi ? "Đã sao chép" : "Copied") : (vi ? "Sao chép" : "Copy")}
                            </button>
                        </div>
                    </motion.div>

                    {/* ─── Order Details ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4"
                    >
                        {/* Info row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                            <div className="p-4 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{vi ? "Ngày đặt" : "Date"}</p>
                                <p className="text-xs font-semibold text-slate-800">{orderDate}</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{vi ? "Vận chuyển" : "Shipping"}</p>
                                <p className="text-xs font-semibold text-slate-800">{getShippingLabel(order.shippingMethod, vi)}</p>
                            </div>
                            <div className="p-4 text-center hidden sm:block">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{vi ? "Trạng thái" : "Status"}</p>
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full">
                                    {vi ? "Đang xử lý" : "Processing"}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-4 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                {vi ? `${order.items.length} sản phẩm` : `${order.items.length} item${order.items.length > 1 ? "s" : ""}`}
                            </p>
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                                        {item.product.image ? (
                                            <Image src={item.product.image} alt={item.product.name} fill sizes="48px" className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                <ShoppingBag className="h-5 w-5" />
                                            </div>
                                        )}
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{item.product.name}</p>
                                        <p className="text-xs text-slate-400">{item.quantity} × {formatPrice(item.price)}</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{formatPrice(item.quantity * item.price)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Pricing summary */}
                        <div className="border-t border-slate-100 p-4 space-y-2 bg-slate-50/50">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{vi ? "Tạm tính" : "Subtotal"}</span>
                                <span className="font-semibold text-slate-700">{formatPrice(subtotal)}</span>
                            </div>
                            {(order.shippingFee != null && order.shippingFee > 0) && (
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{vi ? "Phí vận chuyển" : "Shipping"}</span>
                                    <span className="font-semibold text-slate-700">{formatPrice(order.shippingFee)}</span>
                                </div>
                            )}
                            {(order.discount != null && order.discount > 0) && (
                                <div className="flex justify-between text-xs text-emerald-600">
                                    <span>{vi ? "Giảm giá" : "Discount"}</span>
                                    <span className="font-semibold">-{formatPrice(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="text-sm font-bold text-slate-900">{vi ? "Tổng cộng" : "Total"}</span>
                                <span className="text-xl font-extrabold text-emerald-600">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── Action Buttons ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row gap-3 mb-6"
                    >
                        <Link
                            href={`/profile/orders/${order.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            {vi ? "Xem chi tiết đơn hàng" : "View order details"}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/products"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {vi ? "Tiếp tục mua sắm" : "Continue shopping"}
                        </Link>
                    </motion.div>

                    {/* ─── Next Steps ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xl"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Truck className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold">{vi ? "Bước tiếp theo" : "What's next?"}</h3>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { step: "1", text: vi ? "Xác nhận đơn hàng qua email" : "Order confirmation via email" },
                                { step: "2", text: vi ? "Đóng gói và giao cho đơn vị vận chuyển" : "Packed and shipped" },
                                { step: "3", text: vi ? "Giao hàng đến địa chỉ bạn" : "Delivered to your door" },
                            ].map((item) => (
                                <div key={item.step} className="flex items-start gap-2.5">
                                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                                        {item.step}
                                    </span>
                                    <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Footer note */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-center text-[11px] text-slate-400 mt-6"
                    >
                        {vi ? "Cần hỗ trợ? " : "Need help? "}
                        <Link href="/contact" className="text-emerald-600 font-semibold hover:underline">
                            {vi ? "Liên hệ chúng tôi" : "Contact us"}
                        </Link>
                    </motion.p>
                </div>
            </div>
        </>
    );
}
