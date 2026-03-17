"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bot,
    ChevronDown,
    ChevronRight,
    HelpCircle,
    Mail,
    MessageCircle,
    Search,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

interface FAQItem {
    category: string;
    question: string;
    answer: string;
}

const FAQ_DATA: Record<"vi" | "en", FAQItem[]> = {
    vi: [
        {
            category: "Đặt hàng",
            question: "Tôi có thể mua hàng mà không cần tài khoản không?",
            answer:
                "Có. Bạn có thể checkout với tư cách khách vãng lai. Tuy nhiên, tài khoản sẽ giúp theo dõi đơn hàng, lưu địa chỉ, nhận voucher và dùng điểm LIKEFOOD Xu thuận tiện hơn.",
        },
        {
            category: "Đặt hàng",
            question: "Làm sao để theo dõi đơn hàng sau khi mua?",
            answer:
                "Sau khi đặt hàng thành công, bạn có thể vào Tài khoản > Đơn hàng để xem trạng thái xử lý, tiến trình giao hàng và mã vận đơn khi hệ thống đã cập nhật.",
        },
        {
            category: "Vận chuyển",
            question: "LIKEFOOD giao hàng tới khu vực nào?",
            answer:
                "LIKEFOOD phục vụ toàn nước Mỹ. Thời gian nhận hàng phụ thuộc khu vực và phương thức vận chuyển mà bạn chọn trong lúc thanh toán.",
        },
        {
            category: "Vận chuyển",
            question: "Khi nào tôi được miễn phí vận chuyển?",
            answer:
                "Đơn hàng từ $500 sẽ được miễn phí vận chuyển. Với đơn thấp hơn mốc này, phí giao hàng sẽ được tính rõ ở bước checkout theo phương thức bạn chọn.",
        },
        {
            category: "Thanh toán",
            question: "LIKEFOOD hỗ trợ những phương thức thanh toán nào?",
            answer:
                "Hệ thống hiện hỗ trợ COD, chuyển khoản ngân hàng, thẻ và một số cổng thanh toán trực tuyến. Những lựa chọn đang khả dụng sẽ xuất hiện ngay tại bước thanh toán.",
        },
        {
            category: "Thanh toán",
            question: "Thông tin thanh toán có an toàn không?",
            answer:
                "Có. Thanh toán được xử lý qua các cổng phù hợp, đồng thời website áp dụng các lớp bảo vệ phiên, request và dữ liệu để giảm rủi ro trong quá trình giao dịch.",
        },
        {
            category: "Đổi trả",
            question: "Khi nào tôi có thể yêu cầu đổi trả hoặc hoàn tiền?",
            answer:
                "Bạn có thể gửi yêu cầu khi sản phẩm bị lỗi, giao sai hoặc không đúng mô tả. Với các đơn đủ điều kiện, yêu cầu hoàn tiền cũng có thể được gửi trực tiếp từ chi tiết đơn hàng.",
        },
        {
            category: "Sản phẩm",
            question: "Làm sao biết sản phẩm còn hàng?",
            answer:
                "Trang sản phẩm sẽ hiển thị tình trạng còn hàng hoặc biến thể khả dụng. Nếu một phiên bản hết hàng, bạn vẫn có thể xem lựa chọn khác hoặc quay lại sau khi hệ thống cập nhật tồn kho.",
        },
        {
            category: "Tài khoản",
            question: "LIKEFOOD Xu dùng để làm gì?",
            answer:
                "LIKEFOOD Xu là điểm thưởng tích lũy khi bạn tương tác và mua sắm. Bạn có thể dùng điểm ở bước thanh toán để giảm giá đơn hàng khi tài khoản đủ điều kiện.",
        },
    ],
    en: [
        {
            category: "Ordering",
            question: "Can I check out without creating an account?",
            answer:
                "Yes. Guest checkout is available. Creating an account simply makes it easier to track orders, save addresses, collect vouchers, and use reward points later.",
        },
        {
            category: "Ordering",
            question: "How do I track an order after purchase?",
            answer:
                "After placing an order, open Account > Orders to review the current status, processing timeline, and tracking code once shipping information is available.",
        },
        {
            category: "Shipping",
            question: "Where does LIKEFOOD ship?",
            answer:
                "LIKEFOOD serves customers across the United States. Delivery time depends on your destination and the shipping method selected during checkout.",
        },
        {
            category: "Shipping",
            question: "When do I qualify for free shipping?",
            answer:
                "Orders from $500 qualify for free shipping. For smaller orders, the checkout page will show the exact shipping cost based on the selected delivery option.",
        },
        {
            category: "Payments",
            question: "What payment methods are available?",
            answer:
                "Available options may include cash on delivery, bank transfer, cards, and selected online payment methods. The checkout step will show the methods currently supported for your order.",
        },
        {
            category: "Payments",
            question: "Is payment information secure?",
            answer:
                "Yes. The site uses layered protections for sessions, requests, and payment handling to keep checkout safer and more reliable.",
        },
        {
            category: "Returns",
            question: "When can I request a return or refund?",
            answer:
                "You can submit a request if a product is damaged, incorrect, or not as described. Eligible paid orders may also show a refund action inside the order detail page.",
        },
        {
            category: "Products",
            question: "How can I tell if a product is in stock?",
            answer:
                "Each product page shows the available inventory state or active variants. If one option is unavailable, you can still review other variants or check back later.",
        },
        {
            category: "Account",
            question: "What are LIKEFOOD points used for?",
            answer:
                "LIKEFOOD points are reward points earned through activity and purchases. Eligible accounts can redeem points during checkout for order discounts.",
        },
    ],
};

