#!/bin/bash

# ============================================
# Let's Encrypt SSL Setup Script
# Provisions production SSL certificates
# ============================================

set -euo pipefail

# Configuration
DEPLOY_DIR="${DEPLOY_DIR:-/opt/ethinx}"
DOMAIN="${1:-}"
EMAIL="${2:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

show_help() {
    cat << EOF
Let's Encrypt SSL Setup for Ethinx Stack

Usage: $0 <domain> <email>

Arguments:
    domain      Your domain name (e.g., studio.ethinx.solutions)
    email       Email for Let's Encrypt notifications

Examples:
    $0 studio.ethinx.solutions admin@ethinx.solutions
    $0 api.mycompany.com ssl-admin@mycompany.com

Prerequisites:
    1. Domain DNS must point to this server's IP
    2. Ports 80 and 443 must be accessible
    3. Stack must be running (docker compose up)

EOF
    exit 1
}

# Validate arguments
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
    show_help
fi

# Validate domain format
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$ ]]; then
    print_error "Invalid domain format: $DOMAIN"
    exit 1
fi

# Validate email format
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    print_error "Invalid email format: $EMAIL"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Let's Encrypt SSL Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root"
    exit 1
fi

# Check DNS resolution
print_info "Checking DNS resolution..."
RESOLVED_IP=$(dig +short "$DOMAIN" | head -1)
SERVER_IP=$(curl -sf https://api.ipify.org || curl -sf https://ifconfig.me)

if [[ -z "$RESOLVED_IP" ]]; then
    print_error "Domain $DOMAIN does not resolve to any IP"
    print_info "Add an A record pointing to: $SERVER_IP"
    exit 1
fi

if [[ "$RESOLVED_IP" != "$SERVER_IP" ]]; then
    print_warning "Domain resolves to $RESOLVED_IP, but this server is $SERVER_IP"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_status "DNS correctly points to this server"
fi

cd "$DEPLOY_DIR"

# Step 1: Update nginx config for the domain
print_info "Updating nginx configuration..."

cat > "$DEPLOY_DIR/nginx/nginx.conf" << NGINX_EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone \$binary_remote_addr zone=conn_limit:10m;

    # Upstream servers
    upstream piper {
        server piper:10200;
    }

    upstream whisper {
        server whisper:9000;
    }

    upstream ollama {
        server ollama:11434;
    }

    upstream worker {
        server worker:8080;
    }

    upstream uptime_kuma {
        server uptime-kuma:3001;
    }

    upstream postal {
        server postal-smtp:5000;
    }

    # HTTP server - Let's Encrypt challenges + redirect
    server {
        listen 80;
        server_name $DOMAIN;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

        # SSL configuration - Modern settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        
        # OCSP Stapling
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Piper TTS API
        location /api/tts/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://piper/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
            proxy_buffering off;
        }

        # Whisper STT API
        location /api/stt/ {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://whisper/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
            client_max_body_size 50M;
        }

        # Ollama LLM API
        location /api/llm/ {
            limit_req zone=api_limit burst=5 nodelay;
            proxy_pass http://ollama/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 600s;
            proxy_buffering off;
        }

        # Worker Queue API
        location /api/worker/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://worker/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
        }

        # Postal Email API
        location /api/email/ {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://postal/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Uptime Kuma Monitoring
        location /monitor/ {
            proxy_pass http://uptime_kuma/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 '{"status":"healthy","domain":"$DOMAIN","timestamp":"\$time_iso8601"}';
            add_header Content-Type application/json;
        }
    }
}
NGINX_EOF

print_status "Nginx configuration updated for $DOMAIN"

# Step 2: Create temporary self-signed cert for initial nginx start
print_info "Creating temporary certificate..."
mkdir -p "/etc/letsencrypt/live/$DOMAIN"

if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
        -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=$DOMAIN" 2>/dev/null
fi

# Step 3: Restart nginx to apply new config
print_info "Restarting nginx..."
docker compose restart nginx
sleep 5

# Step 4: Request Let's Encrypt certificate
print_info "Requesting Let's Encrypt certificate..."

# Stop certbot if running with old config
docker compose stop certbot 2>/dev/null || true

# Run certbot to obtain certificate
docker run --rm \
    -v "$DEPLOY_DIR/certbot-webroot:/var/www/certbot" \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN"

if [[ $? -eq 0 ]]; then
    print_status "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate"
    print_info "Check that port 80 is accessible and DNS is correct"
    exit 1
fi

# Step 5: Restart nginx with real certificate
print_info "Reloading nginx with production certificate..."
docker compose restart nginx

# Step 6: Update .env with domain
print_info "Updating environment configuration..."
sed -i "s/^DOMAIN=.*/DOMAIN=$DOMAIN/" "$DEPLOY_DIR/.env"
sed -i "s/^LETSENCRYPT_EMAIL=.*/LETSENCRYPT_EMAIL=$EMAIL/" "$DEPLOY_DIR/.env"

# Update service URLs to use domain
sed -i "s|TTS_URL=.*|TTS_URL=https://$DOMAIN/api/tts|" "$DEPLOY_DIR/.env"
sed -i "s|STT_URL=.*|STT_URL=https://$DOMAIN/api/stt|" "$DEPLOY_DIR/.env"
sed -i "s|LLM_URL=.*|LLM_URL=https://$DOMAIN/api/llm|" "$DEPLOY_DIR/.env"
sed -i "s|WORKER_URL=.*|WORKER_URL=https://$DOMAIN/api/worker|" "$DEPLOY_DIR/.env"
sed -i "s|MONITOR_URL=.*|MONITOR_URL=https://$DOMAIN/monitor|" "$DEPLOY_DIR/.env"

# Step 7: Setup auto-renewal cron
print_info "Setting up automatic certificate renewal..."

cat > /etc/cron.d/ethinx-certbot-renewal << CRON_EOF
# Renew Let's Encrypt certificates twice daily
0 3,15 * * * root docker run --rm -v /opt/ethinx/certbot-webroot:/var/www/certbot -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew --quiet && docker exec nginx-proxy nginx -s reload
CRON_EOF

chmod 644 /etc/cron.d/ethinx-certbot-renewal
print_status "Auto-renewal cron job installed"

# Step 8: Test SSL
print_info "Testing SSL configuration..."
sleep 3

if curl -sf "https://$DOMAIN/health" > /dev/null 2>&1; then
    print_status "HTTPS is working correctly!"
else
    print_warning "HTTPS test failed - certificate may still be propagating"
fi

# Print summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SSL Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Your services are now available at:"
echo ""
echo -e "  ${CYAN}Main${NC}     https://$DOMAIN"
echo -e "  ${CYAN}TTS${NC}      https://$DOMAIN/api/tts/"
echo -e "  ${CYAN}STT${NC}      https://$DOMAIN/api/stt/"
echo -e "  ${CYAN}LLM${NC}      https://$DOMAIN/api/llm/"
echo -e "  ${CYAN}Worker${NC}   https://$DOMAIN/api/worker/"
echo -e "  ${CYAN}Monitor${NC}  https://$DOMAIN/monitor/"
echo ""
echo "Certificate Details:"
echo "  Issuer:  Let's Encrypt"
echo "  Expires: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)"
echo "  Auto-renewal: Enabled (twice daily)"
echo ""
echo -e "${YELLOW}Don't forget to update your edge function secrets with the new HTTPS URLs!${NC}"
echo ""
