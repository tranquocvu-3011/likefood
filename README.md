# 🍜 LIKEFOOD — Vietnamese Specialty E-Commerce Platform

<p align="center">
  <img src="public/logo.png" alt="LIKEFOOD Logo" width="140" />
</p>

<p align="center">
  <strong>Nền tảng thương mại điện tử đặc sản Việt Nam tại Mỹ — Tích hợp AI thông minh</strong>
</p>

<p align="center">
  <a href="https://likefood.app">🌐 Live Site</a> •
  <a href="#tính-năng">Tính năng</a> •
  <a href="#công-nghệ">Công nghệ</a> •
  <a href="#thống-kê-dự-án">Thống kê</a> •
  <a href="#cài-đặt">Cài đặt</a> •
  <a href="#api-reference">API</a> •
  <a href="#giấy-phép">Giấy phép</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.4.0-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Stripe-Payment-635BFF?logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## 📊 Thống Kê Dự Án

<table align="center">
  <tr>
    <td align="center"><strong>600+</strong><br/>Source Files</td>
    <td align="center"><strong>173</strong><br/>API Routes</td>
    <td align="center"><strong>129</strong><br/>React Components</td>
    <td align="center"><strong>75</strong><br/>Pages</td>
    <td align="center"><strong>43</strong><br/>Database Models</td>
    <td align="center"><strong>2</strong><br/>Languages (VI/EN)</td>
  </tr>
</table>

---

## 📋 Giới Thiệu

**LIKEFOOD** là nền tảng thương mại điện tử full-stack chuyên cung cấp đặc sản Việt Nam tại thị trường Mỹ. Hệ thống được thiết kế với kiến trúc hiện đại, tích hợp trí tuệ nhân tạo (AI ChatGPT) sâu rộng vào mọi khía cạnh — từ tư vấn khách hàng đến phân tích dữ liệu kinh doanh cho admin.

### 🌟 Điểm Nổi Bật

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | 🤖 **AI Command Center** | Admin AI chat streaming (SSE), 6 domains intelligence, đọc toàn bộ database real-time |
| 2 | 🤖 **AI Customer Chatbot** | GPT-4o tư vấn sản phẩm, SSE streaming, 14+ data sources |
| 3 | 💳 **Thanh toán Stripe** | Thẻ quốc tế (Visa, Mastercard, AmEx), PayPal, Apple Pay, COD |
| 4 | 🌐 **Đa ngôn ngữ** | Tiếng Việt & English, SEO hreflang, i18n dictionaries |
| 5 | ⚡ **Flash Sale** | Campaigns giảm giá theo thời gian thực, countdown timer |
| 6 | 🎁 **Loyalty & Referral** | Tích điểm mua hàng, check-in hàng ngày, referral commission |
| 7 | 📊 **Admin Dashboard** | 75+ pages quản lý, analytics real-time, AI insights |
| 8 | 📱 **Mobile Optimized** | Responsive, PWA, touch swipe, bottom navigation |
| 9 | 💬 **Live Chat** | Customer ↔ Admin real-time + Telegram integration |
| 10 | 🔒 **Enterprise Security** | Rate limiting, XSS prevention, Stripe webhook verification |

---

## 🚀 Tính Năng Chi Tiết

### 👥 Khách Hàng (Customer-Facing)

| Tính năng | Mô tả |
|-----------|-------|
| **Đăng ký / Đăng nhập** | Email + OTP, Magic Link, Google OAuth |
| **Duyệt sản phẩm** | Tìm kiếm, lọc danh mục/giá/đánh giá, sắp xếp |
| **Giỏ hàng & Checkout** | Thêm/bớt sản phẩm, apply voucher, tính phí ship tự động |
| **Thanh toán** | Stripe (thẻ quốc tế), COD, chuyển khoản |
| **Theo dõi đơn hàng** | Trạng thái realtime: Pending → Confirmed → Shipped → Delivered |
| **Đánh giá sản phẩm** | Rating 1-5 sao, comment, upload ảnh |
| **AI Chatbot** | SSE streaming, tư vấn sản phẩm, tra cứu đơn hàng, chính sách |
| **Flash Sale** | Countdown timer, mua giá ưu đãi |
| **Voucher** | Nhập mã giảm giá tại checkout |
| **Tích điểm (Loyalty)** | Mua hàng tích điểm, đổi điểm thành giảm giá |
| **Giới thiệu bạn bè** | Referral link, nhận hoa hồng khi bạn mua hàng |
| **Check-in hàng ngày** | Điểm danh nhận điểm thưởng |
| **Wishlist** | Lưu sản phẩm yêu thích |
| **So sánh sản phẩm** | So sánh chi tiết 2-3 sản phẩm |
| **Live Chat** | Chat trực tiếp với nhân viên hỗ trợ |
| **Gợi ý cá nhân hóa** | Product recommendations dựa trên hành vi user |
| **Blog / Bài viết** | Đọc bài viết ẩm thực, công thức nấu ăn |

