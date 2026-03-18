# 🏗️ Kiến Trúc Hệ Thống — LIKEFOOD

## Tổng Quan

LIKEFOOD là nền tảng thương mại điện tử được xây dựng trên kiến trúc **monolith hiện đại** sử dụng Next.js App Router, kết hợp Server Components + Client Components, API Routes, và nhiều dịch vụ tích hợp.

```
┌─────────────────────────────────────────────────────────┐
│                       CLIENTS                           │
│  Browser (Desktop/Mobile)  │  PWA  │  Admin Dashboard   │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                 │
│               SSL Termination + Static Files             │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│              NEXT.JS APPLICATION (Port 3000)             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   App Router  │  │  API Routes  │  │  Middleware    │  │
│  │ (Pages/SSR)   │  │ (REST API)   │  │ (Auth/Rate)   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│  ┌──────▼─────────────────▼───────────────────▼───────┐  │
│  │              BUSINESS LOGIC LAYER (src/lib/)        │  │
│  │  commerce.ts │ ai/ │ email/ │ chat/ │ referral/     │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │                   DATA LAYER                        │  │
│  │  Prisma ORM │ Redis Cache │ File Storage            │  │
│  └──────────────────────┬─────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │
     ┌────────────────────┼──────────────────────────┐
     │                    │                          │
┌────▼─────┐    ┌────────▼────────┐    ┌────────────▼──────┐
│  MySQL   │    │  Redis (Upstash)│    │  External APIs     │
│  8.0     │    │  Cache + Rate   │    │ Stripe│OpenAI│SMTP │
│ 43 models│    │  Limiting       │    │ Telegram│Sentry    │
└──────────┘    └─────────────────┘    └───────────────────┘
```

---

## Kiến Trúc Chi Tiết

### 1. Presentation Layer

```
src/app/
├── (shop)/                 # Customer layout group
│   ├── page.tsx            # Homepage
│   ├── products/           # Product listing & detail
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Multi-step checkout
│   ├── profile/            # User dashboard
│   ├── posts/              # Blog system
│   ├── vouchers/           # Voucher center
│   ├── flash-sale/         # Flash sale listing
│   └── rewards/            # Loyalty & referral
├── admin/                  # Admin layout group
│   ├── page.tsx            # Admin dashboard
│   ├── products/           # Product CRUD
│   ├── orders/             # Order management
│   ├── users/              # User management
│   ├── flash-sale/         # Campaign management
│   ├── ai-dashboard/       # AI Command Center
│   ├── live-chat/          # Chat management
│   └── settings/           # System settings
├── login/                  # Auth pages
└── layout.tsx              # Root layout
```

**Nguyên tắc:**
- **Server Components** (mặc định): SSR, SEO, data fetching
- **Client Components** ("use client"): Interactivity, state management
- **Streaming SSR**: Suspense boundaries cho loading states

### 2. API Layer

```
src/app/api/
├── auth/                   # NextAuth + custom auth endpoints
├── products/               # Product CRUD + search
├── orders/                 # Order lifecycle management
├── cart/                   # Cart operations
├── admin/                  # Admin-only endpoints
├── ai/                     # AI chatbot + analytics
│   ├── chat/               # Conversation API
│   ├── admin/              # AI Command Center API
│   └── recommend/          # Product recommendations
├── payments/               # Stripe payment intents
├── webhooks/               # External webhooks (Stripe, Telegram)
├── live-chat/              # WebSocket-like chat
├── notifications/          # Push notifications
└── health/                 # Health check endpoint
```

**Patterns:**
- RESTful design
- Zod input validation
- Standardized error responses (`ApiError`)
- Admin auth middleware (`verifyAdminSession`)
- Rate limiting on public endpoints

### 3. Business Logic Layer

```
src/lib/
├── ai/                     # AI Services
│   ├── ai-provider.ts      # OpenAI client wrapper
│   ├── ai-chatbot.ts       # Chatbot conversation logic
│   ├── ai-data-reader.ts   # Context data reader
│   └── admin-service.ts    # AI analytics (insights, trends)
├── analytics/              # Behavior tracking
│   └── behavior-tracker.ts # Customer behavior events
├── chat/                   # Live Chat
│   └── chat-service.ts     # Chat session management
├── email/                  # Email System
│   ├── email-service.ts    # Transactional emails
│   └── templates/          # HTML email templates
├── i18n/                   # Internationalization
│   ├── translations.ts     # VI/EN translations
│   └── hooks.ts            # useTranslation hook
├── referral/               # Referral System
│   └── referral-service.ts # Commission & tracking
├── validations/            # Zod Schemas
│   └── schemas.ts          # All validation schemas
├── prisma.ts               # Prisma client singleton
├── cache.ts                # Redis cache abstraction
├── ratelimit.ts            # Rate limiter
├── commerce.ts             # Core e-commerce logic
├── admin-auth.ts           # Admin authentication
├── api-error.ts            # Error handling
└── logger.ts               # Structured logging
```

