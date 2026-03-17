# LIKEFOOD Deployment Runbook

## DOC-002: Hướng dẫn triển khai, rollback, và xử lý sự cố

---

## 1. Pre-deployment Checklist

- [ ] Tất cả tests pass locally: `npm test -- --run`
- [ ] Type-check pass: `npm run type-check`
- [ ] Lint pass: `npm run lint`
- [ ] `.env.production` đã cập nhật đầy đủ
- [ ] Database backup đã chạy: `bash scripts/backup-db.sh`
- [ ] Prisma migrations đã review: `npx prisma migrate status`

## 2. Deployment Steps

### 2.1 Docker Deployment (Recommended)

```bash
# 1. SSH vào server
ssh user@server

# 2. Pull latest code
cd /opt/likefood
git pull origin main

# 3. Build Docker image
docker compose build --no-cache app

# 4. Run database migrations
docker compose run --rm app npx prisma migrate deploy

# 5. Deploy with zero downtime
docker compose up -d app

# 6. Verify health
curl -H "x-health-secret: $HEALTH_SECRET" http://localhost:3000/api/health

# 7. Check logs
docker compose logs -f --tail=50 app
```

### 2.2 Direct Deployment (PM2)

```bash
# 1. Pull code
git pull origin main

# 2. Install deps
npm ci

# 3. Generate Prisma
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Build
npm run build

# 6. Restart
pm2 restart ecosystem.config.js
```

## 3. Rollback Procedure

### Quick Rollback (< 5 min)

```bash
# 1. Revert to previous Docker image
docker compose down app
docker tag weblikefood:latest weblikefood:rollback
docker tag weblikefood:previous weblikefood:latest
docker compose up -d app

# 2. Verify
curl http://localhost:3000/api/health
```

### Database Rollback

```bash
# 1. Stop app
docker compose down app

# 2. Restore from backup
mysql -h localhost -u root -p likefood < backups/likefood_YYYYMMDD_HHMMSS.sql

# 3. Restart
docker compose up -d app
```

## 4. Incident Response

### Site Down
1. Check health: `curl http://localhost:3000/api/health`
2. Check containers: `docker compose ps`
3. Check logs: `docker compose logs --tail=100 app`
4. Check DB: `docker compose exec mysql mysqladmin ping`
5. Check Redis: `docker compose exec redis redis-cli ping`
6. Restart if needed: `docker compose restart app`

### Database Issues
1. Check connection: `docker compose exec mysql mysqladmin status`
2. Check disk: `df -h`
3. Check slow queries: `docker compose exec mysql mysqladmin processlist`

### High Memory / CPU
1. Check: `docker stats`
2. Check Node.js heap: review application logs for OOM
3. Restart with limits: `docker compose restart app`

## 5. Monitoring

- Health endpoint: `GET /api/health` (requires `x-health-secret` header)
- Nginx logs: `/var/log/nginx/access.log`
- App logs: `docker compose logs app`
- MySQL logs: `docker compose logs mysql`

## 6. Environment Variables

All required env vars are in `.env.example`. Critical ones for production:

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | ✅ | MySQL connection string |
| NEXTAUTH_SECRET | ✅ | JWT signing secret (≥32 chars) |
| NEXTAUTH_URL | ✅ | Public app URL |
| STRIPE_SECRET_KEY | ✅ | Stripe API key |
| STRIPE_WEBHOOK_SECRET | ✅ | Stripe webhook signing secret |
| UPSTASH_REDIS_REST_URL | ✅ | Upstash Redis URL |
| UPSTASH_REDIS_REST_TOKEN | ✅ | Upstash Redis token |
| SMTP_HOST | ✅ | Email SMTP host |
