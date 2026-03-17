# ─────────────────────────────────────────────────────────
# Stage 1: deps — install production dependencies only
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

# ─────────────────────────────────────────────────────────
# Stage 2: builder — compile the Next.js app
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install Prisma CLI globally FIRST with exact version
RUN npm install -g prisma@6.4.0

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies FIRST, then downgrade Prisma to 6.4.0
RUN npm install && \
    npm install prisma@6.4.0 @prisma/client@6.4.0 --save-exact

COPY . .

# Copy production env so NEXT_PUBLIC_* vars are inlined during build
# These vars (Turnstile, Stripe, GA, domain URLs) are baked into client JS
COPY .env.production .env.production
COPY .env.production .env

# Generate Prisma client first (needed at build time)
# Use local prisma instead of npx to avoid downloading newer version
RUN ./node_modules/.bin/prisma generate

# Skip env validation during Docker build - set BEFORE build
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true

# Limit Node.js memory to avoid OOM on low-memory VPS
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Build Next.js (standalone output for minimal image)
# Use webpack instead of turbopack by setting environment variable
RUN TURBOPACK=0 npm run build
# ─────────────────────────────────────────────────────────
# Stage 3: runner — minimal production image
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

# Copy only what's needed from the builder
COPY --from=builder /app/public ./public

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client (generated into src/generated/client)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# DEV-001: Only copy required Prisma engine binaries instead of ALL node_modules
# The standalone output already includes necessary node_modules
# We only need the Prisma query engine for runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Add node_modules/.bin to PATH so 'prisma' command works
ENV PATH="/app/node_modules/.bin:${PATH}"

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
