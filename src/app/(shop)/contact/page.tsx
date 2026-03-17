"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, Clock, Facebook, Instagram, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { CaptchaField } from "@/components/auth/CaptchaField";
import { useLanguage } from "@/lib/i18n/context";

const baseContactInfo = [
    {
        icon: Phone,
        title: "Điện thoại",
        value: "+1 402-315-8105",
        link: "tel:+14023158105",
        color: "from-blue-500 to-cyan-500",
        key: "SITE_SUPPORT_PHONE",
    },
    {
        icon: Mail,
        title: "Email",
        value: "tranquocvu3011@gmail.com",
        link: "mailto:tranquocvu3011@gmail.com",
        color: "from-green-500 to-emerald-500",
        key: "SITE_SUPPORT_EMAIL",
    },
    {
        icon: MapPin,
        title: "Địa chỉ",
        value: "Omaha, NE 68136, United States",
        link: "#map",
        color: "from-orange-500 to-amber-500",
        key: "SITE_ADDRESS",
    },
    {
        icon: Clock,
        title: "Giờ làm việc",
        value: "24/7 - Luôn sẵn sàng hỗ trợ",
        link: null,
        color: "from-purple-500 to-pink-500",
        key: "STAT_SUPPORT_TEXT",
    },
];

const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://www.facebook.com/profile.php?id=100076170558548", color: "bg-blue-600", key: "FACEBOOK_URL" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/likefood", color: "bg-gradient-to-br from-purple-600 to-pink-500", key: "INSTAGRAM_URL" },
];

