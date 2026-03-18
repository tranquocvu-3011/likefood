/**
 * LIKEFOOD - SEO Internal Links Component (Server Component)
 * Renders keyword-rich internal links at the bottom of product pages
 * Helps Google understand site structure and pass PageRank between pages
 */

import Link from "next/link";

const SEO_LINKS = [
  // Blog posts — internal linking to content
  { href: "/posts", label: "📚 Blog Đặc Sản Việt Nam" },
  { href: "/products", label: "🛒 Tất Cả Sản Phẩm" },
  { href: "/flash-sale", label: "⚡ Flash Sale Hôm Nay" },
  { href: "/vouchers", label: "🎟️ Mã Giảm Giá" },
  { href: "/about", label: "📖 Về LIKEFOOD (Like Food)" },
  { href: "/faq", label: "❓ Câu Hỏi Thường Gặp" },
  { href: "/contact", label: "📞 Liên Hệ" },
  { href: "/policies/shipping", label: "🚚 Chính Sách Giao Hàng" },
  { href: "/policies/return", label: "🔄 Chính Sách Đổi Trả" },
  { href: "/likefood-la-gi", label: "🤔 LIKEFOOD Là Gì?" },
];

export default function InternalLinks() {
  return (
    <nav className="internal-links" aria-label="Liên kết nội bộ LIKEFOOD">
      <h3 className="internal-links__title">🔗 Khám Phá Thêm Tại LIKEFOOD</h3>
      <div className="internal-links__grid">
        {SEO_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="internal-links__item"
            title={link.label}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <style>{`
        .internal-links {
          margin-top: 3rem;
          padding: 2rem;
          background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
          border-radius: 16px;
          border: 1px solid #fed7aa;
        }
        .internal-links__title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: #92400e;
        }
        .internal-links__grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .internal-links__item {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #374151;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        .internal-links__item:hover {
          background: #ed712e;
          color: white;
          border-color: #ed712e;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(237,113,46,0.3);
        }
        @media (max-width: 640px) {
          .internal-links {
            padding: 1.5rem 1rem;
          }
          .internal-links__grid {
            gap: 0.5rem;
          }
          .internal-links__item {
            font-size: 0.8rem;
            padding: 0.4rem 0.75rem;
          }
        }
      `}</style>
    </nav>
  );
}