### 🔧 Quản Trị (Admin Dashboard)

| Tính năng | Mô tả |
|-----------|-------|
| **Dashboard** | Thống kê doanh thu, đơn hàng, khách hàng, biểu đồ |
| **Quản lý sản phẩm** | CRUD sản phẩm, danh mục, thương hiệu, ảnh |
| **Quản lý đơn hàng** | Xem, cập nhật trạng thái, in đơn |
| **Quản lý người dùng** | Danh sách, phân quyền, khóa tài khoản |
| **Flash Sale Campaign** | Tạo, quản lý chiến dịch giảm giá |
| **Voucher Management** | Tạo mã giảm giá, theo dõi usage |
| **AI Command Center** | 🆕 SSE Streaming — phân tích doanh thu, sản phẩm, khách hàng, SEO |
| **AI Content Generator** | Tạo mô tả sản phẩm, banner, email bằng AI |
| **AI Analytics** | Phân tích hành vi, funnel conversion, search queries |
| **AI Prospects** | Phát hiện khách hàng tiềm năng, churn risk, VIP insights |
| **Email Marketing** | Welcome, abandoned cart, re-engagement campaigns |
| **Blog Management** | Quản lý nội dung blog, SEO |
| **Live Chat Admin** | Trả lời khách hàng real-time |
| **Telegram Integration** | Thông báo đơn hàng mới, reply từ Telegram |
| **Cài đặt hệ thống** | API keys, SMTP, Telegram, thông tin cửa hàng |

### 🤖 AI Command Center — Chi Tiết

Admin AI chat đọc **trực tiếp từ MySQL database** với 6 domains intelligence:

| Domain | Dữ liệu |
|--------|----------|
| **📊 Business** | Doanh thu hôm nay/tuần/tháng, AOV, tăng trưởng MoM, đơn chờ xử lý |
| **📦 Product** | Bestsellers, slow movers, tồn kho, cần nhập hàng, margin analysis |
| **👥 Customer** | VIP/Premium/New segments, churn risk, lifetime value, prospects |
| **🔍 Behavior** | Funnel conversion, search queries, top pages, bounce rate |
| **🎯 Marketing** | Coupon performance, flash sale ROI, newsletter stats |
| **🌐 SEO** | Metadata quality, content gaps, keyword coverage |

---

## 🛠 Công Nghệ

### Core Stack

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **Next.js** | 16.1.6 | React Framework (App Router, SSR, ISR) |
| **React** | 19.2.3 | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 4.x | Utility-First Styling |
| **Prisma** | 6.4.0 | ORM / Database Access |
| **MySQL** | 8.0 | Relational Database |
| **Redis** (Upstash) | — | Caching, Rate Limiting |

### Tích Hợp Bên Thứ Ba

| Service | Vai trò |
|---------|---------|
| **OpenAI** (GPT-4o / GPT-4o-mini) | AI Chatbot, Content Generation, Analytics |
| **Stripe** | Payment Processing (Cards, PayPal, Apple Pay) |
| **NextAuth.js** | Authentication (Email, Google OAuth, Magic Link) |
| **Sentry** | Error Tracking & Performance Monitoring |
| **Nodemailer** | Transactional & Marketing Emails |
| **Telegram Bot API** | Admin Notifications & Reply |
| **Upstash Redis** | Rate Limiting, API Cache |
| **Cloudflare Turnstile** | CAPTCHA Protection |
| **Framer Motion** | Animations & Transitions |
| **DOMPurify** | XSS Prevention |
| **Zod** | Input Validation Schemas |

