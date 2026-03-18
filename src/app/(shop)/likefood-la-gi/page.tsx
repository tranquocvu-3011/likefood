/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Trang "LIKEFOOD Là Gì?" - SEO Landing Page
 * Target keywords: "likefood là gì", "like food là gì", "like food"
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import FAQSchema from "@/components/seo/FAQSchema";

export const metadata: Metadata = {
  title: "LIKEFOOD Là Gì? — Cửa Hàng Đặc Sản Việt Nam #1 Tại Mỹ | Like Food",
  description:
    "LIKEFOOD (Like Food) là cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. Chuyên cung cấp 100+ sản phẩm chính gốc: cá khô miền Tây, tôm khô Cà Mau, mực khô, trái cây sấy. Giao hàng nhanh 2-3 ngày toàn nước Mỹ. Tìm hiểu ngay!",
  keywords: [
    "likefood là gì", "like food là gì", "likefood", "like food",
    "LIKEFOOD", "like food store", "like food vietnam",
    "cửa hàng đặc sản Việt Nam tại Mỹ", "đặc sản Việt Nam online",
  ],
  alternates: { canonical: "/likefood-la-gi" },
  openGraph: {
    title: "LIKEFOOD Là Gì? — Like Food Vietnamese Specialty Store USA",
    description: "LIKEFOOD (Like Food) - Cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. 100+ sản phẩm chính gốc từ Việt Nam. Giao hàng nhanh 2-3 ngày.",
    url: "https://likefood.app/likefood-la-gi",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function LikefoodLaGiPage() {
  return (
    <>
      <FAQSchema />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-6">
            🌿 Thương hiệu uy tín từ 2024
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            LIKEFOOD (Like Food) Là Gì?
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            <strong>LIKEFOOD</strong> (còn gọi là{" "}
            <strong>Like Food</strong>) là cửa hàng đặc sản Việt Nam uy tín{" "}
            <em>#1 tại Mỹ</em>, chuyên cung cấp hơn{" "}
            <strong>100+ sản phẩm chính gốc</strong> từ Việt Nam.
          </p>
        </header>

        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48">
            <Image
              src="/icon-512.png"
              alt="LIKEFOOD Logo - Like Food Vietnamese Specialty Store"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* Content sections */}
        <div className="prose prose-lg prose-slate max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4">
              🏪 Giới thiệu về LIKEFOOD
            </h2>
            <p>
              <strong>LIKEFOOD</strong> (viết tắt: <strong>Like Food</strong>) được thành lập với sứ mệnh mang hương vị quê hương Việt Nam đến tận tay người Việt xa xứ tại Mỹ. 
              Chúng tôi tuyển chọn kỹ lưỡng từng sản phẩm đặc sản từ các vùng miền Việt Nam — đặc biệt 
              là <strong>đặc sản miền Tây</strong> như cá khô, tôm khô, mực khô — và vận chuyển trực tiếp đến khách hàng 
              toàn nước Mỹ.
            </p>
            <p>
              Website chính thức: <Link href="/" className="text-emerald-600 font-semibold hover:underline">likefood.app</Link>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4">
              🛒 Sản phẩm tại LIKEFOOD
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
              {[
                { emoji: "🐟", title: "Cá Khô Miền Tây", desc: "Khô cá lóc, cá sặc, cá tra, cá kèo, cá dứa" },
                { emoji: "🦐", title: "Tôm Khô Cà Mau", desc: "Tôm khô nguyên con, tôm khô loại 1" },
                { emoji: "🦑", title: "Mực Khô", desc: "Mực khô nguyên con, mực khô Việt Nam" },
                { emoji: "🥩", title: "Khô Bò & Khô Heo", desc: "Khô bò miếng, khô bò sợi, khô gà" },
                { emoji: "🥭", title: "Trái Cây Sấy", desc: "Xoài sấy, mít sấy, chuối sấy, khoai sấy" },
                { emoji: "🫙", title: "Mắm & Gia Vị", desc: "Nước mắm Phú Quốc, mắm tôm, gia vị phở" },
                { emoji: "🍵", title: "Trà & Đồ Uống", desc: "Trà ổi, trà atiso, trà sen, cà phê Việt" },
                { emoji: "🍘", title: "Bánh & Snack", desc: "Bánh tráng, bánh phồng tôm, kẹo dừa" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-4 bg-gradient-to-br from-white to-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4">
              🚚 Tại sao chọn LIKEFOOD?
            </h2>
            <ul className="space-y-3 not-prose">
              {[
                "✅ 100+ sản phẩm đặc sản Việt Nam chính gốc",
                "✅ Giao hàng nhanh 2-3 ngày toàn nước Mỹ",
                "✅ Miễn phí ship đơn hàng từ $500",
                "✅ Chất lượng đạt chuẩn FDA",
                "✅ Đóng gói hút chân không — giữ nguyên hương vị",
                "✅ Thanh toán an toàn qua Stripe (Credit Card, Apple Pay, Google Pay)",
                "✅ Hỗ trợ khách hàng 24/7 (Tiếng Việt & English)",
                "✅ AI trợ lý tư vấn sản phẩm thông minh",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-slate-700 text-base"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4">
              📍 Thông tin liên hệ LIKEFOOD
            </h2>
            <div className="not-prose bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl p-6 border border-emerald-100">
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-3">
                  <span className="text-xl">🌐</span>
                  <span>Website: <Link href="/" className="text-emerald-600 font-semibold hover:underline">likefood.app</Link></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">📞</span>
                  <span>Điện thoại: <a href="tel:+14023158105" className="text-emerald-600 font-semibold hover:underline">+1-402-315-8105</a></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">📧</span>
                  <span>Email: <a href="mailto:tranquocvu3011@gmail.com" className="text-emerald-600 font-semibold hover:underline">tranquocvu3011@gmail.com</a></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <span>Địa chỉ: Omaha, NE 68136, USA</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 space-y-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            🛒 Xem Tất Cả Sản Phẩm
          </Link>
          <p className="text-sm text-slate-500">
            Giao hàng toàn nước Mỹ • Miễn phí ship từ $500 • Chất lượng FDA
          </p>
        </div>
      </article>
    </>
  );
}
