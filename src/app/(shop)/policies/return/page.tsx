/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Return Policy Page - Premium Design
 */

import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getContactInfo } from "@/lib/contact-info";

export const revalidate = 86400;

type Locale = "vi" | "en";

const RETURN_COPY: Record<Locale, {
    title: string;
    metaDesc: string;
    heroTitle: string;
    heroDesc: string;
    breadcrumbHome: string;
    breadcrumbPolicies: string;
    breadcrumbReturn: string;
    updated: string;
    intro: string;
    qualityTitle: string;
    qualityContent: string;
    eligibleTitle: string;
    eligibleCases: { text: string; icon: string }[];
    notEligibleTitle: string;
    notEligibleCases: string[];
    processTitle: string;
    processSteps: { step: string; title: string; desc: string; icon: string }[];
    warningTitle: string;
    warningContent: string;
    refundTitle: string;
    refundContent: string[];
    commitmentTitle: string;
    commitments: { text: string; icon: string }[];
    contactTitle: string;
    hotline: string;
    backHome: string;
    gotoShipping: string;
    gotoPrivacy: string;
}> = {
    vi: {
        title: "Chính Sách Đổi Trả | LIKEFOOD",
        metaDesc: "Chính sách đổi trả sản phẩm LIKEFOOD - Cam kết chất lượng, hỗ trợ khách hàng 24/7.",
        heroTitle: "Chính Sách Đổi Trả",
        heroDesc: "Quyền lợi của khách hàng luôn được đặt lên hàng đầu. LIKEFOOD cam kết hỗ trợ nhanh chóng và minh bạch trong mọi trường hợp đổi trả.",
        breadcrumbHome: "Trang chủ",
        breadcrumbPolicies: "Chính sách",
        breadcrumbReturn: "Đổi trả",
        updated: "Ngày cập nhật hiệu lực:",
        intro: "Vì đặc thù sản phẩm là thực phẩm, LIKEFOOD luôn đặt tiêu chí an toàn và chất lượng lên hàng đầu. Chúng tôi cam kết sản phẩm đến tay bạn đạt chuẩn và đúng mô tả.",
        qualityTitle: "1. Cam kết chất lượng",
        qualityContent: "Mọi sản phẩm tại LIKEFOOD đều được kiểm tra chất lượng nghiêm ngặt trước khi đóng gói và giao đến tay khách hàng. Chúng tôi đảm bảo sản phẩm đạt chuẩn vệ sinh an toàn thực phẩm và đúng với mô tả trên website.",
        eligibleTitle: "2. Trường hợp được đổi trả",
        eligibleCases: [
            { text: "Sản phẩm bị lỗi do nhà sản xuất (hư hỏng bao bì, hết hạn sử dụng)", icon: "📦" },
            { text: "Sản phẩm bị biến chất, hư hỏng trong quá trình vận chuyển", icon: "🚚" },
            { text: "Giao sai loại sản phẩm hoặc thiếu số lượng so với đơn hàng", icon: "❌" },
            { text: "Sản phẩm không khớp mô tả trên website (hình ảnh, thành phần, trọng lượng)", icon: "📋" },
        ],
        notEligibleTitle: "3. Trường hợp không áp dụng đổi trả",
        notEligibleCases: [
            "Không hợp khẩu vị cá nhân - vì đây là yếu tố chủ quan",
            "Sản phẩm đã mở bao bì và sử dụng quá 10%",
            "Yêu cầu đổi trả sau 48 giờ kể từ khi nhận hàng",
            "Sản phẩm bị hư hỏng do lỗi bảo quản của khách hàng",
        ],
        processTitle: "4. Quy trình đổi trả",
        processSteps: [
            { step: "B1", title: "Liên hệ", desc: "Liên hệ LIKEFOOD trong vòng 48 giờ kể từ khi nhận hàng kèm hình ảnh/video mở hộp", icon: "📱" },
            { step: "B2", title: "Xác nhận", desc: "Đội ngũ LIKEFOOD kiểm tra và xác nhận yêu cầu đổi trả trong vòng 24 giờ", icon: "✅" },
            { step: "B3", title: "Xử lý", desc: "Hoàn tiền về phương thức thanh toán gốc hoặc gửi bù sản phẩm thay thế", icon: "💳" },
        ],
        warningTitle: "Lưu ý quan trọng",
        warningContent: "Vui lòng giữ nguyên sản phẩm và bao bì cho đến khi yêu cầu đổi trả được xác nhận. Video mở hộp là bằng chứng quan trọng để chúng tôi xử lý nhanh nhất.",
        refundTitle: "5. Phương thức hoàn tiền",
        refundContent: [
            "Hoàn tiền qua phương thức thanh toán gốc (thẻ tín dụng, Stripe) trong vòng 5-7 ngày làm việc.",
            "Đối với các trường hợp giao sai hoặc thiếu, LIKEFOOD sẽ gửi bù sản phẩm miễn phí phí vận chuyển.",
            "Khách hàng cũng có thể chọn nhận LIKEFOOD Xu tương ứng để sử dụng cho lần mua sau.",
        ],
        commitmentTitle: "Cam kết của LIKEFOOD",
        commitments: [
            { text: "Quyền lợi khách hàng luôn được ưu tiên hàng đầu", icon: "🛡️" },
            { text: "Xử lý yêu cầu đổi trả trong vòng 24 giờ", icon: "⏱️" },
            { text: "Minh bạch và công bằng trong mọi trường hợp", icon: "⚖️" },
            { text: "Hỗ trợ khách hàng 24/7 qua mọi kênh liên lạc", icon: "💬" },
        ],
        contactTitle: "Hệ thống đặc sản LIKEFOOD",
        hotline: "Hotline hỗ trợ 24/7",
        backHome: "Quay lại trang chủ",
        gotoShipping: "Chính sách vận chuyển",
        gotoPrivacy: "Chính sách bảo mật",
    },
    en: {
        title: "Return Policy | LIKEFOOD",
        metaDesc: "LIKEFOOD return policy - Quality commitment, 24/7 customer support.",
        heroTitle: "Return Policy",
        heroDesc: "Customer rights always come first. LIKEFOOD is committed to fast and transparent support for all return cases.",
        breadcrumbHome: "Home",
        breadcrumbPolicies: "Policies",
        breadcrumbReturn: "Returns",
        updated: "Effective update date:",
        intro: "Because our products are food items, LIKEFOOD prioritizes safety and quality above all. We commit that delivered products meet standards and match product descriptions.",
        qualityTitle: "1. Quality commitment",
        qualityContent: "All LIKEFOOD products undergo strict quality inspection before packaging and delivery. We ensure products meet food safety standards and match the descriptions on our website.",
        eligibleTitle: "2. Eligible return cases",
        eligibleCases: [
            { text: "Product defects from manufacturing (damaged packaging, expired items)", icon: "📦" },
            { text: "Product quality damaged during shipping", icon: "🚚" },
            { text: "Incorrect item delivered or missing quantity versus order", icon: "❌" },
            { text: "Product doesn't match website description (images, ingredients, weight)", icon: "📋" },
        ],
        notEligibleTitle: "3. Non-eligible return cases",
        notEligibleCases: [
            "Personal taste preference - as this is a subjective factor",
            "Products already opened and used beyond 10%",
            "Return requests made after 48 hours from delivery",
            "Products damaged due to customer's improper storage",
        ],
        processTitle: "4. Return process",
        processSteps: [
            { step: "S1", title: "Contact", desc: "Contact LIKEFOOD within 48 hours of delivery with unboxing photos/videos", icon: "📱" },
            { step: "S2", title: "Confirm", desc: "LIKEFOOD team reviews and confirms return request within 24 hours", icon: "✅" },
            { step: "S3", title: "Process", desc: "Refund to original payment method or send replacement product", icon: "💳" },
        ],
        warningTitle: "Important notice",
        warningContent: "Please keep the product and packaging intact until the return request is confirmed. Unboxing video is important evidence for us to process quickly.",
        refundTitle: "5. Refund methods",
        refundContent: [
            "Refund via original payment method (credit card, Stripe) within 5-7 business days.",
            "For cases of wrong or missing items, LIKEFOOD will send replacement products with free shipping.",
            "Customers can also choose to receive equivalent LIKEFOOD Xu points for future purchases.",
        ],
        commitmentTitle: "LIKEFOOD's commitments",
        commitments: [
            { text: "Customer rights are always our top priority", icon: "🛡️" },
            { text: "Process return requests within 24 hours", icon: "⏱️" },
            { text: "Transparent and fair in all cases", icon: "⚖️" },
            { text: "24/7 customer support via all contact channels", icon: "💬" },
        ],
        contactTitle: "LIKEFOOD Specialty Marketplace",
        hotline: "24/7 support hotline",
        backHome: "Back to home",
        gotoShipping: "Shipping policy",
        gotoPrivacy: "Privacy policy",
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale: Locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = RETURN_COPY[locale];

    return {
        title: copy.title,
        description: copy.metaDesc,
        alternates: {
            canonical: "/policies/return",
            languages: {
                'vi': '/policies/return?lang=vi',
                'en': '/policies/return?lang=en',
                'x-default': '/policies/return',
            },
        },
    };
}

export default async function ReturnPolicyPage() {
    const cookieStore = await cookies();
    const locale: Locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = RETURN_COPY[locale];
    const contact = await getContactInfo();

    return (
        <div className="min-h-screen bg-[#fdfdff] pb-20">
            <div className="page-container-wide">
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden bg-primary px-8 py-16 text-center">
                        <div className="absolute inset-0 bg-[url('/pattern-light.svg')] opacity-10" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
                        <div className="relative z-10">
                            {/* Breadcrumb */}
                            <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/60 mb-8">
                                <Link href="/" className="hover:text-white transition-colors">{copy.breadcrumbHome}</Link>
                                <span className="text-primary-foreground/40">/</span>
                                <span>{copy.breadcrumbPolicies}</span>
                                <span className="text-primary-foreground/40">/</span>
                                <span className="text-white font-bold">{copy.breadcrumbReturn}</span>
                            </div>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                <span className="text-3xl">🔄</span>
                            </div>
                            <h1 className="mb-4 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
                                {copy.heroTitle}
                            </h1>
                            <p className="mx-auto max-w-2xl text-base font-medium text-primary-foreground/80 md:text-lg">
                                {copy.heroDesc}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12 lg:p-16">
                        <p className="mb-10 text-lg font-medium text-slate-600">
                            {copy.updated} <strong>01/01/2026</strong>.
                            <br />
                            {copy.intro}
                        </p>

                        {/* Quality Commitment */}
                        <section className="mb-10 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="text-2xl">🏆</span>
                                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{copy.qualityTitle}</h2>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">{copy.qualityContent}</p>
                        </section>

                        {/* Eligible Cases */}
                        <section className="mb-10 rounded-2xl border border-green-100 bg-green-50/30 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">✅</span>
                                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{copy.eligibleTitle}</h2>
                            </div>
                            <div className="space-y-4">
                                {copy.eligibleCases.map((c, i) => (
                                    <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm border border-green-100">
                                        <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                                        <span className="text-slate-700 font-medium">{c.text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Not Eligible Cases */}
                        <section className="mb-10 rounded-2xl border border-red-100 bg-red-50/30 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">🚫</span>
                                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{copy.notEligibleTitle}</h2>
                            </div>
                            <div className="space-y-3">
                                {copy.notEligibleCases.map((c, i) => (
                                    <div key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                                        <span className="text-red-400 shrink-0 mt-1">✗</span>
                                        <span>{c}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Return Process Timeline */}
                        <section className="mb-10">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-2xl">📋</span>
                                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{copy.processTitle}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {copy.processSteps.map((step, i) => (
                                    <div key={i} className="relative">
                                        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-lg shadow-slate-100/50 hover:shadow-xl transition-all duration-300">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">{step.icon}</span>
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-primary mb-2">{step.step}</div>
                                            <h3 className="text-lg font-black text-slate-900 mb-2">{step.title}</h3>
                                            <p className="text-sm text-slate-500 font-medium">{step.desc}</p>
                                        </div>
                                        {i < copy.processSteps.length - 1 && (
                                            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-200 text-xl">→</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Warning */}
                        <div className="mb-10 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4 items-start">
                            <span className="text-2xl shrink-0">⚠️</span>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-orange-800 mb-2">{copy.warningTitle}</h3>
                                <p className="text-sm font-bold text-orange-700">{copy.warningContent}</p>
                            </div>
                        </div>

                        {/* Refund Methods */}
                        <section className="mb-10 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="text-2xl">💳</span>
                                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{copy.refundTitle}</h2>
                            </div>
                            <div className="space-y-3 text-slate-600 font-medium leading-relaxed">
                                {copy.refundContent.map((p, i) => (
                                    <p key={i}>• {p}</p>
                                ))}
                            </div>
                        </section>

                        {/* Commitments */}
                        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8">
                            <h2 className="text-xl font-black tracking-tight text-slate-900 mb-6 text-center">
                                {copy.commitmentTitle}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {copy.commitments.map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                                        <span className="text-xl">{c.icon}</span>
                                        <span className="text-sm font-bold text-slate-700">{c.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="not-prose mt-12 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                            <h3 className="text-lg font-black uppercase tracking-wide text-slate-800">{copy.contactTitle}</h3>
                            <div className="flex items-start gap-4 font-medium text-slate-600">
                                <span className="text-primary">📍</span>
                                <p>{contact.address}</p>
                            </div>
                            <div className="flex items-center gap-4 font-medium text-slate-600">
                                <span className="text-primary">📞</span>
                                <p>{contact.phone} ({copy.hotline})</p>
                            </div>
                            <div className="flex items-center gap-4 font-medium text-slate-600">
                                <span className="text-primary">✉️</span>
                                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-primary">{contact.email}</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cross Navigation */}
                <div className="mt-8 flex items-center justify-center gap-4 text-center flex-wrap">
                    <Link href="/">
                        <Button variant="ghost" className="h-12 rounded-2xl px-6 font-bold text-slate-500 hover:bg-slate-200">
                            {copy.backHome}
                        </Button>
                    </Link>
                    <Link href="/policies/shipping">
                        <Button variant="outline" className="h-12 rounded-2xl border-primary/20 px-6 font-bold text-primary hover:bg-primary/5">
                            {copy.gotoShipping}
                        </Button>
                    </Link>
                    <Link href="/policies/privacy">
                        <Button variant="outline" className="h-12 rounded-2xl border-primary/20 px-6 font-bold text-primary hover:bg-primary/5">
                            {copy.gotoPrivacy}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