### DevOps & Infrastructure

| Tool | Vai trò |
|------|---------|
| **Docker** + Compose | Containerized Deployment |
| **Nginx** | Reverse Proxy, SSL Termination |
| **PM2** | Process Management, Auto-restart |
| **GitHub Actions** | CI/CD Pipeline |
| **Certbot** | Let's Encrypt SSL |

---

## 📦 Cài Đặt

### Yêu cầu

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MySQL** 8.0+
- **Redis** (hoặc Upstash account)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/tranquocvu-3011/likefood.git
cd likefood

# 2. Cài đặt dependencies
npm install

# 3. Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env theo hướng dẫn bên dưới

# 4. Khởi tạo database
npx prisma generate
npx prisma db push

# 5. Chạy development server
npm run dev
```

Truy cập: **http://localhost:3000**

> 📖 Xem hướng dẫn chi tiết tại [INSTALL.md](INSTALL.md)

### Environment Variables

```env
# === BẮT BUỘC ===
DATABASE_URL="mysql://user:password@localhost:3306/weblikefood"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"     # openssl rand -base64 32

# === TÙY CHỌN ===
OPENAI_API_KEY="sk-..."               # AI Chatbot
STRIPE_SECRET_KEY="sk_test_..."       # Thanh toán thẻ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
UPSTASH_REDIS_REST_URL="https://..."  # Rate limiting
UPSTASH_REDIS_REST_TOKEN="..."
SMTP_HOST="smtp.gmail.com"            # Email
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
TELEGRAM_BOT_TOKEN="..."              # Admin notifications
TELEGRAM_CHAT_ID="..."
SENTRY_DSN="..."                      # Error tracking
```

---

## 🐳 Triển Khai (Docker)

```bash
# Build & start tất cả services
docker compose up -d --build

# Import database
docker compose exec -T mysql mysql -u likefood -p weblikefood < weblikefood.sql

# Kiểm tra logs
docker compose logs -f app
```

| Service | Port | Mô tả |
|---------|------|-------|
| **app** | 3000 | Next.js Application |
| **mysql** | 3306 | MySQL 8.0 Database |
| **redis** | 6379 | Redis Cache |
| **nginx** | 80/443 | Reverse Proxy + SSL |
| **phpmyadmin** | 8080 | DB Management UI |

---

## 📁 Cấu Trúc Dự Án

```
likefood/
├── src/                           # Source code (600+ files)
│   ├── app/                       # Next.js App Router
│   │   ├── (shop)/                # Customer pages (75 pages total)
│   │   │   ├── products/          #   Product listing & detail
│   │   │   ├── cart/              #   Shopping cart
│   │   │   ├── checkout/          #   Checkout flow
│   │   │   ├── profile/           #   User profile & orders
│   │   │   ├── posts/             #   Blog articles
│   │   │   ├── vouchers/          #   Voucher center
│   │   │   ├── flash-sale/        #   Flash sale page
│   │   │   └── ...
│   │   ├── admin/                 # Admin dashboard
│   │   │   ├── dashboard/         #   Main dashboard
│   │   │   ├── products/          #   Product management
│   │   │   ├── orders/            #   Order management
│   │   │   ├── users/             #   User management
│   │   │   ├── ai/                #   AI Command Center
│   │   │   ├── flash-sale/        #   Flash sale campaigns
│   │   │   ├── settings/          #   System settings
│   │   │   └── ...
│   │   ├── api/                   # API Routes (173 endpoints)
│   │   │   ├── auth/              #   Authentication
│   │   │   ├── products/          #   Product CRUD & search
│   │   │   ├── orders/            #   Order management
│   │   │   ├── admin/             #   Admin APIs
│   │   │   ├── ai/                #   AI chatbot & analytics
│   │   │   │   ├── chat/stream/   #   Customer AI (SSE)
│   │   │   │   └── admin/stream/  #   Admin AI (SSE)
│   │   │   ├── webhooks/          #   Stripe webhooks
│   │   │   ├── recommendations/   #   Product recommendations
│   │   │   └── ...
│   │   └── layout.tsx             # Root layout
│   ├── components/                # React Components (129 files)
│   │   ├── admin/                 #   Admin-specific components
│   │   ├── chat/                  #   Chat widgets
│   │   ├── home/                  #   Homepage sections
│   │   ├── product/               #   Product components
│   │   ├── shared/                #   Shared components (Navbar, Footer, etc.)
│   │   ├── navbar/                #   Navigation components
│   │   └── ui/                    #   UI primitives (Button, Input, etc.)
│   ├── lib/                       # Core utilities
│   │   ├── ai/                    #   AI provider, data readers, recommendation
│   │   ├── analytics/             #   Behavior tracking SDK
│   │   ├── chat/                  #   Live chat service
│   │   ├── email/                 #   Email templates & sender
│   │   ├── i18n/                  #   Internationalization (VI/EN)
│   │   ├── referral/              #   Referral system
│   │   ├── validations/           #   Zod schemas
│   │   ├── prisma.ts              #   Prisma client singleton
│   │   ├── ratelimit.ts           #   Rate limiting
│   │   ├── cache.ts               #   Redis cache layer
│   │   ├── commerce.ts            #   Business logic
│   │   └── logger.ts              #   Structured logging
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom React hooks
│   └── types/                     # TypeScript type definitions
├── prisma/
│   └── schema.prisma              # Database schema (43 models)
├── public/                        # Static assets, PWA manifest
├── nginx/                         # Nginx config + SSL
├── scripts/                       # Deployment & backup scripts
├── docs/                          # Documentation (6 files)
├── docker-compose.yml             # Docker orchestration
├── Dockerfile                     # Multi-stage Docker build
└── package.json                   # Dependencies & scripts
```

---

## 🔌 API Reference

### Authentication (3 endpoints)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/magic-link` | Gửi magic link đăng nhập |
| GET | `/api/auth/verify-email` | Xác thực email |

