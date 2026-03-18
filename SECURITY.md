# 🔒 Chính Sách Bảo Mật — LIKEFOOD

## Báo cáo lỗ hổng bảo mật

Nếu bạn phát hiện lỗ hổng bảo mật, **KHÔNG** tạo public issue. Thay vào đó, vui lòng gửi email đến:

📧 **tranquocvu3011@gmail.com**

### Thông tin cần cung cấp

1. **Mô tả lỗ hổng**: Loại lỗ hổng (XSS, SQL Injection, CSRF, etc.)
2. **Các bước tái tạo**: Hướng dẫn chi tiết để tái tạo lỗ hổng
3. **Mức độ ảnh hưởng**: Đánh giá mức độ nghiêm trọng
4. **Proof of concept**: Code hoặc screenshots (nếu có)
5. **Đề xuất fix**: Giải pháp khắc phục (nếu có)

### Thời gian phản hồi

| Bước | Thời gian |
|------|-----------|
| Xác nhận nhận báo cáo | 24 giờ |
| Đánh giá ban đầu | 72 giờ |
| Phát hành bản vá | 7-14 ngày |
| Công bố công khai | Sau khi bản vá được phát hành |

## Các biện pháp bảo mật hiện tại

### Authentication & Authorization
- ✅ NextAuth.js với session management an toàn
- ✅ Password hashing (bcrypt)
- ✅ Account lockout sau nhiều lần đăng nhập sai
- ✅ Magic link authentication (passwordless)
- ✅ Google OAuth 2.0
- ✅ Suspicious login detection & alert

### Input Validation & Sanitization
- ✅ Zod schemas cho tất cả API inputs
- ✅ DOMPurify cho XSS prevention
- ✅ Content sanitization cho user-generated content
- ✅ File upload validation (magic bytes + size limit)

### API Security
- ✅ Rate limiting (Upstash Redis)
- ✅ CSRF protection (Next.js built-in)
- ✅ Stripe webhook signature verification
- ✅ Admin authentication middleware
- ✅ Error response standardization (không leak stack traces)

### Database Security
- ✅ Prisma ORM (parameterized queries → SQL injection prevention)
- ✅ No raw SQL queries
- ✅ Sensitive data không được log

### Infrastructure
- ✅ HTTPS/SSL (Nginx + Let's Encrypt)
- ✅ Environment variables cho secrets
- ✅ Docker container isolation
- ✅ Sentry error tracking (không gửi sensitive data)

## Phiên bản được hỗ trợ

| Phiên bản | Hỗ trợ bảo mật |
|-----------|-----------------|
| 1.0.x | ✅ Được hỗ trợ |
| < 1.0 | ❌ Không được hỗ trợ |

## Dependencies Security

Chúng tôi thường xuyên kiểm tra và cập nhật dependencies để đảm bảo không có lỗ hổng bảo mật đã biết:

```bash
# Kiểm tra lỗ hổng trong dependencies
npm audit

# Tự động fix lỗ hổng
npm audit fix
```

---

Cảm ơn bạn đã giúp giữ LIKEFOOD an toàn! 🔐
