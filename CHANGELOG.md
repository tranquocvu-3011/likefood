# Changelog

Tất cả thay đổi đáng chú ý của dự án LIKEFOOD sẽ được ghi nhận trong file này.

Định dạng dựa theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-18

### Added
- 🎉 Phiên bản chính thức đầu tiên của LIKEFOOD
- 🛒 Hệ thống thương mại điện tử đầy đủ (sản phẩm, giỏ hàng, thanh toán, đơn hàng)
- 🤖 AI Chatbot tích hợp OpenAI GPT-4o / GPT-4o-mini
  - Tư vấn sản phẩm thông minh
  - Tra cứu đơn hàng
  - Hỏi đáp chính sách
  - AI Content Generator cho admin
  - AI Analytics & Prospect Analysis
- 💳 Thanh toán Stripe (thẻ tín dụng quốc tế, COD, chuyển khoản)
- 🌐 Đa ngôn ngữ (Tiếng Việt / English) với SEO hreflang
- ⚡ Flash Sale campaigns với countdown timer
- 🎁 Loyalty & Referral system
  - Tích điểm khi mua hàng
  - Check-in hàng ngày
  - Giới thiệu bạn bè nhận hoa hồng
- 📊 Admin Dashboard toàn diện
  - Quản lý sản phẩm, đơn hàng, người dùng
  - Flash sale, voucher management
  - AI Command Center (insights, recommendations, trends, prospects)
  - Email marketing campaigns
  - Blog/bài viết management
  - System settings
- 💬 Live Chat realtime (customer ↔ admin)
  - Tích hợp Telegram notifications
  - Reply trực tiếp từ Telegram
- 📧 Email marketing tự động
  - Welcome email
  - Abandoned cart recovery
  - Re-engagement campaigns
- 🔒 Bảo mật
  - Rate limiting (Upstash Redis)
  - XSS prevention (DOMPurify)
  - Stripe webhook signature verification
  - Input validation (Zod schemas)
  - Account lockout
  - Suspicious login alert
- 📱 PWA Support (Service Worker, Web Manifest)
- 📈 SEO tối ưu (JSON-LD, Open Graph, XML Sitemap, Robots.txt)
- 🐳 Docker & Docker Compose deployment
- 🧪 Testing suite (212 tests, Vitest + Playwright)
- 📊 Error tracking (Sentry)

### Infrastructure
- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5.x
- Tailwind CSS 4.x
- Prisma 6.4.0 + MySQL 8.0
- Redis (Upstash) for caching & rate limiting
- Nginx reverse proxy + SSL
- PM2 process management
- GitHub Actions CI/CD

## [0.9.0] - 2026-03-10

### Added
- AI Command Center với 4 tabs: Insights, Recommendations, Trends, Prospects
- Prospect customer analysis (phân tích hành vi → dự đoán khách hàng tiềm năng)
- Knowledge Base management cho AI chatbot

### Improved
- AI context enhancement - chatbot hiểu rõ hơn về website
- Live chat reply từ Telegram

### Fixed
- Fix live chat echo bug (tự động echo message)
- Code audit & deduplication (detectLanguage, escapeHtml)

## [0.8.0] - 2026-03-05

### Added
- Contact floating button với fan-out animation
- Redesign UI/UX cho các nút liên hệ

### Improved
- Tối ưu responsive design
- Cải thiện performance loading

## [0.7.0] - 2026-02-25

### Added
- Blog/Posts system
- Product comparison feature
- Wishlist functionality

### Improved
- Admin dashboard UI overhaul

## [0.6.0] - 2026-02-15

### Added
- Loyalty & Referral system
- Daily check-in rewards
- Email marketing campaigns

## [0.5.0] - 2026-02-01

### Added
- Flash Sale campaigns
- Voucher/Coupon management
- Stripe payment integration

## [0.4.0] - 2026-01-20

### Added
- AI Chatbot integration (OpenAI GPT-4o)
- Multilingual support (VI/EN)

## [0.3.0] - 2026-01-10

### Added
- Admin Dashboard
- Order management
- User management

## [0.2.0] - 2025-12-20

### Added
- Product catalog
- Shopping cart
- Basic checkout flow

## [0.1.0] - 2025-12-01

### Added
- Initial project setup
- Next.js + TypeScript + Prisma boilerplate
- Database schema design (43 models)
- Authentication system (NextAuth.js)

[1.0.0]: https://github.com/tranquocvu-3011/likefood/releases/tag/v1.0.0
[0.9.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tranquocvu-3011/likefood/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tranquocvu-3011/likefood/releases/tag/v0.1.0
