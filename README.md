# 🍜 LIKEFOOD — Nền Tảng Thương Mại Điện Tử Đặc Sản Việt Nam

<p align="center">
  <img src="public/logo.png" alt="LIKEFOOD Logo" width="120" />
</p>

<p align="center">
  <strong>Vietnamese Specialty Food Marketplace — Powered by Trần Quốc Vũ</strong>
</p>

<p align="center">
  <a href="#tính-năng">Tính năng</a> •
  <a href="#công-nghệ">Công nghệ</a> •
  <a href="#cài-đặt">Cài đặt</a> •
  <a href="#triển-khai">Triển khai</a> •
  <a href="#cấu-trúc-dự-án">Cấu trúc</a> •
  <a href="#api-reference">API</a> •
  <a href="#giấy-phép">Giấy phép</a>
</p>

---

## 📋 Giới Thiệu

**LIKEFOOD** là nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam tại thị trường Mỹ. Hệ thống tích hợp trí tuệ nhân tạo (AI ChatGPT), thanh toán quốc tế (Stripe), đa ngôn ngữ (Tiếng Việt / English), và nhiều tính năng hiện đại khác.

### 🎯 Đặc điểm nổi bật

- 🤖 **AI Chatbot** — Tư vấn sản phẩm thông minh bằng ChatGPT (GPT-4o / GPT-4o-mini)
- 💳 **Thanh toán Stripe** — Hỗ trợ thẻ tín dụng quốc tế, COD, chuyển khoản
- 🌐 **Đa ngôn ngữ** — Tiếng Việt & English, SEO hreflang đầy đủ
- ⚡ **Flash Sale** — Chiến dịch giảm giá theo thời gian thực
- 🎁 **Loyalty & Referral** — Hệ thống tích điểm, giới thiệu bạn bè nhận hoa hồng
- 📊 **Admin Dashboard** — Quản lý toàn diện đơn hàng, sản phẩm, phân tích AI
- 📱 **PWA Ready** — Hỗ trợ Progressive Web App, service worker, manifest
- 🔒 **Bảo mật cao** — Rate limiting, XSS prevention, Stripe webhook verification

---

## 🚀 Tính Năng

### 👥 Khách Hàng

| Tính năng | Mô tả |
|-----------|-------|
| **Đăng ký / Đăng nhập** | Email + OTP, Magic Link, Google OAuth |
| **Duyệt sản phẩm** | Tìm kiếm, lọc theo danh mục/giá/đánh giá, sắp xếp |
| **Giỏ hàng** | Thêm/bớt sản phẩm, apply voucher, tính phí ship |
| **Thanh toán** | Stripe (thẻ tín dụng), COD, chuyển khoản |
| **Theo dõi đơn hàng** | Trạng thái realtime: Pending → Confirmed → Shipped → Delivered |
| **Đánh giá sản phẩm** | Rating 1-5 sao, comment, upload ảnh |
| **AI Chatbot** | Tư vấn sản phẩm, tra cứu đơn hàng, hỏi đáp chính sách |
| **Flash Sale** | Mua sản phẩm giá ưu đãi, countdown timer |
| **Voucher / Mã giảm giá** | Nhập mã giảm giá tại checkout |
| **Tích điểm (Loyalty)** | Mua hàng tích điểm, đổi điểm giảm giá |
| **Giới thiệu bạn bè** | Link referral, nhận hoa hồng khi bạn mua hàng |
| **Check-in hàng ngày** | Điểm danh nhận điểm thưởng |
| **Wishlist** | Lưu sản phẩm yêu thích |
| **So sánh sản phẩm** | So sánh chi tiết 2-3 sản phẩm |
| **Live Chat** | Chat trực tiếp với nhân viên hỗ trợ |

### 🔧 Quản Trị (Admin)

| Tính năng | Mô tả |
|-----------|-------|
| **Dashboard** | Thống kê doanh thu, đơn hàng, khách hàng |
| **Quản lý sản phẩm** | CRUD sản phẩm, danh mục, thương hiệu |
| **Quản lý đơn hàng** | Xem, cập nhật trạng thái, in đơn |
| **Quản lý người dùng** | Xem danh sách, phân quyền, khóa tài khoản |
| **Flash Sale Campaign** | Tạo, quản lý chiến dịch flash sale |
| **Voucher Management** | Tạo mã giảm giá, theo dõi usage |
| **AI Content Generator** | Tạo mô tả sản phẩm, banner, email bằng AI |
| **AI Analytics** | Phân tích hành vi khách hàng, dự đoán xu hướng |
| **Email Marketing** | Gửi email campaign (welcome, abandoned cart, re-engagement) |
| **Blog / Bài viết** | Quản lý nội dung blog, SEO |
| **Cài đặt hệ thống** | Cấu hình API keys, SMTP, Telegram, thông tin cửa hàng |
| **Live Chat Admin** | Trả lời tin nhắn khách hàng realtime |
| **Telegram Integration** | Thông báo đơn hàng mới, cảnh báo bảo mật |

