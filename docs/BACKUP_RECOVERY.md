# LIKEFOOD - Backup & Disaster Recovery Strategy

## 1. Database Backup

### Tự động backup hàng ngày
```bash
# Crontab entry (chạy lúc 3:00 AM)
0 3 * * * /opt/likefood/scripts/backup-db.sh
```

### Script backup
```bash
#!/bin/bash
# /opt/likefood/scripts/backup-db.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/likefood/backups/db"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup MySQL từ Docker container
docker compose -f /opt/likefood/docker-compose.yml exec -T mysql \
  mysqldump -u likefood -p"${MYSQL_PASSWORD}" weblikefood | \
  gzip > "${BACKUP_DIR}/weblikefood_${TIMESTAMP}.sql.gz"

# Xóa backup cũ hơn 30 ngày
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed: weblikefood_${TIMESTAMP}.sql.gz"
```

### Backup thủ công
```bash
# Export SQL dump
docker compose exec mysql mysqldump -u likefood -p weblikefood > /opt/likefood/backups/manual_$(date +%Y%m%d).sql
```

## 2. Application State Backup

- **Code**: Git repository (GitHub) — tự động version control
- **Environment**: `.env.production` lưu riêng, không commit vào git
- **SSL Certificates**: Certbot auto-renew, backup `/etc/letsencrypt/`
- **Uploads**: User uploads lưu trong `/opt/likefood/public/uploads/` — backup daily

## 3. Disaster Recovery

### Kịch bản 1: Database Corruption
```bash
# 1. Stop app
docker compose stop app

# 2. Restore từ backup gần nhất
gunzip -c /opt/likefood/backups/db/weblikefood_YYYYMMDD.sql.gz | \
  docker compose exec -T mysql mysql -u likefood -p weblikefood

# 3. Restart app
docker compose start app
```

### Kịch bản 2: Server Down
```bash
# 1. Tạo VPS mới
# 2. Clone code
git clone https://github.com/tranquocvu-3011/likefood.git /opt/likefood

# 3. Upload .env.production
# 4. Upload SSL certs
# 5. Restore DB backup
# 6. docker compose up -d --build
```

### Kịch bản 3: SSL Certificate Expired
```bash
sudo certbot renew --force-renewal
sudo cp /etc/letsencrypt/live/likefood.app/fullchain.pem /opt/likefood/nginx/ssl/
sudo cp /etc/letsencrypt/live/likefood.app/privkey.pem /opt/likefood/nginx/ssl/
docker compose restart nginx
```

## 4. Monitoring & Alerts

- **Sentry**: Error tracking tự động (đã tích hợp)
- **Telegram Bot**: Alert new orders, errors → admin channel
- **Health Check**: `/api/health` + `/api/ai/health`
- **Docker healthcheck**: Configured trong docker-compose.yml

## 5. Recovery Time Objectives

| Kịch bản | RTO | RPO |
|----------|-----|-----|
| DB Restore | < 30 phút | 24 giờ (daily backup) |
| Full Server Recovery | < 2 giờ | 24 giờ |
| SSL Renewal | < 5 phút | N/A |
