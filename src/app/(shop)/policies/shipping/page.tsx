/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Shipping Policy Page - Premium Design
 */

import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getContactInfo } from "@/lib/contact-info";

export const revalidate = 3600;

type Locale = "vi" | "en";

const SHIPPING_COPY: Record<Locale, {
    title: string;
    metaDesc: string;
    heroTitle: string;
    heroDesc: string;
    breadcrumbHome: string;
    breadcrumbPolicies: string;
    breadcrumbShipping: string;
    updated: string;
    intro: string;
    sections: {
        heading: string;
        icon: string;
        content: string[];
        highlight?: { label: string; value: string }[];
    }[];
    shippingMethodsTitle: string;
    shippingMethods: { name: string; time: string; desc: string; icon: string }[];
    commitmentTitle: string;
    commitments: { text: string; icon: string }[];
    contactTitle: string;
    hotline: string;
    backHome: string;
    gotoReturn: string;
    gotoTerms: string;
    freeShippingBanner: string;
}> = {
    vi: {
        title: "Chính Sách Vận Chuyển | LIKEFOOD",
        metaDesc: "Chính sách giao hàng của LIKEFOOD - Miễn phí vận chuyển cho đơn từ $500, phạm vi toàn nước Mỹ.",
        heroTitle: "Chính Sách Vận Chuyển",
        heroDesc: "LIKEFOOD cam kết mang đến dịch vụ giao hàng nhanh chóng, an toàn và minh bạch trên toàn nước Mỹ.",
        breadcrumbHome: "Trang chủ",
        breadcrumbPolicies: "Chính sách",
        breadcrumbShipping: "Vận chuyển",
        updated: "Ngày cập nhật hiệu lực:",
        intro: "Chúng tôi hiểu rằng thời gian nhận hàng là yếu tố quan trọng với mọi khách hàng. Dưới đây là toàn bộ thông tin về dịch vụ vận chuyển của LIKEFOOD.",
        sections: [
            {
                heading: "1. Phạm vi giao hàng",
                icon: "🌍",
                content: [
                    "LIKEFOOD hiện phục vụ khách hàng trên toàn nước Mỹ, bao gồm cả 50 tiểu bang.",
                    "Một số khu vực xa hoặc đặc thù (Hawaii, Alaska, các đảo) có thể cần thêm 2-3 ngày làm việc so với tuyến tiêu chuẩn.",
                    "Chúng tôi liên tục mở rộng mạng lưới để phục vụ bạn tốt hơn."
                ],
            },
            {
                heading: "2. Thời gian xử lý",
                icon: "⏱️",
                content: [
                    "Đơn hàng được xác nhận sẽ được đóng gói và chuẩn bị trong vòng 24 giờ làm việc.",
                    "Đơn đặt sau 15:00 (EST) hoặc vào cuối tuần sẽ được xử lý vào ngày làm việc tiếp theo.",
                    "Thời gian giao thực tế phụ thuộc vào phương thức vận chuyển và địa chỉ nhận hàng của bạn."
                ],
            },
            {
                heading: "3. Chi phí vận chuyển",
                icon: "💰",
                content: [
                    "Đơn từ $500 trở lên được MIỄN PHÍ vận chuyển trên toàn quốc.",
                    "Với đơn dưới $500, phí giao hàng sẽ được tính tự động và hiển thị rõ ràng trong bước checkout trước khi bạn xác nhận thanh toán.",
                    "Phí vận chuyển phụ thuộc vào trọng lượng đơn, khoảng cách và phương thức giao hàng được chọn."
                ],
                highlight: [
                    { label: "Miễn phí ship", value: "Đơn từ $500" },
                    { label: "Phí rõ ràng", value: "Hiển thị tại checkout" },
                ],
            },
            {
                heading: "4. Theo dõi đơn hàng",
                icon: "📦",
                content: [
                    "Khi đơn đã được bàn giao cho đơn vị vận chuyển, hệ thống sẽ cập nhật mã vận đơn trong trang chi tiết đơn hàng.",
                    "Bạn có thể theo dõi tiến trình giao nhận realtime tại trang Đơn hàng trong tài khoản cá nhân.",
                    "Email thông báo cũng sẽ được gửi tự động khi trạng thái đơn thay đổi."
                ],
            },
            {
                heading: "5. Đóng gói đặc biệt",
                icon: "🎁",
                content: [
                    "Sản phẩm thực phẩm đặc sản được đóng gói cẩn thận với bao bì chuyên dụng, đảm bảo an toàn vệ sinh thực phẩm.",
                    "Các sản phẩm nhạy cảm với nhiệt độ sẽ được đóng gói kèm túi giữ nhiệt hoặc đá khô khi cần thiết.",
                    "Mỗi đơn hàng đều kèm hóa đơn và hướng dẫn bảo quản sản phẩm."
                ],
            },
        ],
        shippingMethodsTitle: "Phương thức vận chuyển",
        shippingMethods: [
            { name: "Tiêu chuẩn", time: "5-7 ngày làm việc", desc: "Phù hợp cho các đơn thông thường, tiết kiệm chi phí", icon: "📬" },
            { name: "Nhanh", time: "2-3 ngày làm việc", desc: "Giao hàng ưu tiên, phù hợp đơn cần gấp", icon: "🚚" },
            { name: "Ưu tiên", time: "1-2 ngày làm việc", desc: "Giao hàng nhanh nhất, đảm bảo đúng hẹn", icon: "⚡" },
        ],
        commitmentTitle: "Cam kết của LIKEFOOD",
        commitments: [
            { text: "Thông tin giao hàng minh bạch, rõ ràng", icon: "✅" },
            { text: "Theo dõi đơn hàng realtime sau khi gửi đi", icon: "📍" },
            { text: "Đóng gói an toàn, bảo đảm chất lượng sản phẩm", icon: "🛡️" },
            { text: "Hỗ trợ khách hàng 24/7 về vấn đề giao hàng", icon: "💬" },
        ],
        contactTitle: "Hệ thống đặc sản LIKEFOOD",
        hotline: "Hotline hỗ trợ 24/7",
        backHome: "Quay lại trang chủ",
        gotoReturn: "Chính sách đổi trả",
        gotoTerms: "Điều khoản dịch vụ",
        freeShippingBanner: "🎉 MIỄN PHÍ vận chuyển cho tất cả đơn hàng từ $500 trở lên!",
    },
    en: {
        title: "Shipping Policy | LIKEFOOD",
        metaDesc: "LIKEFOOD shipping policy - Free shipping for orders over $500, nationwide U.S. delivery.",
        heroTitle: "Shipping Policy",
        heroDesc: "LIKEFOOD is committed to providing fast, safe, and transparent delivery service across the United States.",
        breadcrumbHome: "Home",
        breadcrumbPolicies: "Policies",
        breadcrumbShipping: "Shipping",
        updated: "Effective update date:",
        intro: "We understand that delivery time matters to every customer. Below is all the information about LIKEFOOD's shipping service.",
        sections: [
            {
                heading: "1. Delivery area",
                icon: "🌍",
                content: [
                    "LIKEFOOD currently serves customers across the United States, including all 50 states.",
                    "Some remote or specialty areas (Hawaii, Alaska, islands) may require an additional 2-3 business days compared to standard routes.",
                    "We continuously expand our network to serve you better."
                ],
            },
            {
                heading: "2. Processing time",
                icon: "⏱️",
                content: [
                    "Confirmed orders are packed and prepared within 24 business hours.",
                    "Orders placed after 3:00 PM (EST) or on weekends will be processed the next business day.",
                    "Actual delivery time depends on the shipping method and your delivery address."
                ],
            },
            {
                heading: "3. Shipping cost",
                icon: "💰",
                content: [
                    "Orders of $500 or more qualify for FREE nationwide shipping.",
                    "For orders below $500, shipping fees are automatically calculated and clearly displayed at checkout before you confirm payment.",
                    "Shipping costs depend on order weight, distance, and selected delivery method."
                ],
                highlight: [
                    { label: "Free shipping", value: "Orders $500+" },
                    { label: "Clear pricing", value: "Shown at checkout" },
                ],
            },
            {
                heading: "4. Order tracking",
                icon: "📦",
                content: [
                    "Once the order is handed to the courier, the system will update the tracking number in your order details page.",
                    "You can track delivery progress in real-time on the Orders page in your personal account.",
                    "Email notifications are also sent automatically when your order status changes."
                ],
            },
            {
                heading: "5. Special packaging",
                icon: "🎁",
                content: [
                    "Specialty food products are carefully packed with specialized packaging to ensure food safety and hygiene.",
                    "Temperature-sensitive products are packed with thermal bags or dry ice when necessary.",
                    "Every order includes an invoice and product storage instructions."
                ],
            },
        ],
        shippingMethodsTitle: "Shipping methods",
        shippingMethods: [
            { name: "Standard", time: "5-7 business days", desc: "Suitable for regular orders, cost-effective", icon: "📬" },
            { name: "Express", time: "2-3 business days", desc: "Priority delivery for urgent orders", icon: "🚚" },
            { name: "Priority", time: "1-2 business days", desc: "Fastest delivery, guaranteed on-time", icon: "⚡" },
        ],
        commitmentTitle: "LIKEFOOD's commitments",
        commitments: [
            { text: "Transparent and clear shipping information", icon: "✅" },
            { text: "Real-time order tracking after dispatch", icon: "📍" },
            { text: "Safe packaging, guaranteed product quality", icon: "🛡️" },
            { text: "24/7 customer support for shipping issues", icon: "💬" },
        ],
        contactTitle: "LIKEFOOD Specialty Marketplace",
        hotline: "24/7 support hotline",
        backHome: "Back to home",
        gotoReturn: "Return policy",
        gotoTerms: "Terms of service",
        freeShippingBanner: "🎉 FREE shipping on all orders of $500 or more!",
    },
};

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale: Locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = SHIPPING_COPY[locale];

    return {
        title: copy.title,
        description: copy.metaDesc,
        alternates: {
            canonical: "/policies/shipping",
            languages: {
                'vi': '/policies/shipping?lang=vi',
                'en': '/policies/shipping?lang=en',
                'x-default': '/policies/shipping',
            },
        },
    };
}