### Products (8 endpoints)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Danh sách sản phẩm (search, filter, sort, pagination) |
| GET | `/api/products/[slug]` | Chi tiết sản phẩm |
| GET | `/api/products/flash-sale` | Sản phẩm đang flash sale |
| GET | `/api/products/search-hints` | Gợi ý tìm kiếm |
| GET | `/api/products/compare` | So sánh sản phẩm |
| POST | `/api/products/reviews` | Gửi đánh giá sản phẩm |
| GET | `/api/recommendations/personalized` | Gợi ý cá nhân hóa |
| GET | `/api/recommendations/products` | Sản phẩm trending |

### Orders (4 endpoints)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/orders` | Tạo đơn hàng mới |
| GET | `/api/orders` | Danh sách đơn hàng (user) |
| GET | `/api/orders/[id]` | Chi tiết đơn hàng |
| PATCH | `/api/orders/[id]` | Cập nhật trạng thái đơn |

### AI Chat (4 endpoints)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ai/chat/stream` | 🆕 Customer AI chatbot (SSE streaming) |
| POST | `/api/ai/admin/stream` | 🆕 Admin AI Command Center (SSE streaming) |
| POST | `/api/ai/admin` | Admin AI services (analytics, insights, prospects) |
| GET | `/api/ai/health` | AI service health check |

### Payments (2 endpoints)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/payments/create-intent` | Tạo Stripe payment intent |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### Health & Monitoring

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | System health check |

> 📖 Tổng cộng **173 API routes** — xem đầy đủ trong `src/app/api/`

---

## 📊 Database Schema

**43 Prisma models** bao gồm:

| Category | Models | Mô tả |
|----------|--------|-------|
| **User & Auth** | `User`, `Account`, `VerificationToken` | Quản lý người dùng, xác thực |
| **Product** | `Product`, `Brand`, `ProductSpec`, `ProductQA` | Sản phẩm, thương hiệu, specs, Q&A |
| **Order** | `Order`, `OrderItem`, `Payment` | Đơn hàng, chi tiết, thanh toán |
| **Review** | `Review` | Đánh giá sản phẩm |
| **Promotion** | `Coupon`, `CouponUsage`, `FlashSaleCampaign`, `FlashSaleProduct` | Mã giảm giá, flash sale |
| **Loyalty** | `LoyaltyTransaction`, `ReferralCode`, `ReferralCommission`, `CheckIn` | Tích điểm, referral, check-in |
| **Chat** | `ChatSession`, `ChatMessage` | Live chat |
| **Content** | `Post`, `DynamicPage`, `HomepageSection`, `KnowledgeEntry` | Blog, CMS, FAQ |
| **Marketing** | `EmailCampaign`, `EmailQueue`, `Notification`, `Newsletter` | Email, thông báo |
| **Analytics** | `BehaviorEvent`, `AiUsageLog` | Hành vi user, AI usage |
| **System** | `SiteConfig`, `SystemSetting` | Cài đặt hệ thống |

