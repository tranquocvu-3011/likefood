/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { Scale, Mail, MapPin, Phone, Info, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { getContactInfo } from "@/lib/contact-info";

export const revalidate = 86400; // 24 hours for static content

const TERMS_COPY = {
    vi: {
        title: "Điều Khoản Dịch Vụ | LIKEFOOD",
        description: "Các điều khoản và quy định khi mua sắm tại LIKEFOOD.",
        heroTitle: "Điều Khoản Dịch Vụ",
        heroDesc: "Quy định và thỏa thuận sử dụng dịch vụ tại LIKEFOOD. Vui lòng đọc kỹ trước khi mua sắm.",
        updated: "Ngày cập nhật hiệu lực:",
        intro: "Khi truy cập, mua sắm và tạo tài khoản tại LIKEFOOD, bạn đồng ý với các điều khoản được nêu bên dưới.",
        sections: [
            {
                heading: "1. Tài khoản và quyền lợi",
                paragraphs: [
                    "Tài khoản hợp lệ giúp bạn theo dõi đơn hàng, quản lý địa chỉ, nhận ưu đãi và tích lũy điểm.",
                    "Người dùng có trách nhiệm bảo mật thông tin đăng nhập và thông báo ngay khi nghi ngờ có truy cập trái phép.",
                ],
            },
            {
                heading: "2. Thanh toán và giao hàng",
                paragraphs: [
                    "Thanh toán được xử lý thông qua các đối tác phù hợp và các lớp bảo vệ giao dịch.",
                    "Thời gian giao hàng phụ thuộc khu vực nhận hàng và phương thức vận chuyển được chọn.",
                ],
            },
            {
                heading: "3. Sở hữu trí tuệ",
                paragraphs: [
                    "Nội dung, giao diện, hình ảnh, thương hiệu và tài nguyên trên LIKEFOOD thuộc quyền sở hữu hợp pháp của chúng tôi hoặc bên cấp phép.",
                    "Mọi hành vi sao chép hoặc sử dụng trái phép đều có thể bị xử lý theo quy định pháp luật.",
                ],
            },
            {
                heading: "4. Xóa tài khoản và dữ liệu",
                paragraphs: [
                    "Khi yêu cầu xóa tài khoản, dữ liệu sẽ được xử lý theo chính sách bảo mật và các nghĩa vụ pháp lý bắt buộc.",
                    "Một số dữ liệu giao dịch có thể được lưu trữ tối thiểu theo quy định kế toán và pháp luật hiện hành.",
                ],
                warningTitle: "Lưu ý quan trọng",
                warningBody: "Hành động xóa tài khoản có thể ảnh hưởng đến lịch sử mua hàng, điểm thưởng và các thông tin liên quan đến hồ sơ khách hàng.",
            },
            {
                heading: "5. Hành vi bị cấm",
                paragraphs: [
                    "Cấm sử dụng bot, spam, tấn công hệ thống, can thiệp trái phép vào dữ liệu hoặc API của nền tảng.",
                    "Mọi hành vi vi phạm có thể bị giới hạn truy cập, tạm khóa hoặc khóa vĩnh viễn tài khoản.",
                ],
            },
            {
                heading: "6. Giải quyết tranh chấp",
                paragraphs: [
                    "Mọi tranh chấp phát sinh sẽ được ưu tiên thương lượng trên tinh thần hợp tác.",
                    "Nếu không đạt được thỏa thuận, tranh chấp sẽ được xử lý theo pháp luật hiện hành và cơ quan tài phán có thẩm quyền.",
                ],
            },
        ],
        contactTitle: "Liên hệ pháp lý LIKEFOOD",
        backHome: "Quay lại trang chủ",
        gotoPrivacy: "Đến Chính Sách Bảo Mật",
    },
    en: {
        title: "Terms of Service | LIKEFOOD",
        description: "Terms and conditions for using LIKEFOOD services.",
        heroTitle: "Terms of Service",
        heroDesc: "Rules and agreements for using LIKEFOOD services. Please review carefully before shopping.",
        updated: "Effective update date:",
        intro: "By accessing, shopping, or creating an account on LIKEFOOD, you agree to the terms below.",
        sections: [
            {
                heading: "1. Account and benefits",
                paragraphs: [
                    "A valid account helps you track orders, manage addresses, receive offers, and earn loyalty points.",
                    "Users are responsible for protecting login credentials and reporting suspected unauthorized access.",
                ],
            },
            {
                heading: "2. Payment and delivery",
                paragraphs: [
                    "Payments are handled through applicable partners and protected transaction layers.",
                    "Delivery timelines depend on destination area and selected shipping option.",
                ],
            },
            {
                heading: "3. Intellectual property",
                paragraphs: [
                    "Content, interface, images, branding, and resources on LIKEFOOD are owned by us or our licensors.",
                    "Unauthorized copying or misuse may be handled under applicable law.",
                ],
            },
            {
                heading: "4. Account deletion and data",
                paragraphs: [
                    "When account deletion is requested, data is processed according to our privacy policy and legal obligations.",
                    "Some transaction records may be retained for minimum periods required by accounting or legal regulations.",
                ],
                warningTitle: "Important notice",
                warningBody: "Deleting an account may impact order history, reward points, and other customer profile data.",
            },
            {
                heading: "5. Prohibited behavior",
                paragraphs: [
                    "Do not use bots, spam, system attacks, unauthorized data access, or API abuse.",
                    "Violations may result in access limits, temporary suspension, or permanent account termination.",
                ],
            },
            {
                heading: "6. Dispute resolution",
                paragraphs: [
                    "Any dispute should first be handled through good-faith negotiation.",
                    "If unresolved, disputes will be handled under applicable law and competent jurisdiction.",
                ],
            },
        ],
        contactTitle: "LIKEFOOD legal contact",
        backHome: "Back to home",
        gotoPrivacy: "Go to Privacy Policy",
    },
} as const;

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = TERMS_COPY[locale];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.vudev.io.vn";

    return {
        title: copy.title,
        description: copy.description,
        alternates: {
            canonical: "/policies/terms",
            languages: {
                'vi': '/policies/terms?lang=vi',
                'en': '/policies/terms?lang=en',
                'x-default': '/policies/terms',
            },
        },
    };
}

export default async function TermsPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = TERMS_COPY[locale];
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
                        <Scale className="h-8 w-8 text-white" />
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
                                {section.warningTitle && (
                                    <div className="not-prose my-6 rounded-2xl border border-red-100 bg-red-50 p-6">
                                        <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-wide text-red-800">
                                            <Info className="h-5 w-5" /> {section.warningTitle}
                                        </h3>
                                        <p className="mt-2 font-medium text-red-700">{section.warningBody}</p>
                                    </div>
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
                                <p>{contact.phone}</p>
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
                        <Link href="/policies/privacy" className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{locale === "vi" ? "Chính sách bảo mật" : "Privacy Policy"}</p>
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
