# 📚 Danh Sách Thư Viện & Dependencies — LIKEFOOD

Tài liệu này liệt kê tất cả thư viện và packages được sử dụng trong dự án LIKEFOOD, kèm theo vai trò, giấy phép, và lý do sử dụng.

---

## Production Dependencies

### Core Framework

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [next](https://nextjs.org/) | 16.1.6 | MIT | React meta-framework (App Router, SSR, API Routes) |
| [react](https://react.dev/) | 19.2.3 | MIT | UI library |
| [react-dom](https://react.dev/) | 19.2.3 | MIT | React DOM renderer |

### Database & ORM

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [@prisma/client](https://www.prisma.io/) | 6.4.0 | Apache-2.0 | Type-safe ORM cho MySQL |

### Authentication

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [next-auth](https://next-auth.js.org/) | 4.24.13 | ISC | Authentication framework (Email, Google OAuth) |
| [@next-auth/prisma-adapter](https://next-auth.js.org/) | 1.0.7 | ISC | Prisma adapter cho NextAuth |
| [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) | 3.0.3 | MIT | Password hashing |

### Payment

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [stripe](https://stripe.com/) | 17.7.0 | MIT | Server-side Stripe API |
| [@stripe/stripe-js](https://stripe.com/) | 4.10.0 | MIT | Client-side Stripe.js |
| [@stripe/react-stripe-js](https://stripe.com/) | 4.0.0 | MIT | React components cho Stripe |

### AI & ML

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [openai](https://openai.com/) | 6.29.0 | Apache-2.0 | OpenAI API client (GPT-4o) |

### Caching & Rate Limiting

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [@upstash/redis](https://upstash.com/) | 1.36.2 | MIT | Serverless Redis client |
| [@upstash/ratelimit](https://upstash.com/) | 2.0.8 | MIT | Rate limiting middleware |

### UI & Styling

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [lucide-react](https://lucide.dev/) | 0.563.0 | ISC | Icon library |
| [framer-motion](https://www.framer.com/motion/) | 12.33.0 | MIT | Animation library |
| [radix-ui](https://www.radix-ui.com/) | 1.4.3 | MIT | Accessible UI primitives |
| [class-variance-authority](https://cva.style/) | 0.7.1 | Apache-2.0 | Variant-based component styling |
| [clsx](https://github.com/lukeed/clsx) | 2.1.1 | MIT | Conditional CSS class names |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | 3.4.0 | MIT | Merge Tailwind CSS classes |
| [sonner](https://sonner.emilkowal.dev/) | 2.0.7 | MIT | Toast notifications |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | 1.9.4 | ISC | Confetti animation effects |
| [qrcode](https://github.com/soldair/node-qrcode) | 1.5.4 | MIT | QR code generation |

### Content & Markup

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [react-markdown](https://remarkjs.github.io/react-markdown/) | 10.1.0 | MIT | Markdown renderer |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | 4.0.1 | MIT | GitHub Flavored Markdown |

### Security

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [dompurify](https://github.com/cure53/DOMPurify) | 3.3.3 | Apache-2.0/MPL-2.0 | XSS sanitization |
| [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify) | 3.3.0 | MIT | Server/client DOMPurify |
| [zod](https://zod.dev/) | 4.3.6 | MIT | Runtime type validation |

### Utilities

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [date-fns](https://date-fns.org/) | 4.1.0 | MIT | Date manipulation |
| [nodemailer](https://nodemailer.com/) | 7.0.13 | MIT-0 | Email sending |
| [@t3-oss/env-nextjs](https://env.t3.gg/) | 0.13.10 | MIT | Type-safe environment variables |

### Monitoring

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [@sentry/nextjs](https://sentry.io/) | 10.43.0 | MIT | Error tracking & monitoring |

---

## DevDependencies

### Build & Compile

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [typescript](https://www.typescriptlang.org/) | 5.x | Apache-2.0 | TypeScript compiler |
| [tailwindcss](https://tailwindcss.com/) | 4.x | MIT | CSS utility framework |
| [@tailwindcss/postcss](https://tailwindcss.com/) | 4.x | MIT | PostCSS plugin cho Tailwind |
| [tw-animate-css](https://github.com/nicolo-ribaudo/tw-animate-css) | 1.4.0 | MIT | Tailwind animation utilities |
| [tsx](https://github.com/privatenumber/tsx) | 4.21.0 | MIT | TypeScript executor (cho Prisma seed) |

### Testing

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [vitest](https://vitest.dev/) | 4.0.18 | MIT | Unit & integration testing |
| [@playwright/test](https://playwright.dev/) | 1.58.2 | Apache-2.0 | E2E testing |
| [@testing-library/react](https://testing-library.com/) | 16.3.2 | MIT | React component testing |
| [@testing-library/jest-dom](https://testing-library.com/) | 6.9.1 | MIT | Custom Jest matchers |
| [@testing-library/user-event](https://testing-library.com/) | 14.6.1 | MIT | User event simulation |
| [jsdom](https://github.com/jsdom/jsdom) | 28.1.0 | MIT | Browser environment for testing |

### Analysis & Linting

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [eslint](https://eslint.org/) | 8.57.0 | MIT | Code linting |
| [eslint-config-next](https://nextjs.org/) | 15.0.0 | MIT | Next.js ESLint rules |
| [@next/bundle-analyzer](https://nextjs.org/) | 16.1.6 | MIT | Bundle size analysis |

### Type Definitions

| Package | Version | Vai trò |
|---------|---------|---------|
| @types/node | 20.x | Node.js types |
| @types/react | 19.x | React types |
| @types/react-dom | 19.x | React DOM types |
| @types/bcryptjs | 2.4.6 | bcryptjs types |
| @types/canvas-confetti | 1.9.0 | canvas-confetti types |
| @types/dompurify | 3.0.5 | DOMPurify types |
| @types/nodemailer | 7.0.9 | Nodemailer types |

### Database Tools

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [prisma](https://www.prisma.io/) | 6.4.0 | Apache-2.0 | Prisma CLI (migrate, generate, studio) |

### Performance

| Package | Version | Giấy phép | Vai trò |
|---------|---------|-----------|---------|
| [web-vitals](https://github.com/GoogleChrome/web-vitals) | 5.1.0 | Apache-2.0 | Core Web Vitals measurement |

---

## Tương thích giấy phép

Tất cả dependencies sử dụng giấy phép tương thích với **MIT License** của dự án:

| Giấy phép | Số packages | Tương thích MIT? |
|-----------|-------------|------------------|
| MIT | 32 | ✅ Có |
| Apache-2.0 | 6 | ✅ Có |
| ISC | 4 | ✅ Có |
| MIT-0 | 1 | ✅ Có |
| MPL-2.0 | 1 (dual-licensed) | ✅ Có (dùng Apache-2.0) |

> **Không có xung đột giấy phép** — Tất cả dependencies đều sử dụng giấy phép permissive, hoàn toàn tương thích với MIT License.

---

## Cập nhật Dependencies

```bash
# Kiểm tra outdated packages
npm outdated

# Cập nhật minor/patch versions
npm update

# Kiểm tra security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

---

## System Dependencies

Dự án sử dụng các system-level dependencies sau:

| Dependency | Vai trò | Cài đặt |
|------------|---------|---------|
| MySQL 8.0+ | Relational database | `apt install mysql-server` |
| Node.js 20+ | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| Git | Version control | `apt install git` |
| Docker (optional) | Container runtime | [docker.com](https://docs.docker.com/get-docker/) |
| Nginx (optional) | Reverse proxy | `apt install nginx` |
