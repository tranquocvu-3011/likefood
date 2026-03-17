/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { ShieldCheck, Mail, MapPin, Phone, Scale } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { getContactInfo } from "@/lib/contact-info";

export const revalidate = 86400; // 24 hours for static content

const PRIVACY_COPY = {
    vi: {
        title: "Chính Sách Bảo Mật | LIKEFOOD",
        description: "Chính sách bảo mật thông tin và quyền riêng tư của khách hàng tại LIKEFOOD.",
        heroTitle: "Chính Sách Bảo Mật",
        heroDesc: "Quyền riêng tư và an toàn dữ liệu của bạn là ưu tiên hàng đầu tại LIKEFOOD. Dưới đây là cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.",
        updated: "Ngày cập nhật hiệu lực:",
        intro: "Chào mừng bạn đến với LIKEFOOD. Việc bạn truy cập và sử dụng website đồng nghĩa với việc bạn đồng ý với các điều khoản bảo mật dưới đây.",
        sections: [
            {
                heading: "1. Mục đích và phạm vi thu thập thông tin",
                paragraphs: [
                    "LIKEFOOD không bán, chia sẻ hay trao đổi thông tin cá nhân của khách hàng cho bên thứ ba không liên quan.",
                    "Thông tin thu thập được sử dụng nội bộ để xử lý đơn hàng, chăm sóc khách hàng và cải thiện trải nghiệm mua sắm.",
                ],
                bullets: [
                    "Họ và tên",
                    "Địa chỉ email",
                    "Số điện thoại",
                    "Địa chỉ giao hàng",
                ],
            },
            {
                heading: "2. Phạm vi sử dụng thông tin",
                paragraphs: [
                    "Dữ liệu chỉ được dùng cho các mục đích vận hành đơn hàng, hỗ trợ sau bán và thông báo liên quan đến giao dịch.",
                    "Trong trường hợp cần giao hàng, thông tin liên hệ và địa chỉ có thể được chia sẻ với đơn vị vận chuyển.",
                ],
            },
            {
                heading: "3. Thời gian lưu trữ thông tin",
                paragraphs: [
                    "Dữ liệu cá nhân được lưu trữ cho đến khi khách hàng yêu cầu xóa hoặc tự thực hiện xóa tài khoản.",
                    "Tài khoản đóng sẽ được xử lý xóa dữ liệu vĩnh viễn theo quy trình nội bộ và quy định pháp lý hiện hành.",
                ],
            },
            {
                heading: "4. Quyền của người dùng",
                paragraphs: [
                    "Khách hàng có quyền truy cập, cập nhật, điều chỉnh hoặc yêu cầu xóa thông tin cá nhân.",
                    "Các thao tác nhạy cảm như đổi email hoặc xóa tài khoản có thể yêu cầu xác thực bổ sung để đảm bảo an toàn.",
                ],
            },
            {
                heading: "5. Bảo mật hệ thống",
                paragraphs: [
                    "Chúng tôi áp dụng các lớp bảo vệ cho phiên đăng nhập, request và xử lý thanh toán để giảm rủi ro.",
                    "Hệ thống được giám sát để phát hiện và ngăn chặn hành vi bất thường, truy cập trái phép hoặc tấn công.",
                ],
            },
            {
                heading: "6. Cập nhật chính sách",
                paragraphs: [
                    "LIKEFOOD có thể cập nhật chính sách theo thay đổi pháp lý hoặc công nghệ.",
                    "Mọi cập nhật sẽ được công bố trên website và có hiệu lực từ thời điểm được nêu rõ.",
                ],
            },
        ],
        contactTitle: "Hệ thống đặc sản LIKEFOOD",
        hotline: "Hotline hỗ trợ 24/7",
        backHome: "Quay lại trang chủ",
        gotoTerms: "Đến Điều Khoản Dịch Vụ",
    },
    en: {
        title: "Privacy Policy | LIKEFOOD",
        description: "How LIKEFOOD collects, uses, and protects customer personal data.",
        heroTitle: "Privacy Policy",
        heroDesc: "Your privacy and data safety are top priorities at LIKEFOOD. This page explains how we protect and use your personal information.",
        updated: "Effective update date:",
        intro: "Welcome to LIKEFOOD. By accessing and using our website, you agree to the privacy terms below.",
        sections: [
            {
                heading: "1. Data collection purpose and scope",
                paragraphs: [
                    "LIKEFOOD does not sell, trade, or share customer personal data with unrelated third parties.",
                    "Collected data is used internally to process orders, support customers, and improve shopping experience.",
                ],
                bullets: [
                    "Full name",
                    "Email address",
                    "Phone number",
                    "Shipping address",
                ],
            },
            {
                heading: "2. Data usage scope",
                paragraphs: [
                    "Data is used only for order operations, after-sales support, and transaction-related notifications.",
                    "When required for delivery, contact details and shipping address may be shared with delivery partners.",
                ],
            },
            {
                heading: "3. Data retention",
                paragraphs: [
                    "Personal data is retained until the customer requests deletion or deletes their account.",
                    "Closed accounts are processed for permanent deletion according to internal procedures and applicable regulations.",
                ],
            },
            {
                heading: "4. User rights",
                paragraphs: [
                    "Customers may access, update, correct, or request deletion of their personal data.",
                    "Sensitive actions such as changing email or deleting account may require additional verification for security.",
                ],
            },
            {
                heading: "5. Platform security",
                paragraphs: [
                    "We apply layered protection for sessions, requests, and payment flows to reduce risk.",
                    "The platform is monitored to detect and block abnormal behavior, unauthorized access, and attacks.",
                ],
            },
            {
                heading: "6. Policy updates",
                paragraphs: [
                    "LIKEFOOD may update this policy to reflect legal or technology changes.",
                    "All updates will be published on our website and become effective as stated.",
                ],
            },
        ],
        contactTitle: "LIKEFOOD Specialty Marketplace",
        hotline: "24/7 support hotline",
        backHome: "Back to home",
        gotoTerms: "Go to Terms of Service",
    },
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = PRIVACY_COPY[locale];

    return {
        title: copy.title,
        description: copy.description,
        alternates: {
            canonical: "/policies/privacy",
            languages: {
                'vi': '/policies/privacy?lang=vi',
                'en': '/policies/privacy?lang=en',
                'x-default': '/policies/privacy',
            },
        },
    };
}

