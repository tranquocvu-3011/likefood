"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Link from "next/link";
import Image from "next/image";
import {
    Facebook,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    Truck,
    RefreshCw,
    CreditCard,
    ChevronDown,
    Send,
    CheckCircle2,
    AlertCircle,
    Star,
    Instagram,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";

// ─── Link group (accordion on mobile) ─────────────────────────────────────────

function LinkGroup({ group }: { group: { title: string; links: { label: string; href: string }[] } }) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            {/* Desktop title */}
            <p className="hidden md:block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 mb-4">
                {group.title}
            </p>

            {/* Mobile toggle */}
            <button
                className="md:hidden w-full flex items-center justify-between py-3 border-b border-slate-100 text-left"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="text-[13px] font-semibold text-slate-800">{group.title}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.span>
            </button>

            {/* Links */}
            <AnimatePresence initial={false}>
                <motion.ul
                    key={open ? "o" : "c"}
                    className="overflow-hidden space-y-2.5"
                    initial={{ height: 0, opacity: 0 }}
                    animate={
                        typeof window !== "undefined" && window.innerWidth >= 768
                            ? { height: "auto", opacity: 1 }
                            : open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }
                    }
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="md:hidden h-2.5" />
                    {group.links.map((link) => (
                        <li key={link.label}>
                            <Link
                                href={link.href}
                                className="text-[13px] font-semibold text-slate-700 hover:text-primary transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                    <div className="md:hidden h-2" />
                </motion.ul>
            </AnimatePresence>
        </div>
    );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

function Newsletter() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
        setStatus("loading");
        try {
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmed }),
            });
            setStatus(res.ok ? "success" : "error");
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/8 via-emerald-50 to-teal-50 border border-primary/15 px-7 py-6 md:py-7">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                {/* Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{t("footer.exclusiveOffers")}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 leading-snug">
                        {t("footer.newsletterTitle")}
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                        {t("footer.newsletterDesc")}
                    </p>
                </div>

                {/* Form */}
                <div className="w-full md:w-auto md:min-w-[360px]">
                    {status === "success" ? (
                        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <p className="text-[13px] font-medium text-emerald-700">{t("footer.subscribeSuccess")}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="flex-1 relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t("footer.emailPlaceholder")}
                                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all ${
                                        status === "error"
                                            ? "border-red-300 focus:ring-1 focus:ring-red-200"
                                            : "border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/15"
                                    }`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm shadow-primary/15 flex-shrink-0 disabled:opacity-60 active:scale-95"
                            >
                                {status === "loading"
                                    ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Send className="w-3.5 h-3.5" />
                                }
                                <span>{t("footer.subscribe")}</span>
                            </button>
                        </form>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-1 mt-1.5">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <p className="text-[11px] text-red-500">{t("footer.subscribeError")}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { label: "Stripe",     color: "text-[#635BFF] bg-indigo-50 border-indigo-100"  },
    { label: "Visa",       color: "text-blue-700 bg-blue-50 border-blue-100"  },
    { label: "Mastercard", color: "text-red-600 bg-red-50 border-red-100"  },
    { label: "Amex",       color: "text-blue-600 bg-blue-50 border-blue-100" },
];

const SHIPPING_PARTNERS = [
    { label: "USPS",       color: "text-blue-700 bg-blue-50 border-blue-100" },
    { label: "FedEx",      color: "text-purple-600 bg-purple-50 border-purple-100" },
    { label: "UPS",        color: "text-amber-700 bg-amber-50 border-amber-100" },
    { label: "US Shipping", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
];

// ─── Main Footer ──────────────────────────────────────────────────────────────

export default function Footer() {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const { t } = useLanguage();
    const [supportPhone, setSupportPhone] = useState("+1 402-315-8105");
    const [supportEmail, setSupportEmail] = useState("tranquocvu3011@gmail.com");
    const [supportAddress, setSupportAddress] = useState("Omaha, NE 68136, United States");
    const [socialUrls, setSocialUrls] = useState({
        facebook: "https://www.facebook.com/profile.php?id=100076170558548",
        instagram: "https://instagram.com/likefood",
        tiktok: "",
        youtube: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const { getPublicSettings } = await import("@/lib/public-settings");
                const data = await getPublicSettings();
                if (data.SITE_SUPPORT_PHONE) setSupportPhone(data.SITE_SUPPORT_PHONE);
                if (data.SITE_SUPPORT_EMAIL) setSupportEmail(data.SITE_SUPPORT_EMAIL);
                if (data.SITE_ADDRESS) setSupportAddress(data.SITE_ADDRESS);
                setSocialUrls(prev => ({
                    facebook: data.FACEBOOK_URL || prev.facebook,
                    instagram: data.INSTAGRAM_URL || prev.instagram,
                    tiktok: data.TIKTOK_URL || prev.tiktok,
                    youtube: data.YOUTUBE_URL || prev.youtube,
                }));
            } catch { /* keep defaults */ }
        };
        void load();
    }, []);

    // ── Trust badges using i18n ──
    const TRUST_ITEMS = [
        { icon: ShieldCheck, title: t("trustBadges.authentic"),  desc: t("trustBadges.authenticDesc"), color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100" },
        { icon: Truck,       title: t("trustBadges.freeShip"),   desc: t("trustBadges.freeShipDesc"),  color: "text-sky-600",     bg: "bg-sky-50",      border: "border-sky-100"     },
        { icon: RefreshCw,   title: t("trustBadges.return"),     desc: t("trustBadges.returnDesc"),    color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-100"   },
        { icon: CreditCard,  title: t("trustBadges.secure"),     desc: t("trustBadges.secureDesc"),    color: "text-violet-600",  bg: "bg-violet-50",   border: "border-violet-100"  },
    ];

    // ── Link groups using i18n — fixed dead links ──
    const LINK_GROUPS = [
        {
            title: t("footer.products"),
            links: [
                { label: t("footer.allProducts"),       href: "/products" },
                { label: t("footer.featuredProducts"),   href: "/products?featured=true" },
                { label: t("footer.gifts"),              href: "/products?category=gifts" },
                { label: t("footer.traditionalSpices"),  href: "/products?category=gia-vi" },
                { label: t("footer.driedSeafood"),       href: "/products?category=ca-kho" },
                { label: t("footer.flashSale"),          href: "/flash-sale" },
            ],
        },
        {
            title: t("footer.company"),
            links: [
                { label: t("footer.aboutUs"),            href: "/about" },
                { label: t("footer.brandStory"),         href: "/about#story" },
                { label: "LIKEFOOD là gì?",              href: "/likefood-la-gi" },
                { label: t("footer.posts"),              href: "/posts" },
                { label: t("footer.faq"),                href: "/faq" },
                { label: t("footer.contactUs"),          href: "/contact" },
            ],
        },
        {
            title: t("footer.support"),
            links: [
                { label: t("footer.orderTracking"),      href: "/profile/orders" },
                { label: t("footer.shippingPolicy"),     href: "/policies/shipping" },
                { label: t("footer.returnPolicy"),       href: "/policies/return" },
                { label: t("footer.faqLink"),            href: "/faq" },
            ],
        },
        {
            title: t("footer.policies"),
            links: [
                { label: t("footer.privacyPolicy"),      href: "/policies/privacy" },
                { label: t("footer.termsOfService"),      href: "/policies/terms" },
                { label: t("footer.returnPolicy"),        href: "/policies/return" },
                { label: t("footer.shippingPolicy"),      href: "/policies/shipping" },
            ],
        },
    ];

    return (
        <footer ref={ref} className="bg-white text-slate-800 border-t border-slate-100">

            {/* ── Newsletter ── */}
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-[6%] pt-10 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                >
                    <Newsletter />
                </motion.div>
            </div>

            {/* ── Trust Strip ── */}
            <div className="border-y border-slate-100 bg-slate-50/60">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-[6%] py-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {TRUST_ITEMS.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.35, delay: 0.08 + i * 0.06 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${item.bg} ${item.border} hover:shadow-sm transition-all cursor-default group`}
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-slate-800 leading-tight">{item.title}</p>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Links ── */}
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-[6%] py-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

                    {/* Brand column */}
                    <motion.div
                        className="md:col-span-4 lg:col-span-3 space-y-5"
                        initial={{ opacity: 0, x: -16 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.45, delay: 0.12 }}
                    >
                        {/* Logo */}
                        <Link href="/" aria-label="LIKEFOOD">
                            <Image
                                src="/logo.png"
                                alt="LIKEFOOD"
                                width={150}
                                height={40}
                                className="max-h-10 w-auto object-contain"
                                style={{ width: "auto", height: "auto" }}
                                priority
                            />
                        </Link>

                        <p className="text-[13px] text-slate-600 leading-relaxed max-w-xs font-medium">
                            {t("footer.description")}
                        </p>

                        {/* Contact info */}
                        <div className="space-y-2.5">
                            <a href={`tel:${supportPhone.replace(/[^0-9+]/g, "")}`}
                                className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-primary transition-colors group">
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Phone className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
                                </div>
                                {supportPhone}
                            </a>
                            <a href={`mailto:${supportEmail}`}
                                className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-primary transition-colors group">
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Mail className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
                                </div>
                                {supportEmail}
                            </a>
                            <div className="flex items-center gap-2 text-[13px] text-slate-500">
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                </div>
                                {supportAddress}
                            </div>
                        </div>

                        {/* Social */}
                        <div className="flex gap-2 pt-1">
                            {[
                                ...(socialUrls.facebook ? [{ href: socialUrls.facebook, icon: Facebook, label: "Facebook", hover: "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600" }] : []),
                                { href: `mailto:${supportEmail}`,       icon: Mail,      label: "Email",    hover: "hover:bg-primary/5 hover:border-primary/30 hover:text-primary" },
                                ...(socialUrls.instagram ? [{ href: socialUrls.instagram, icon: Instagram, label: "Instagram", hover: "hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600" }] : []),
                            ].map((s) => (
                                <a key={s.label} href={s.href} aria-label={s.label}
                                    target={s.href.startsWith("http") ? "_blank" : undefined}
                                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 transition-all duration-200 ${s.hover}`}>
                                    <s.icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Link columns */}
                    <motion.div
                        className="md:col-span-8 lg:col-span-9 grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-8"
                        initial={{ opacity: 0, x: 16 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.45, delay: 0.18 }}
                    >
                        {LINK_GROUPS.map((group) => (
                            <LinkGroup key={group.title} group={group} />
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ── Payment & Shipping ── */}
            <div className="border-t border-slate-100 bg-slate-50/50">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-[6%] py-5">
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-start sm:items-center">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{t("footer.payment")}</span>
                            <div className="hidden sm:block w-px h-4 bg-slate-200" />
                            {PAYMENT_METHODS.map((p) => (
                                <span key={p.label} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${p.color}`}>{p.label}</span>
                            ))}
                        </div>
                        <div className="hidden sm:block w-px h-5 bg-slate-200 self-center" />
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{t("footer.shipping")}</span>
                            <div className="hidden sm:block w-px h-4 bg-slate-200" />
                            {SHIPPING_PARTNERS.map((s) => (
                                <span key={s.label} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${s.color}`}>{s.label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Footer Bottom ── */}
            <div className="border-t border-slate-100">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-[6%] py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[12px] font-bold text-slate-500">
                            © 2026 <span className="font-extrabold text-slate-700">LIKEFOOD</span>. All rights reserved.
                        </p>
                        <div className="flex items-center gap-3 flex-wrap justify-center text-[11px] text-slate-400">
                            <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /><span>{t("footer.qualityStandard")}</span></div>
                            <div className="w-px h-3 bg-slate-200" />
                            <div className="flex items-center gap-1"><Truck className="w-3 h-3 text-sky-500" /><span>{t("footer.shipNationwide")}</span></div>
                            <div className="w-px h-3 bg-slate-200" />
                            <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-primary" /><span>{t("footer.quickSupport")}</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/policies/privacy" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">{t("footer.privacy")}</Link>
                            <Link href="/policies/terms" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">{t("footer.terms")}</Link>
                        </div>
                    </div>
                </div>
            </div>

        </footer>
    );
}