### 4. Component Architecture

```
src/components/
├── admin/                  # Admin-specific components
│   ├── AdminSidebar.tsx    # Navigation sidebar
│   ├── DashboardStats.tsx  # Analytics cards
│   └── ...
├── product/                # Product components
│   ├── ProductCard.tsx     # Product display card
│   ├── ProductFilter.tsx   # Filter sidebar
│   └── ...
├── shared/                 # Shared components
│   ├── Header.tsx          # Site header
│   ├── Footer.tsx          # Site footer
│   ├── ChatbotAI.tsx       # AI chatbot widget
│   └── ...
└── ui/                     # Primitive UI components
    ├── Button.tsx          # Button variants
    ├── Input.tsx           # Form inputs
    ├── Modal.tsx           # Dialog/Modal
    └── ...
```

### 5. Database Schema

**43 models** tổ chức thành các domain:

```
┌─ User Domain ─────────────────────────────────────┐
│  User, Account, Session, VerificationToken        │
│  UserAddress, UserPreference                       │
└───────────────────────────────────────────────────┘

┌─ Product Domain ──────────────────────────────────┐
│  Product, Category, Brand, ProductImage           │
│  ProductVariant, Review, Wishlist                  │
└───────────────────────────────────────────────────┘

┌─ Order Domain ────────────────────────────────────┐
│  Order, OrderItem, Payment                         │
│  ShippingAddress, OrderStatusHistory               │
└───────────────────────────────────────────────────┘

┌─ Marketing Domain ────────────────────────────────┐
│  Coupon, CouponUsage, FlashSaleCampaign           │
│  FlashSaleProduct, EmailCampaign, EmailQueue       │
└───────────────────────────────────────────────────┘

┌─ Engagement Domain ──────────────────────────────-┐
│  LoyaltyTransaction, ReferralCode                  │
│  ReferralCommission, DailyCheckin                  │
│  Notification, BehaviorEvent                       │
└───────────────────────────────────────────────────┘

┌─ Communication Domain ───────────────────────────-┐
│  ChatSession, ChatMessage, AiUsageLog              │
│  Post, KnowledgeBase                               │
└───────────────────────────────────────────────────┘

┌─ System Domain ───────────────────────────────────┐
│  SystemSetting, AuditLog, RateLimit                │
└───────────────────────────────────────────────────┘
```

---

## Luồng Dữ Liệu (Data Flows)

### Checkout Flow

```
Customer → Add to Cart → Apply Voucher → Choose Payment
    │
    ├─ Stripe Payment
    │   └─ Create PaymentIntent → Stripe Checkout → Webhook Confirm
    │
    ├─ COD
    │   └─ Create Order (status: PENDING) → Admin Confirm
    │
    └─ Bank Transfer
        └─ Create Order → Upload Receipt → Admin Verify
    
    → Order Created → Email Confirmation → Telegram Notification
    → Loyalty Points Added → Referral Commission (if applicable)
```

### AI Chatbot Flow

```
User Message → Rate Limit Check → Context Loading
    │
    ├─ Load Product Catalog (Prisma)
    ├─ Load User Order History
    ├─ Load Knowledge Base
    └─ Load Active Promotions
    
    → Build System Prompt → OpenAI GPT-4o API
    → Stream Response → Save to AiUsageLog
```

---

## Tính Nguyên Gốc

### Giải pháp kỹ thuật sáng tạo

1. **AI-Driven E-commerce**: Tích hợp sâu AI vào toàn bộ quy trình kinh doanh — không chỉ chatbot mà còn analytics, content generation, và prospect detection.

2. **Hybrid SSR/CSR Architecture**: Tận dụng Next.js App Router để tối ưu SEO (Server Components) đồng thời giữ UX mượt mà (Client Components + Streaming).

3. **Real-time Multi-channel Communication**: Live Chat + Telegram reply bridge — admin có thể trả lời khách hàng từ Telegram mà không cần mở dashboard.

4. **Gamification Layer**: Loyalty points, daily check-in, referral system tạo engagement loop khuyến khích quay lại.

5. **Serverless-compatible Caching**: Upstash Redis cho phép deploy trên edge/serverless mà vẫn có rate limiting và caching.

---

## Patterns & Best Practices

| Pattern | Áp dụng |
|---------|---------|
| **Repository Pattern** | Prisma services abstract database operations |
| **Middleware Pattern** | Auth, rate limiting, error handling |
| **Strategy Pattern** | Payment methods, email templates |
| **Observer Pattern** | Behavior tracking, notification dispatch |
| **Singleton Pattern** | Prisma client, Redis client |
| **Factory Pattern** | API error responses, email templates |
