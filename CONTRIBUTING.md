# 🤝 Hướng Dẫn Đóng Góp — LIKEFOOD

Cảm ơn bạn đã quan tâm đến dự án LIKEFOOD! Mọi đóng góp đều được chào đón.

## 📋 Mục Lục

- [Code of Conduct](#code-of-conduct)
- [Cách đóng góp](#cách-đóng-góp)
- [Quy trình phát triển](#quy-trình-phát-triển)
- [Tiêu chuẩn code](#tiêu-chuẩn-code)
- [Gửi Pull Request](#gửi-pull-request)
- [Báo lỗi](#báo-lỗi)
- [Đề xuất tính năng](#đề-xuất-tính-năng)

---

## Code of Conduct

Dự án tuân theo [Code of Conduct](CODE_OF_CONDUCT.md). Bằng việc tham gia, bạn đồng ý tuân thủ các quy tắc ứng xử này.

---

## Cách đóng góp

### 🐛 Báo lỗi (Bug Reports)

1. Kiểm tra [Issues](https://github.com/tranquocvu-3011/likefood/issues) xem lỗi đã được báo chưa
2. Nếu chưa, tạo Issue mới với template **Bug Report**
3. Cung cấp đầy đủ:
   - Mô tả lỗi
   - Các bước tái tạo lỗi
   - Kết quả mong đợi vs kết quả thực tế
   - Screenshots / Logs nếu có
   - Môi trường: OS, Browser, Node.js version

### ✨ Đề xuất tính năng (Feature Requests)

1. Tạo Issue mới với template **Feature Request**
2. Mô tả rõ ràng tính năng muốn thêm
3. Giải thích tại sao tính năng này hữu ích
4. Đề xuất cách implementation (nếu có)

### 💻 Đóng góp code

1. Fork repository
2. Tạo branch từ `main`
3. Viết code + tests
4. Gửi Pull Request

---

## Quy trình phát triển

### Thiết lập môi trường

```bash
# 1. Fork & clone repository
git clone https://github.com/<your-username>/likefood.git
cd likefood

# 2. Cài đặt dependencies
npm install

# 3. Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env với thông tin database, API keys

# 4. Khởi tạo database
npx prisma generate
npx prisma db push

# 5. Chạy development server
npm run dev
```

### Branch naming convention

```
feature/  → Tính năng mới (feature/add-payment-method)
fix/      → Sửa lỗi (fix/cart-total-calculation)
docs/     → Tài liệu (docs/update-api-reference)
refactor/ → Tái cấu trúc (refactor/optimize-queries)
test/     → Thêm tests (test/add-order-tests)
chore/    → Maintenance (chore/update-dependencies)
```

### Commit message convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Tài liệu
- `style`: Formatting, missing semicolons
- `refactor`: Tái cấu trúc code
- `test`: Thêm/sửa tests
- `chore`: Build process, tools
- `perf`: Cải thiện performance

**Ví dụ:**
```
feat(cart): add voucher validation at checkout
fix(orders): correct total calculation with discount
docs(readme): update installation instructions
```

---

## Tiêu chuẩn code

### TypeScript

- Sử dụng TypeScript strict mode
- Khai báo types/interfaces cho tất cả props, API responses
- Tránh sử dụng `any`
- Sử dụng Zod schemas cho input validation

### React / Next.js

- Sử dụng functional components + hooks
- Server Components khi có thể (App Router)
- Client Components chỉ khi cần interactivity
- Tách logic phức tạp vào custom hooks

### Styling

- Sử dụng Tailwind CSS 4.x
- Responsive design (mobile-first)
- Dark mode support khi có thể
- Tránh inline styles

### API Routes

- Mọi route phải có try-catch error handling
- Input validation với Zod
- Rate limiting cho public endpoints
- Standardized error responses (`ApiError`)

### Database

- Sử dụng Prisma ORM
- Không viết raw SQL (trừ trường hợp đặc biệt)
- Optimize queries (select, include chỉ fields cần thiết)
- Sử dụng transactions cho operations liên quan

### Testing

```bash
# Chạy tất cả tests
npm run test:run

# Watch mode
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Gửi Pull Request

### Checklist trước khi gửi PR

- [ ] Code tuân theo coding standards của dự án
- [ ] Tự review code trước khi gửi
- [ ] Tests pass (`npm run test:run`)
- [ ] Type check pass (`npm run type-check`)
- [ ] Lint pass (`npm run lint`)
- [ ] Có mô tả rõ ràng về thay đổi
- [ ] Cập nhật tài liệu nếu cần
- [ ] Screenshots cho UI changes

### Quy trình review

1. Ít nhất 1 reviewer approve
2. CI/CD pipeline pass
3. Không có conflicts với `main`
4. Squash merge vào `main`

---

## 🏗 Kiến trúc dự án

```
src/
├── app/                    # Next.js App Router (pages + API)
├── components/             # React Components
├── lib/                    # Core business logic & utilities
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

Xem chi tiết tại [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📞 Liên hệ

Nếu có thắc mắc, liên hệ:

- **Email**: tranquocvu3011@gmail.com
- **GitHub Issues**: [likefood/issues](https://github.com/tranquocvu-3011/likefood/issues)

---

Cảm ơn bạn đã đóng góp! 🍜❤️