---

## 🔒 Bảo Mật

| Layer | Biện pháp |
|-------|-----------|
| **Auth** | NextAuth.js, bcrypt hashing, account lockout, suspicious login alert |
| **Input** | Zod validation trên tất cả API routes, DOMPurify for XSS |
| **API** | Rate limiting (Upstash Redis), CSRF (Next.js built-in) |
| **Payment** | Stripe webhook signature verification |
| **Database** | Prisma ORM (parameterized queries = SQL injection prevention) |
| **Upload** | Magic bytes validation + size limit |
| **Infrastructure** | HTTPS/SSL, Docker isolation, env-based secrets |
| **Monitoring** | Sentry error tracking, structured logging |

> 📖 Chi tiết tại [SECURITY.md](SECURITY.md)

---

## 📈 SEO

- ✅ Dynamic metadata cho tất cả 75 pages
- ✅ JSON-LD structured data (Product, BreadcrumbList, CollectionPage, Article, FAQPage)
- ✅ Open Graph + Twitter Cards
- ✅ Hreflang tags (VI/EN) cho 20+ pages
- ✅ Pagination canonical URLs
- ✅ XML Sitemap tự động (`/sitemap.xml`)
- ✅ Robots.txt optimized (`/robots.txt`)
- ✅ Content SEO page (`/likefood-la-gi`)

---

## 📱 Mobile & PWA

- ✅ Responsive design (Mobile / Tablet / Desktop)
- ✅ Mobile-optimized sidebar (horizontal scroll categories, hotline, reduced clutter)
- ✅ Touch swipe navigation (Featured Products carousel)
- ✅ Mobile bottom navigation bar (Home, Products, Cart, Wishlist, Account)
- ✅ Service Worker (`public/sw.js`)
- ✅ Web App Manifest (`public/manifest.json`)
- ✅ Installable trên Mobile

---

## 🌍 Đa Ngôn Ngữ (i18n)

Hỗ trợ **Tiếng Việt** và **English** trên toàn bộ:

- 🗂 Product names & descriptions
- 🧭 Navigation & UI elements
- ❌ Error messages & notifications
- 📈 SEO metadata & hreflang tags
- 🤖 AI Chatbot responses
- 📧 Email templates

---

## 🧪 Testing

```bash
# Chạy unit tests
npm run test:run

# Watch mode
npm run test

# Type checking
npm run type-check

# E2E tests
npx playwright test
```

---

## 📚 Tài Liệu

| File | Nội dung |
|------|----------|
| [README.md](README.md) | Tổng quan dự án (bạn đang đọc) |
| [INSTALL.md](INSTALL.md) | Hướng dẫn cài đặt chi tiết (Dev, Docker, VPS) |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử thay đổi theo version |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Hướng dẫn đóng góp, coding standards |
| [SECURITY.md](SECURITY.md) | Chính sách bảo mật, báo lỗ hổng |
| [ROADMAP.md](ROADMAP.md) | Lộ trình phát triển tương lai |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Quy tắc ứng xử cộng đồng |
| [GOVERNANCE.md](GOVERNANCE.md) | Mô hình quản trị dự án |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Danh sách dependencies chi tiết |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Hướng dẫn sử dụng |
| [docs/BACKUP_RECOVERY.md](docs/BACKUP_RECOVERY.md) | Backup & Recovery |

---

## 🤝 Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

> 📖 Xem chi tiết tại [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 Giấy Phép

Dự án được phân phối theo **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👨‍💻 Tác Giả

**Trần Quốc Vũ**
📧 tranquocvu3011@gmail.com
🔗 [GitHub](https://github.com/tranquocvu-3011)
🌐 [likefood.app](https://likefood.app)

---

<p align="center">
  Made with ❤️ in 🇻🇳 by <strong>Trần Quốc Vũ</strong> — LIKEFOOD © 2026
</p>