---

## 🛠 Công Nghệ

### Core Stack

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **Next.js** | 16.1.6 | React Framework (App Router) |
| **React** | 19.2.3 | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 4.x | Styling |
| **Prisma** | 6.4.0 | ORM / Database |
| **MySQL** | 8.0 | Database |
| **Redis** (Upstash) | — | Caching, Rate Limiting |

### Tích Hợp Bên Thứ Ba

| Service | Vai trò |
|---------|---------|
| **OpenAI** (GPT-4o / GPT-4o-mini) | AI Chatbot, Content Generation |
| **Stripe** | Payment Processing |
| **NextAuth.js** | Authentication (Email, Google OAuth) |
| **Sentry** | Error Tracking & Monitoring |
| **Nodemailer** | Transactional Emails |
| **Telegram Bot API** | Admin Notifications |
| **Upstash Redis** | Rate Limiting, Cache |
| **Cloudflare Turnstile** | CAPTCHA Protection |

### DevOps & Testing

| Tool | Vai trò |
|------|---------|
| **Docker** + Docker Compose | Containerization |
| **Nginx** | Reverse Proxy, SSL |
| **PM2** | Process Management |
| **GitHub Actions** | CI/CD Pipeline |
| **Vitest** | Unit & Integration Testing |
| **Playwright** | E2E Testing |

---

## 📦 Cài Đặt

### Yêu cầu

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MySQL** 8.0+
- **Redis** (hoặc Upstash account)

### Bước 1: Clone repository

```bash
git clone https://github.com/tranquocvu-3011/likefood.git
cd likefood
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình environment

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/weblikefood"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Telegram (optional)
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."

# Sentry (optional)
SENTRY_DSN="..."
```

### Bước 4: Khởi tạo database

```bash
# Generate Prisma client
npx prisma generate

# Push schema lên database
npx prisma db push

# (Optional) Import SQL dump
mysql -u user -p weblikefood < weblikefood.sql
```

### Bước 5: Chạy development server

```bash
npm run dev
```

Truy cập: **http://localhost:3000**

---

## 🐳 Triển Khai (Docker)

### Production với Docker Compose

```bash
# Build và start tất cả services
docker compose up -d --build

# Kiểm tra logs
docker compose logs -f app

# Import database
docker compose exec -T mysql mysql -u likefood -p weblikefood < weblikefood.sql
```

### Docker Services

| Service | Port | Mô tả |
|---------|------|-------|
| **app** | 3000 | Next.js Application |
| **mysql** | 3306 | MySQL 8.0 Database |
| **redis** | 6379 | Redis Cache |
| **nginx** | 80/443 | Reverse Proxy + SSL |
| **phpmyadmin** | 8080 | Database Management UI |

### SSL Certificate

```bash
# Certbot auto-renewal
sudo certbot certonly --webroot -w /opt/likefood/public -d likefood.app
```

---

## 📁 Cấu Trúc Dự Án

```
likefood/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (shop)/             # Customer-facing pages
│   │   │   ├── products/       # Product listing & detail
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── checkout/       # Checkout flow
│   │   │   ├── profile/        # User profile & orders
│   │   │   ├── posts/          # Blog posts
│   │   │   ├── vouchers/       # Voucher center
│   │   │   └── ...
│   │   ├── admin/              # Admin dashboard
│   │   │   ├── products/       # Product management
│   │   │   ├── orders/         # Order management
│   │   │   ├── users/          # User management
│   │   │   ├── flash-sale/     # Flash sale campaigns
│   │   │   ├── ai-dashboard/   # AI analytics
│   │   │   └── ...
│   │   ├── api/                # API Routes (166 endpoints)
│   │   │   ├── auth/           # Authentication
│   │   │   ├── products/       # Product CRUD
│   │   │   ├── orders/         # Order management
│   │   │   ├── admin/          # Admin APIs
│   │   │   ├── ai/             # AI chatbot & services
│   │   │   ├── webhooks/       # Stripe webhooks
│   │   │   └── ...
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React Components
│   │   ├── admin/              # Admin components
│   │   ├── product/            # Product components
│   │   ├── shared/             # Shared components
│   │   └── ui/                 # UI primitives
│   ├── lib/                    # Core utilities
│   │   ├── ai/                 # AI provider, chatbot, services
│   │   ├── analytics/          # Behavior tracking
│   │   ├── chat/               # Live chat service
│   │   ├── email/              # Email templates & sender
│   │   ├── i18n/               # Internationalization
│   │   ├── referral/           # Referral system
│   │   ├── validations/        # Zod schemas
│   │   ├── admin-auth.ts       # Centralized admin auth
│   │   ├── api-error.ts        # Standardized API errors
│   │   ├── cache.ts            # Redis cache layer
│   │   ├── commerce.ts         # Business logic
│   │   ├── logger.ts           # Structured logging
│   │   ├── prisma.ts           # Prisma client
│   │   ├── ratelimit.ts        # Rate limiting
│   │   └── ...
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── __tests__/              # Test files
├── prisma/
│   └── schema.prisma           # Database schema (43 models)
├── public/                     # Static assets
├── nginx/                      # Nginx config + SSL
├── scripts/                    # Deployment & backup scripts
├── docs/                       # Documentation
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Multi-stage Docker build
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/magic-link` | Gửi magic link đăng nhập |
| GET | `/api/auth/verify-email` | Xác thực email |