export default function ContactPage() {
    const { t, isVietnamese } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [contactData, setContactData] = useState(baseContactInfo);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [dynamicSocialLinks, setDynamicSocialLinks] = useState(socialLinks);
    const [dynamicAddress, setDynamicAddress] = useState("Omaha, NE 68136, United States");

    const localizedContactInfo = [
        {
            ...contactData[0],
            title: t("contact.phone"),
        },
        {
            ...contactData[1],
            title: t("contact.email"),
        },
        {
            ...contactData[2],
            title: t("contact.address"),
        },
        {
            ...contactData[3],
            title: t("contact.workingHours"),
            value: contactData[3]?.value === baseContactInfo[3].value ? t("contact.workingHoursValue") : contactData[3]?.value,
        },
    ];

    const localizedFaqs = [
        { question: t("contact.faq1Q"), answer: t("contact.faq1A") },
        { question: t("contact.faq2Q"), answer: t("contact.faq2A") },
        { question: t("contact.faq3Q"), answer: t("contact.faq3A") },
    ];

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch("/api/public/settings");
                if (!res.ok) return;
                const data = await res.json();
                setContactData(
                    baseContactInfo.map((info) => {
                        const raw = data[info.key];
                        if (!raw) return info;
                        if (info.key === "SITE_SUPPORT_PHONE") {
                            const tel = raw.replace(/[^0-9+]/g, "");
                            return { ...info, value: raw, link: `tel:${tel}` };
                        }
                        if (info.key === "SITE_SUPPORT_EMAIL") {
                            return { ...info, value: raw, link: `mailto:${raw}` };
                        }
                        return { ...info, value: raw };
                    })
                );
                // Update social links dynamically
                setDynamicSocialLinks(
                    socialLinks.map((link) => {
                        const url = data[link.key];
                        return url ? { ...link, href: url } : link;
                    }).filter(link => link.href)
                );
                // Update address for map
                if (data.SITE_ADDRESS) {
                    setDynamicAddress(data.SITE_ADDRESS);
                }
            } catch {
                // ignore
            }
        };
        loadSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setIsSuccess(false);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, turnstileToken }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                });
                setTimeout(() => setIsSuccess(false), 5000);
            } else {
                toast.error(data.error || (isVietnamese ? "Đã có lỗi xảy ra. Vui lòng thử lại." : "An error occurred. Please try again."));
            }
        } catch (error) {
            logger.error("Contact form error", error as Error, { context: 'contact-page' });
            toast.error(isVietnamese ? "Không thể gửi tin nhắn. Vui lòng thử lại sau." : "Unable to send message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50/50 via-white to-blue-50/50">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10" />
                <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-300/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-[150px]" />

                <div className="relative page-container-wide py-6 lg:py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 rounded-full mb-6">
                            <Sparkles className="w-4 h-4 text-cyan-600" />
                            <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">{t("contact.title")}</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-3 sm:mb-4">
                            {t("contact.subtitle").split(" ").slice(0, -2).join(" ")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500">{t("contact.subtitle").split(" ").slice(-2).join(" ")}</span>
                        </h1>
                        <p className="text-sm sm:text-lg text-slate-500 font-medium">
                            {t("contact.description")}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Cards */}
            <section className="relative -mt-8 z-10">
                <div className="page-container-wide">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                        {localizedContactInfo.map((info, index) => (
                            <motion.a
                                key={info.key}
                                href={info.link || undefined}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`block bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-100 hover:shadow-2xl transition-all group ${info.link ? 'cursor-pointer' : ''}`}
                            >
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <info.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{info.title}</div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed break-all sm:break-normal">{info.value}</div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <div className="page-container-wide">
                    <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shadow-slate-100 p-5 sm:p-8 lg:p-12"
                            >
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                                    {t("contact.sendMessage")}
                                </h2>
                                <p className="text-slate-500 font-medium mb-8">
                                    {t("contact.sendMessageDesc")}
                                </p>

                                {isSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-green-700 font-bold">{t("contact.successTitle")}</p>
                                            <p className="text-green-600 text-sm">{t("contact.successDesc")}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="contact-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {t("contact.fullName")} *
                                            </label>
                                            <input
                                                id="contact-name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
                                                placeholder={isVietnamese ? "Nguyễn Văn A" : "John Doe"}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="contact-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {t("contact.email")} *
                                            </label>
                                            <input
                                                id="contact-email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="contact-phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {t("contact.phoneNumber")}
                                            </label>
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
                                                placeholder="+1 (555) 123-4567"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="contact-subject" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {t("contact.subject")} *
                                            </label>
                                            <input
                                                id="contact-subject"
                                                type="text"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
                                                placeholder={isVietnamese ? "Câu hỏi về sản phẩm" : "Question about product"}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="contact-message" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {t("contact.message")} *
                                        </label>
                                        <textarea
                                            id="contact-message"
                                            required
                                            rows={5}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm resize-none"
                                            placeholder={t("contact.messagePlaceholder")}
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting || !isCaptchaValid}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black uppercase tracking-widest shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t("contact.sending")}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                {t("contact.sendBtn")}
                                            </>
                                        )}
                                    </motion.button>
                                    <div className="pt-4">
                                        <CaptchaField onToken={setTurnstileToken} onValidChange={setIsCaptchaValid} />
                                    </div>
                                </form>
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Map */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                id="map"
                                className="bg-white rounded-3xl shadow-xl overflow-hidden"
                            >
                            <iframe
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(dynamicAddress)}&output=embed`}
                                    title={isVietnamese ? "Bản đồ văn phòng LIKEFOOD" : "LIKEFOOD office map"}
                                    width="100%"
                                    height="300"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full"
                                />
                                <div className="p-5">
                                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        {dynamicAddress}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Social Links */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-3xl shadow-xl p-6"
                            >
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">{t("contact.connectWithUs")}</h3>
                                <div className="flex gap-3">
                                    {dynamicSocialLinks.map((social) => (
                                        <a
                                            key={social.name}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-12 h-12 ${social.color} rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg`}
                                        >
                                            <social.icon className="w-5 h-5" />
                                        </a>
                                    ))}
                                </div>
                            </motion.div>

                            {/* FAQ */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-3xl shadow-xl p-6"
                            >
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">{t("contact.faqTitle")}</h3>
                                <div className="space-y-4">
                                    {localizedFaqs.map((faq, index) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-2xl">
                                            <h4 className="text-sm font-bold text-slate-900 mb-1">{faq.question}</h4>
                                            <p className="text-xs text-slate-500">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/policies/shipping" className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                                    {t("contact.seeMorePolicies")}
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