export function FAQContent() {
    const { language } = useLanguage();
    const locale = language === "vi" ? "vi" : "en";
    const faqs = FAQ_DATA[locale];
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>(faqs[0]?.category || "");
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
    const [supportEmail, setSupportEmail] = useState("tranquocvu3011@gmail.com");

    useEffect(() => {
        const load = async () => {
            try {
                const { getPublicSettings } = await import("@/lib/public-settings");
                const data = await getPublicSettings();
                if (data.SITE_SUPPORT_EMAIL) setSupportEmail(data.SITE_SUPPORT_EMAIL);
            } catch { /* keep default */ }
        };
        load();
    }, []);

    const filteredFaqs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return faqs;
        }

        return faqs.filter((faq) => {
            return faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
        });
    }, [faqs, searchQuery]);

    const categories = useMemo(() => [...new Set(filteredFaqs.map((faq) => faq.category))], [filteredFaqs]);

    const currentCategory = categories.includes(activeCategory) ? activeCategory : categories[0] || "";
    const visibleFaqs = filteredFaqs.filter((faq) => !currentCategory || faq.category === currentCategory);

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f4_100%)] pt-6 pb-20">
            <div className="page-container-wide space-y-10">
                <section className="overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                    <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-10">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary">
                                <HelpCircle className="h-4 w-4" />
                                {locale === "vi" ? "Trung tâm hỗ trợ" : "Support hub"}
                            </div>
                            <div className="space-y-3">
                                <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tight text-slate-950 lg:text-5xl">
                                    {locale === "vi" ? "Câu hỏi thường gặp được sắp lại rõ ràng hơn" : "Frequently asked questions, organized to be easier to scan"}
                                </h1>
                                <p className="max-w-2xl text-base leading-7 text-slate-600 lg:text-lg">
                                    {locale === "vi"
                                        ? "Từ vận chuyển, thanh toán đến theo dõi đơn hàng, mọi câu trả lời quan trọng đều được gom lại theo chủ đề để bạn tìm nhanh hơn."
                                        : "From shipping and payment to order tracking, the most important answers are grouped by topic so you can find them faster."}
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {[
                                {
                                    title: locale === "vi" ? "Tra cứu nhanh" : "Fast lookup",
                                    text: locale === "vi" ? "Tìm câu trả lời theo từ khóa hoặc theo nhóm vấn đề." : "Search by keyword or browse by topic.",
                                },
                                {
                                    title: locale === "vi" ? "Có hỗ trợ trực tiếp" : "Live support",
                                    text: locale === "vi" ? "Nếu chưa thấy câu trả lời, nhấn nút chat ở góc phải để được hỗ trợ nhanh." : "If you still need help, click the chat button in the corner for quick support.",
                                },
                                {
                                    title: locale === "vi" ? "Ưu tiên rõ ràng" : "Clear next step",
                                    text: locale === "vi" ? "Mỗi câu trả lời đều hướng bạn đến thao tác hoặc trang phù hợp." : "Each answer points you toward the right next action.",
                                },
                            ].map((item) => (
                                <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{item.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
                        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                            <label className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                                {locale === "vi" ? "Tìm nhanh" : "Quick search"}
                            </label>
                            <div className="relative mt-3">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder={locale === "vi" ? "Ví dụ: freeship, hoàn tiền, COD" : "Example: shipping, refund, COD"}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/35 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                                {locale === "vi" ? "Danh mục" : "Categories"}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setActiveCategory(category);
                                            setExpandedQuestion(0);
                                        }}
                                        className={[
                                            "rounded-full border px-4 py-2 text-sm font-bold transition lg:justify-start lg:rounded-2xl lg:px-4 lg:py-3 lg:text-left",
                                            currentCategory === category
                                                ? "border-primary/30 bg-primary text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/25 hover:text-primary",
                                        ].join(" ")}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-4">
                        {visibleFaqs.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                                <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
                                <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
                                    {locale === "vi" ? "Chưa tìm thấy câu trả lời phù hợp" : "No matching answer found"}
                                </h2>
                                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                    {locale === "vi"
                                        ? "Bạn thử đổi từ khóa khác hoặc liên hệ trực tiếp để được hỗ trợ cụ thể hơn."
                                        : "Try another keyword or contact us directly for more specific help."}
                                </p>
                            </div>
                        ) : (
                            visibleFaqs.map((faq, index) => (
                                <FAQItemCard
                                    key={`${faq.category}-${faq.question}`}
                                    faq={faq}
                                    isOpen={expandedQuestion === index}
                                    onToggle={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                                />
                            ))
                        )}

                        <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#134e4a_100%)] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.14)] lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                                    {locale === "vi" ? "Cần hỗ trợ thêm" : "Need more help"}
                                </p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight">
                                    {locale === "vi" ? "Vẫn chưa tìm được câu trả lời?" : "Still haven't found your answer?"}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                                    {locale === "vi"
                                        ? "FAQ phù hợp khi bạn cần câu trả lời chuẩn hóa. Nếu nhu cầu của bạn cụ thể hơn, hãy nhấn nút chat ở góc màn hình hoặc vào trang liên hệ."
                                        : "FAQ works best for standard questions. For more specific help, click the chat button in the corner or go to the contact page."}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-white/90"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    {locale === "vi" ? "Liên hệ hỗ trợ" : "Contact support"}
                                </Link>
                                <a
                                    href={`mailto:${supportEmail}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                                >
                                    <Mail className="h-4 w-4" />
                                    Email
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function FAQItemCard({
    faq,
    isOpen,
    onToggle,
}: {
    faq: FAQItem;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <button
                onClick={onToggle}
                className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
            >
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{faq.category}</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">{faq.question}</h3>
                </div>
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-slate-100 px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">
                            <div className="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