### Products

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/products` | Danh sách sản phẩm (search, filter, sort, pagination) |
| GET | `/api/products/[slug]` | Chi tiết sản phẩm |
| GET | `/api/products/flash-sale` | Sản phẩm đang flash sale |
| GET | `/api/products/search-hints` | Gợi ý tìm kiếm |

### Orders

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/orders` | Tạo đơn hàng mới |
| GET | `/api/orders` | Danh sách đơn hàng (user) |
| PATCH | `/api/orders/[id]` | Cập nhật trạng thái đơn |

### AI

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ai/chat` | AI chatbot conversation |
| GET | `/api/ai/health` | AI service health check |
| POST | `/api/ai/recommend` | AI product recommendations |

### Payments

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/payments/create-intent` | Tạo Stripe payment intent |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### Health Check

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | System health check |

---

## 🧪 Testing

```bash
# Chạy tất cả unit tests
npm run test:run

# Chạy tests với watch mode
npm run test

# Chạy E2E tests
npx playwright test

# Type checking
npm run type-check
```

### Test Coverage

- **212 tests** across **13 test files**
- Unit tests: admin-auth, commerce, security, validation, sanitize
- Integration tests: API routes
- E2E tests: Playwright core flows

---

## 📊 Database Schema

**43 models** bao gồm:

| Model | Mô tả |
|-------|-------|
| `User` | Tài khoản người dùng |
| `Product` | Sản phẩm |
| `Order` / `OrderItem` | Đơn hàng |
| `Review` | Đánh giá sản phẩm |
| `Category` / `Brand` | Danh mục, thương hiệu |
| `Coupon` / `CouponUsage` | Mã giảm giá |
| `FlashSaleCampaign` | Chiến dịch flash sale |
| `Notification` | Thông báo người dùng |
| `ReferralCode` / `ReferralCommission` | Hệ thống giới thiệu |
| `LoyaltyTransaction` | Giao dịch điểm thưởng |
| `ChatMessage` / `ChatSession` | Live chat |
| `AiUsageLog` | Log sử dụng AI |
| `EmailQueue` | Hàng đợi email |
| `Post` | Bài viết blog |
| `SystemSetting` | Cài đặt hệ thống |

---

## 🔒 Bảo Mật

- ✅ **Stripe Webhook Signature Verification** — Xác thực chữ ký webhook
- ✅ **XSS Prevention** — DOMPurify + React sanitization
- ✅ **Rate Limiting** — Upstash Redis rate limiter
- ✅ **CSRF Protection** — Next.js built-in
- ✅ **Input Validation** — Zod schemas trên tất cả routes
- ✅ **SQL Injection Prevention** — Prisma ORM parameterized queries
- ✅ **File Upload Validation** — Magic bytes + size limit
- ✅ **Account Lockout** — Khóa tài khoản sau nhiều lần đăng nhập sai
- ✅ **Suspicious Login Alert** — Cảnh báo đăng nhập từ IP mới

---

## 📈 SEO

- ✅ Dynamic metadata cho tất cả pages
- ✅ JSON-LD structured data (Product, BreadcrumbList, CollectionPage, Article)
- ✅ Open Graph + Twitter Cards
- ✅ Hreflang tags (VI/EN) cho 20+ pages
- ✅ Pagination canonical URLs
- ✅ XML Sitemap tự động
- ✅ Robots.txt optimized

---

## 🌍 Đa Ngôn Ngữ

Hỗ trợ **Tiếng Việt** và **English** trên toàn bộ giao diện:

- Product names & descriptions
- Navigation & UI elements
- Error messages & notifications  
- SEO metadata & hreflang tags

---

## 📱 Responsive & PWA

- ✅ Responsive cho Mobile / Tablet / Desktop
- ✅ Service Worker (`public/sw.js`)
- ✅ Web App Manifest (`public/manifest.json`)
- ✅ Installable trên Mobile

---

## 🤝 Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## 📄 Giấy Phép

Dự án được phân phối theo **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👨‍💻 Tác Giả

**Trần Quốc Vũ**  
📧 tranquocvu3011@gmail.com  
🔗 [GitHub](https://github.com/tranquocvu-3011)

---

<p align="center">
  Made with ❤️ by <strong>Trần Quốc Vũ</strong> — LIKEFOOD © 2026
</p>