export default async function ShippingPolicyPage() {
    const cookieStore = await cookies();
    const locale: Locale = cookieStore.get("language")?.value === "en" ? "en" : "vi";
    const copy = SHIPPING_COPY[locale];
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
                                <span className="text-white font-bold">{copy.breadcrumbShipping}</span>
                            </div>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                <span className="text-3xl">🚚</span>
                            </div>
                            <h1 className="mb-4 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
                                {copy.heroTitle}
                            </h1>
                            <p className="mx-auto max-w-2xl text-base font-medium text-primary-foreground/80 md:text-lg">
                                {copy.heroDesc}
                            </p>
                        </div>
                    </div>

                    {/* Free Shipping Banner */}
                    <div className="bg-gradient-to-r from-amber-50 via-amber-100/80 to-amber-50 border-b border-amber-200/50 px-6 py-4 text-center">
                        <p className="text-sm md:text-base font-bold text-amber-800">{copy.freeShippingBanner}</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12 lg:p-16">
                        <p className="mb-10 text-lg font-medium text-slate-600">
                            {copy.updated} <strong>01/01/2026</strong>.
                            <br />
                            {copy.intro}
                        </p>

                        {/* Sections */}
                        <div className="space-y-10">
                            {copy.sections.map((section) => (
                                <section key={section.heading} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-2xl">{section.icon}</span>
                                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{section.heading}</h2>
                                    </div>
                                    <div className="space-y-3 text-slate-600 font-medium leading-relaxed">
                                        {section.content.map((p, i) => (
                                            <p key={i}>{p}</p>
                                        ))}
                                    </div>
                                    {section.highlight && (
                                        <div className="flex flex-wrap gap-4 mt-6">
                                            {section.highlight.map((h, i) => (
                                                <div key={i} className="flex-1 min-w-[140px] rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                                                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">{h.label}</p>
                                                    <p className="text-lg font-black text-slate-800">{h.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>

                        {/* Shipping Methods */}
                        <div className="mt-12">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-8 text-center">
                                {copy.shippingMethodsTitle}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {copy.shippingMethods.map((method, i) => (
                                    <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-lg shadow-slate-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                        <span className="text-4xl block mb-4">{method.icon}</span>
                                        <h3 className="text-lg font-black text-slate-900 mb-2">{method.name}</h3>
                                        <p className="text-primary font-bold text-sm mb-3">{method.time}</p>
                                        <p className="text-slate-500 text-sm font-medium">{method.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Commitments */}
                        <div className="mt-12 rounded-2xl bg-primary/5 border border-primary/10 p-8">
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
                    <Link href="/policies/return">
                        <Button variant="outline" className="h-12 rounded-2xl border-primary/20 px-6 font-bold text-primary hover:bg-primary/5">
                            {copy.gotoReturn}
                        </Button>
                    </Link>
                    <Link href="/policies/terms">
                        <Button variant="outline" className="h-12 rounded-2xl border-primary/20 px-6 font-bold text-primary hover:bg-primary/5">
                            {copy.gotoTerms}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
