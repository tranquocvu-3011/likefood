#!/bin/bash
# ============================================================
# LIKEFOOD - VPS Setup Script
# Chạy trực tiếp trên VPS sau khi SSH vào
# ============================================================
# Cách dùng:
#   ssh root@180.93.2.63
#   curl -fsSL https://raw.githubusercontent.com/tranquocvu-3011/likefood/main/scripts/vps-init.sh | bash
# HOẶC upload file và chạy:
#   bash /opt/vps-init.sh
# ============================================================

set -e  # Dừng nếu có lỗi

DOMAIN="likefood.vudev.io.vn"
REPO_URL="https://github.com/tranquocvu-3011/likefood.git"
APP_DIR="/opt/likefood"
EMAIL="admin@${DOMAIN}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}==>  $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓  $1${NC}"; }
warn() { echo -e "${YELLOW}  !  $1${NC}"; }
err()  { echo -e "${RED}  ✗  $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  LIKEFOOD VPS SETUP - $DOMAIN  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Cập nhật hệ thống ────────────────────────────────────
log "Cập nhật hệ thống..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw
ok "Hệ thống đã cập nhật"

# ── 2. Cài Docker ───────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Cài Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    ok "Docker đã cài: $(docker --version)"
else
    ok "Docker đã có: $(docker --version)"
fi

# ── 3. Firewall ─────────────────────────────────────────────
log "Cấu hình firewall..."
ufw allow OpenSSH    >/dev/null
ufw allow 80/tcp     >/dev/null
ufw allow 443/tcp    >/dev/null
ufw --force enable   >/dev/null
ok "Firewall: SSH, HTTP, HTTPS đã mở"

# ── 4. Clone hoặc cập nhật code ─────────────────────────────
log "Lấy code từ GitHub..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git pull origin main
    ok "Code đã cập nhật"
else
    mkdir -p "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    ok "Code đã clone về $APP_DIR"
fi

# ── 5. Kiểm tra .env.production ─────────────────────────────
log "Kiểm tra file .env.production..."
if [ ! -f "$APP_DIR/.env.production" ]; then
    warn ".env.production chưa có! Upload từ máy local:"
    echo ""
    echo -e "  ${YELLOW}scp .env.production root@$(curl -s ifconfig.me):${APP_DIR}/.env.production${NC}"
    echo ""
    read -p "Nhấn ENTER sau khi upload xong..." -n 1 -r
    echo ""
fi

if [ ! -f "$APP_DIR/.env.production" ]; then
    err ".env.production vẫn chưa có. Không thể tiếp tục."
fi
ok ".env.production đã có"

# ── 6. SSL Certificate ──────────────────────────────────────
log "Lấy SSL Certificate cho $DOMAIN..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    ok "SSL đã có sẵn"
else
    # Kiểm tra DNS trước
    CURRENT_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1)
    VPS_IP=$(curl -s ifconfig.me)
    if [ "$CURRENT_IP" != "$VPS_IP" ]; then
        warn "DNS chưa trỏ về server này!"
        warn "IP server: $VPS_IP | IP DNS hiện tại: $CURRENT_IP"
        warn "Cần cập nhật DNS trước rồi chạy lại script."
        warn "Tạm thời bỏ qua SSL, sẽ dùng HTTP..."
        SKIP_SSL=true
    else
        apt-get install -y -qq certbot
        certbot certonly --standalone \
            -d "$DOMAIN" -d "www.$DOMAIN" \
            --non-interactive --agree-tos \
            -m "$EMAIL" --no-eff-email
        ok "SSL certificate đã lấy thành công"
    fi
fi

# Copy cert vào thư mục nginx nếu có
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    mkdir -p "$APP_DIR/nginx/ssl"
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$APP_DIR/nginx/ssl/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$APP_DIR/nginx/ssl/"
    chmod 644 "$APP_DIR/nginx/ssl/"*.pem
    ok "SSL cert đã copy vào nginx/ssl/"
fi

# ── 7. Khởi động Docker Compose ─────────────────────────────
cd "$APP_DIR"
log "Build và khởi động ứng dụng..."
docker compose --env-file .env.production up -d --build
ok "Các container đã khởi động"

# ── 8. Chờ DB và push schema ────────────────────────────────
log "Chờ MySQL khởi động (30 giây)..."
sleep 30

log "Tạo database schema..."
if docker compose exec -T app npx prisma db push --accept-data-loss 2>&1; then
    ok "Database schema đã tạo"
else
    warn "Prisma db push thất bại. Thử lại sau bằng:"
    echo "  cd $APP_DIR && docker compose exec app npx prisma db push --accept-data-loss"
fi

# ── 9. Tự động gia hạn SSL ──────────────────────────────────
if [ "${SKIP_SSL}" != "true" ]; then
    log "Cài cron gia hạn SSL tự động..."
    CRON_CMD="0 3 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/nginx/ssl/ && docker compose -f $APP_DIR/docker-compose.yml exec nginx nginx -s reload 2>/dev/null"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -
    ok "Cron SSL renewal đã cài"
fi

# ── Hoàn tất ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  DEPLOY HOÀN TẤT!                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Trạng thái containers:"
docker compose ps
echo ""
echo -e "Kiểm tra ứng dụng: ${CYAN}https://$DOMAIN${NC}"
echo ""
echo "Log ứng dụng (10 dòng cuối):"
docker compose logs --tail=10 app