export default async function PrivacyPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = PRIVACY_COPY[locale];
    const contact = await getContactInfo();

    return (
        <div className="min-h-screen bg-[#fdfdff] pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/80">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

                <div className="relative page-container-wide py-6 lg:py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">{locale === "vi" ? "Trang chủ" : "Home"}</Link>
                        <span>/</span>
                        <span className="text-white font-bold">{copy.heroTitle}</span>
                    </div>

                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="mb-4 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl text-center">{copy.heroTitle}</h1>
                    <p className="mx-auto max-w-2xl text-base font-medium text-primary-foreground/80 md:text-lg text-center">{copy.heroDesc}</p>
                </div>
            </div>

            <div className="page-container-wide mt-8">
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl">

                    <div className="prose prose-primary prose-slate max-w-none p-8 md:p-12 lg:p-16 prose-headings:tracking-tight prose-headings:font-black">
                        <p className="mb-8 text-lg font-medium text-slate-600">
                            {copy.updated} <strong>01/01/2026</strong>.
                            <br />
                            {copy.intro}
                        </p>

                        {copy.sections.map((section) => (
                            <section key={section.heading}>
                                <h2>{section.heading}</h2>
                                {section.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                                {section.bullets && (
                                    <ul>
                                        {section.bullets.map((bullet) => (
                                            <li key={bullet}>{bullet}</li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}

                        <div className="not-prose mt-10 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                            <h3 className="text-lg font-black uppercase tracking-wide text-slate-800">{copy.contactTitle}</h3>
                            <div className="flex items-start gap-4 font-medium text-slate-600">
                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <p>{contact.address}</p>
                            </div>
                            <div className="flex items-center gap-4 font-medium text-slate-600">
                                <Phone className="h-5 w-5 shrink-0 text-primary" />
                                <p>{contact.phone} ({copy.hotline})</p>
                            </div>
                            <div className="flex items-center gap-4 font-medium text-slate-600">
                                <Mail className="h-5 w-5 shrink-0 text-primary" />
                                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-primary">{contact.email}</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cross-Navigation */}
                <div className="mt-10 rounded-3xl bg-gradient-to-br from-slate-50 to-primary/5 border border-slate-100 p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">{locale === "vi" ? "Chính sách liên quan" : "Related policies"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/policies/terms" className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <Scale className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{locale === "vi" ? "Điều khoản dịch vụ" : "Terms of Service"}</p>
                            </div>
                        </Link>
                        <Link href="/policies/shipping" className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{locale === "vi" ? "Chính sách vận chuyển" : "Shipping Policy"}</p>
                            </div>
                        </Link>
                        <Link href="/policies/return" className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{locale === "vi" ? "Chính sách đổi trả" : "Return Policy"}</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
