#!/usr/bin/env pwsh
# ============================================================
# LIKEFOOD - VPS Deploy Script (chạy từ máy local Windows)
# ============================================================
# Yêu cầu: OpenSSH cài sẵn trong Windows (Win10/11 có sẵn)
# Cách chạy: .\scripts\deploy-vps.ps1
# ============================================================

$VPS_IP   = "180.93.2.63"
$VPS_USER = "root"
$DOMAIN   = "hoiucngocrong.shop"
$REPO_URL = "https://github.com/tranquocvu-3011/likefood.git"
$APP_DIR  = "/opt/likefood"

# ── Màu sắc output ──────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  ✓ $msg"   -ForegroundColor Green }
function Write-Err   { param($msg) Write-Host "  ✗ $msg"   -ForegroundColor Red }
function Write-Warn  { param($msg) Write-Host "  ! $msg"   -ForegroundColor Yellow }

# ── Kiểm tra SSH ────────────────────────────────────────────
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Err "Không tìm thấy lệnh ssh. Cài OpenSSH Feature trên Windows."
    exit 1
}

# ── Kiểm tra file .env.production tồn tại ───────────────────
$envFile = Join-Path $PSScriptRoot "..\env.production"
if (-not (Test-Path $envFile)) {
    $envFile = Join-Path (Split-Path $PSScriptRoot) ".env.production"
}
if (-not (Test-Path $envFile)) {
    Write-Err "Không tìm thấy file .env.production! Kiểm tra lại vị trí file."
    exit 1
}

# ── Nhập password VPS ───────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  LIKEFOOD VPS DEPLOYMENT SCRIPT               ║" -ForegroundColor Yellow
Write-Host "║  Server: $VPS_IP  Domain: $DOMAIN    ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Warn "Đảm bảo bạn đã đổi mật khẩu VPS trước khi chạy script này!"
Write-Host ""
$sshPass = Read-Host "Nhập mật khẩu VPS ($VPS_USER@$VPS_IP)" -AsSecureString
$plainPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sshPass)
)

# ── Hàm SSH ─────────────────────────────────────────────────
function Invoke-SSH {
    param(
        [string]$Command,
        [string]$Description = ""
    )
    if ($Description) { Write-Step $Description }
    # Dùng sshpass nếu có, nếu không thì hướng dẫn dùng SSH key
    $result = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 `
        "${VPS_USER}@${VPS_IP}" $Command 2>&1
    return $result
}

# ── Kiểm tra kết nối SSH ─────────────────────────────────────
Write-Step "Kiểm tra kết nối SSH tới VPS..."

# Cài sshpass (dùng WSL hoặc yêu cầu dùng SSH key)
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
$useKey = Test-Path $sshKeyPath

if (-not $useKey) {
    Write-Warn "Không tìm thấy SSH key tại $sshKeyPath"
    Write-Warn "Script sẽ mở cửa sổ SSH để bạn nhập lệnh thủ công."
    Write-Host ""
    Write-Host "Hãy copy và chạy các lệnh sau trên VPS:" -ForegroundColor White
    Show-VPSCommands
    exit 0
}

Write-OK "Tìm thấy SSH key"

# ── Hàm hiển thị tất cả lệnh VPS ────────────────────────────
function Show-VPSCommands {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  LỆNH CHẠY TRÊN VPS (copy & paste từng bước)    " -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "── BƯỚC 1: Cài Docker & Docker Compose ──" -ForegroundColor Yellow
    Write-Host @"
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
docker --version
"@

    Write-Host ""
    Write-Host "── BƯỚC 2: Cấu hình Firewall ──" -ForegroundColor Yellow
    Write-Host @"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
"@

    Write-Host ""
    Write-Host "── BƯỚC 3: Clone code từ GitHub ──" -ForegroundColor Yellow
    Write-Host @"
mkdir -p $APP_DIR
cd $APP_DIR
git clone $REPO_URL .
"@

    Write-Host ""
    Write-Host "── BƯỚC 4: Upload file .env.production ──" -ForegroundColor Yellow
    Write-Host "Chạy lệnh này từ máy LOCAL (Windows PowerShell):" -ForegroundColor Green
    Write-Host "  scp .env.production ${VPS_USER}@${VPS_IP}:${APP_DIR}/.env.production" -ForegroundColor White

    Write-Host ""
    Write-Host "── BƯỚC 5: Lấy SSL Certificate ──" -ForegroundColor Yellow
    Write-Host "(Đảm bảo DNS của $DOMAIN đã trỏ về $VPS_IP trước bước này)" -ForegroundColor Red
    Write-Host @"
apt-get install -y certbot
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
mkdir -p ${APP_DIR}/nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ${APP_DIR}/nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ${APP_DIR}/nginx/ssl/
chmod 644 ${APP_DIR}/nginx/ssl/*.pem
"@

    Write-Host ""
    Write-Host "── BƯỚC 6: Khởi động ứng dụng ──" -ForegroundColor Yellow
    Write-Host @"
cd $APP_DIR
docker compose --env-file .env.production pull 2>/dev/null || true
docker compose --env-file .env.production up -d --build
"@

    Write-Host ""
    Write-Host "── BƯỚC 7: Chờ DB sẵn sàng & push schema ──" -ForegroundColor Yellow
    Write-Host @"
sleep 15
docker compose exec app npx prisma db push --accept-data-loss
docker compose ps
"@

    Write-Host ""
    Write-Host "── KIỂM TRA ──" -ForegroundColor Yellow
    Write-Host @"
docker compose logs --tail=50 app
curl -k https://$DOMAIN/api/health
"@

    Write-Host ""
    Write-Host "── TỰ ĐỘNG GIA HẠN SSL (thêm vào cron) ──" -ForegroundColor Yellow
    Write-Host @"
(crontab -l 2>/dev/null; echo "0 3 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ${APP_DIR}/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ${APP_DIR}/nginx/ssl/ && docker compose -f ${APP_DIR}/docker-compose.yml --env-file ${APP_DIR}/.env.production exec nginx nginx -s reload") | crontab -
"@
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
}

# ── Upload .env.production ───────────────────────────────────
Write-Step "Upload .env.production lên VPS..."
$scpResult = scp -o StrictHostKeyChecking=no -i $sshKeyPath `
    $envFile "${VPS_USER}@${VPS_IP}:${APP_DIR}/.env.production" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-OK ".env.production đã upload thành công"
} else {
    Write-Warn "Chưa thể upload tự động (thư mục /opt/likefood chưa tồn tại?)"
    Write-Warn "Sẽ upload sau khi tạo thư mục trên VPS"
}

# ── Hiển thị hướng dẫn ──────────────────────────────────────
Show-VPSCommands

Write-Host ""
Write-Host "Sau khi deploy xong, mở trình duyệt tại: https://$DOMAIN" -ForegroundColor Green
Write-Host ""
