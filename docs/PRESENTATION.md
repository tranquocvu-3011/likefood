# 🎤 Hướng Dẫn Trình Diễn Sản Phẩm — LIKEFOOD

> Tài liệu hướng dẫn showcase sản phẩm tại cuộc thi / demo cho khách hàng.

---

## ⏱️ Thời Lượng Đề Xuất: 10-15 phút

## Cấu Trúc Trình Bày

### Phần 1: Giới Thiệu (2 phút)

**Slide 1 — Title**
- Tên dự án: LIKEFOOD — Nền Tảng Thương Mại Điện Tử Đặc Sản Việt Nam
- Team / Tác giả
- Logo + tagline

**Slide 2 — Bài toán**
- Thị trường đặc sản Việt Nam tại Mỹ còn phân mảnh
- Khách hàng Việt kiều khó tìm mua đặc sản quê nhà
- Các nền tảng hiện tại thiếu trải nghiệm thân thiện & AI

**Slide 3 — Giải pháp**
- LIKEFOOD: One-stop platform cho đặc sản Việt Nam
- Tích hợp AI ChatGPT tư vấn mua hàng
- Đa ngôn ngữ, thanh toán quốc tế
- Hệ thống gamification (loyalty, referral, flash sale)

---

### Phần 2: Demo Live (6-8 phút)

#### Flow 1: Trải Nghiệm Khách Hàng (3 phút)

```
1. Trang chủ
   - Design hiện đại, responsive
   - Flash sale slider, sản phẩm nổi bật
   
2. Tìm kiếm & Lọc
   - Search "bánh tráng" → search hints
   - Filter theo danh mục, giá, rating
   
3. Chi tiết sản phẩm
   - Gallery, mô tả, đánh giá
   - Sản phẩm liên quan
   
4. AI Chatbot
   - Hỏi: "Gợi ý đặc sản để làm quà tặng Tết"
   - Hỏi: "So sánh 2 sản phẩm này"
   - Demo multilingual (hỏi tiếng Anh)
   
5. Checkout
   - Thêm giỏ hàng → Apply voucher
   - Thanh toán Stripe (test mode)
```

#### Flow 2: Admin Dashboard (3 phút)

```
1. Dashboard overview
   - Thống kê doanh thu, đơn hàng
   - Biểu đồ realtime
   
2. AI Command Center
   - Tab Insights: Phân tích kinh doanh
   - Tab Trends: Xu hướng sản phẩm
   - Tab Prospects: Khách hàng tiềm năng
   
3. Live Chat
   - Demo trả lời khách hàng
   - Demo reply từ Telegram
   
4. Quản lý sản phẩm
   - Thêm/sửa sản phẩm
   - AI Content Generator
```

#### Flow 3: Điểm Nhấn Kỹ Thuật (2 phút)

```
1. Performance
   - Lighthouse score
   - Server-side rendering
   
2. PWA
   - Install on mobile
   - Offline capability
   
3. Security
   - Rate limiting demo
   - Input validation
```

---

### Phần 3: Kiến Trúc & Công Nghệ (2 phút)

**Slide — Architecture Diagram**
- Next.js App Router + Prisma + MySQL
- Tích hợp: OpenAI, Stripe, Sentry, Telegram

**Slide — Tech Stack Highlights**
- 43 database models
- 166+ API endpoints
- 212 automated tests
- Docker deployment

**Slide — Open Source Readiness**
- MIT License
- Comprehensive documentation
- CI/CD pipeline
- Contributor guidelines

---

### Phần 4: Q&A (2 phút)

---

## 📋 Checklist Chuẩn Bị Demo

### Trước demo 1 ngày
- [ ] Kiểm tra server hoạt động ổn định
- [ ] Chuẩn bị dữ liệu demo (sản phẩm, đơn hàng, users)
- [ ] Test AI Chatbot hoạt động (OpenAI API key hợp lệ)
- [ ] Test Stripe payment (test mode)
- [ ] Chuẩn bị slides

### Trước demo 1 giờ
- [ ] Mở browser tabs sẵn sàng
- [ ] Login admin account
- [ ] Clear browser cache
- [ ] Kiểm tra internet connection
- [ ] Test microphone & screen sharing

### Tabs cần mở sẵn
1. Homepage: `https://your-domain.com`
2. Admin: `https://your-domain.com/admin`
3. GitHub repo: `https://github.com/tranquocvu-3011/likefood`
4. Terminal (PM2/Docker logs nếu cần)

---

## 🎯 Điểm Nhấn Quan Trọng Khi Trình Bày

### Tính nguyên gốc (TC7 - 10đ)
- Nhấn mạnh AI integration sâu (không chỉ chatbot)
- Hybrid SSR/CSR architecture
- Real-time Telegram bridge communication

### Mức độ hoàn thiện (TC8 - 10đ)
- Demo đầy đủ flow mua hàng end-to-end
- Admin dashboard chuyên nghiệp
- Error handling, loading states

### Sử dụng thân thiện (TC9 - 10đ)
- Responsive design (demo trên mobile)
- AI chatbot hỗ trợ 24/7
- Đa ngôn ngữ

### Phát triển bền vững (TC10 - 10đ)
- Roadmap rõ ràng
- Documentation đầy đủ
- Test suite
- CI/CD pipeline

### Phong cách trình diễn (TC11 - 10đ)
- Tự tin, rõ ràng
- Demo live, không dùng video
- Có backup plan nếu lỗi
- Kết thúc đúng giờ
