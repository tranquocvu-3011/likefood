# 📦 Hướng Dẫn Cài Đặt Chi Tiết — LIKEFOOD

## Mục Lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt Development](#cài-đặt-development)
- [Cài đặt Production (Docker)](#cài-đặt-production-docker)
- [Cài đặt Production (VPS)](#cài-đặt-production-vps)
- [Cấu hình Environment](#cấu-hình-environment)
- [Khởi tạo Database](#khởi-tạo-database)
- [Xác minh cài đặt](#xác-minh-cài-đặt)
- [Khắc phục sự cố](#khắc-phục-sự-cố)

---

## Yêu cầu hệ thống

### Phần mềm bắt buộc

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|-----------|---------------------|---------|
| **Node.js** | >= 20.0.0 | Khuyến nghị LTS |
| **npm** | >= 10.0.0 | Đi kèm Node.js |
| **MySQL** | 8.0+ | Hoặc MariaDB 10.5+ |
| **Git** | >= 2.30 | Quản lý mã nguồn |

### Phần mềm tùy chọn

| Phần mềm | Vai trò |
|-----------|---------|
| **Docker** + Docker Compose | Containerized deployment |
| **Redis** | Caching & Rate limiting (hoặc dùng Upstash cloud) |
| **Nginx** | Reverse proxy + SSL |
| **PM2** | Process management |
| **Certbot** | SSL certificate |

### Tài khoản dịch vụ (tùy chọn)

| Dịch vụ | Vai trò | Bắt buộc? |
|---------|---------|-----------|
| **OpenAI** | AI Chatbot (GPT-4o) | Không (chatbot sẽ disabled) |
| **Stripe** | Thanh toán thẻ quốc tế | Không (dùng COD/chuyển khoản) |
| **Upstash** | Redis cloud (rate limiting) | Không (fallback in-memory) |
| **Sentry** | Error tracking | Không |
| **Google OAuth** | Đăng nhập Google | Không |
| **Cloudflare Turnstile** | CAPTCHA | Không |

---

## Cài đặt Development

### Bước 1: Clone repository

```bash
git clone https://github.com/tranquocvu-3011/likefood.git
cd likefood
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

Lệnh này sẽ tự động:
- Cài đặt tất cả packages trong `package.json`
- Chạy `npx prisma generate` (postinstall script) để tạo Prisma Client

### Bước 3: Cấu hình environment

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` — xem [Cấu hình Environment](#cấu-hình-environment) bên dưới.

### Bước 4: Khởi tạo database

```bash
# Tạo database (MySQL CLI)
mysql -u root -p -e "CREATE DATABASE weblikefood CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Push Prisma schema lên database
npx prisma db push

# HOẶC: Import từ SQL dump (có sẵn dữ liệu)
mysql -u root -p weblikefood < weblikefood.sql
```

### Bước 5: Chạy development server

```bash
npm run dev
```

Truy cập: **http://localhost:3000**

### Bước 5b: Turbopack mode (nhanh hơn)

```bash
npm run dev:turbo
```

---

## Cài đặt Production (Docker)

### Bước 1: Clone & cấu hình

```bash
git clone https://github.com/tranquocvu-3011/likefood.git
cd likefood
cp .env.example .env.production
# Chỉnh sửa .env.production với thông tin production
```

### Bước 2: Build & start services

```bash
docker compose up -d --build
```

### Bước 3: Import database

```bash
docker compose exec -T mysql mysql -u likefood -p weblikefood < weblikefood.sql
```

### Docker Services

| Service | Port | Mô tả |
|---------|------|--------|
| `app` | 3000 | Next.js Application |
| `mysql` | 3306 | MySQL 8.0 Database |
| `redis` | 6379 | Redis Cache |
| `nginx` | 80/443 | Reverse Proxy + SSL |
| `phpmyadmin` | 8080 | Database Management UI |

### Kiểm tra logs

```bash
docker compose logs -f app
docker compose logs -f mysql
```

---

## Cài đặt Production (VPS)

### Bước 1: Cài đặt prerequisites trên VPS

```bash
# Cài đặt Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt MySQL 8
sudo apt-get install -y mysql-server

# Cài đặt PM2
sudo npm install -g pm2

# Cài đặt Nginx
sudo apt-get install -y nginx
```

### Bước 2: Clone & setup

```bash
cd /opt
git clone https://github.com/tranquocvu-3011/likefood.git
cd likefood

npm install
cp .env.example .env.production
# Chỉnh sửa .env.production
```

### Bước 3: Build production

```bash
npm run build
```

### Bước 4: Start với PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Bước 5: Cấu hình Nginx

```bash
sudo cp nginx/likefood.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/likefood.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 6: SSL Certificate

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Cấu hình Environment

### Biến bắt buộc

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/weblikefood"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"    # Production: https://your-domain.com
NEXTAUTH_SECRET="generate-random-32-chars"
```

### Biến tùy chọn

```env
# Stripe (thanh toán thẻ quốc tế)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI (AI Chatbot)
OPENAI_API_KEY="sk-..."

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Telegram (thông báo admin)
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."

# Sentry (error tracking)
SENTRY_DSN="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Tạo NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Khởi tạo Database

### Option A: Schema only (database trống)

```bash
npx prisma db push
```

### Option B: Import SQL dump (có dữ liệu mẫu)

```bash
mysql -u user -p weblikefood < weblikefood.sql
```

### Option C: Migration (production)

```bash
npx prisma migrate deploy
```

### Kiểm tra database

```bash
# Mở Prisma Studio (GUI)
npx prisma studio
```

---

## Xác minh cài đặt

### 1. Health check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-18T..."
}
```

### 2. Chạy tests

```bash
# Unit & Integration tests
npm run test:run

# Type checking
npm run type-check

# Linting
npm run lint
```

### 3. Kiểm tra trang web

- Homepage: http://localhost:3000
- Admin: http://localhost:3000/admin
- API: http://localhost:3000/api/products

---

## Khắc phục sự cố

### Lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `ECONNREFUSED` MySQL | MySQL chưa chạy | `sudo systemctl start mysql` |
| `Prisma Client not generated` | Chưa generate | `npx prisma generate` |
| `Port 3000 in use` | Port bị chiếm | `npx kill-port 3000` hoặc đổi port |
| `Module not found` | Dependencies chưa cài | `rm -rf node_modules && npm install` |
| `Invalid DATABASE_URL` | Sai connection string | Kiểm tra user/password/database name |

### Reset toàn bộ

```bash
# Xóa cache & rebuild
rm -rf .next node_modules
npm install
npx prisma generate
npm run dev
```

### Logs & Debug

```bash
# Next.js debug mode
DEBUG=* npm run dev

# PM2 logs
pm2 logs likefood

# Docker logs
docker compose logs -f
```

---

## Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra [Issues](https://github.com/tranquocvu-3011/likefood/issues)
2. Tạo Issue mới với thông tin chi tiết
3. Email: tranquocvu3011@gmail.com
