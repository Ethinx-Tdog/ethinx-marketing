#!/bin/bash

# ============================================
# Open-Source Stack Deployment Script
# Target: Ubuntu VPS at 91.99.162.243
# ============================================

set -e

SERVER_IP="91.99.162.243"
DEPLOY_DIR="/opt/openstack"

echo "🚀 Starting Open-Source Stack Deployment"
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================
# Step 1: Install Docker & Docker Compose
# ============================================
install_docker() {
    echo ""
    echo "📦 Installing Docker..."
    
    # Update system
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
}

# ============================================
# Step 2: Create deployment directory
# ============================================
setup_directories() {
    echo ""
    echo "📁 Setting up directories..."
    
    sudo mkdir -p $DEPLOY_DIR
    sudo mkdir -p $DEPLOY_DIR/nginx/conf.d
    sudo mkdir -p $DEPLOY_DIR/worker
    sudo mkdir -p $DEPLOY_DIR/postal
    sudo mkdir -p $DEPLOY_DIR/certbot
    
    sudo chown -R $USER:$USER $DEPLOY_DIR
    
    print_status "Directories created"
}

# ============================================
# Step 3: Copy deployment files
# ============================================
copy_files() {
    echo ""
    echo "📋 Copying deployment files..."
    
    cp docker-compose.yml $DEPLOY_DIR/
    cp .env.example $DEPLOY_DIR/.env
    cp nginx/nginx.conf $DEPLOY_DIR/nginx/
    cp -r worker/* $DEPLOY_DIR/worker/
    cp postal/postal.yml $DEPLOY_DIR/postal/
    
    print_status "Files copied to $DEPLOY_DIR"
}

# ============================================
# Step 4: Configure environment
# ============================================
configure_env() {
    echo ""
    echo "⚙️  Configuring environment..."
    
    # Generate secure passwords
    POSTAL_DB_PASS=$(openssl rand -base64 32)
    API_SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i "s/change_me_secure_password_123/$POSTAL_DB_PASS/" $DEPLOY_DIR/.env
    sed -i "s/generate_a_secure_random_key_here/$API_SECRET/" $DEPLOY_DIR/.env
    sed -i "s/your-domain.com/$SERVER_IP/" $DEPLOY_DIR/.env
    
    print_status "Environment configured"
}

# ============================================
# Step 5: Configure firewall
# ============================================
configure_firewall() {
    echo ""
    echo "🔥 Configuring firewall..."
    
    sudo ufw allow 22/tcp      # SSH
    sudo ufw allow 80/tcp      # HTTP
    sudo ufw allow 443/tcp     # HTTPS
    sudo ufw allow 25/tcp      # SMTP
    sudo ufw allow 587/tcp     # SMTP TLS
    sudo ufw allow 3001/tcp    # Uptime Kuma
    sudo ufw allow 6379/tcp    # Redis (internal only in production)
    sudo ufw allow 8080/tcp    # Worker API
    sudo ufw allow 9000/tcp    # Whisper
    sudo ufw allow 10200/tcp   # Piper
    sudo ufw allow 11434/tcp   # Ollama
    
    sudo ufw --force enable
    
    print_status "Firewall configured"
}

# ============================================
# Step 6: Pull Ollama model
# ============================================
setup_ollama() {
    echo ""
    echo "🤖 Setting up Ollama with default model..."
    
    # Start Ollama first
    cd $DEPLOY_DIR
    docker compose up -d ollama
    
    # Wait for Ollama to be ready
    sleep 10
    
    # Pull the default model
    docker exec ollama-llm ollama pull llama3.2
    
    print_status "Ollama model downloaded"
}

# ============================================
# Step 7: Setup SSL certificates
# ============================================
setup_ssl() {
    echo ""
    echo "🔐 Setting up SSL certificates..."
    
    # Create self-signed certificate for initial setup
    # (Replace with Let's Encrypt for production)
    
    sudo mkdir -p $DEPLOY_DIR/certs
    
    # Generate self-signed cert
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $DEPLOY_DIR/certs/privkey.pem \
        -out $DEPLOY_DIR/certs/fullchain.pem \
        -subj "/CN=$SERVER_IP"
    
    # Create symlinks for nginx
    sudo mkdir -p /etc/letsencrypt/live/$SERVER_IP
    sudo ln -sf $DEPLOY_DIR/certs/privkey.pem /etc/letsencrypt/live/$SERVER_IP/privkey.pem
    sudo ln -sf $DEPLOY_DIR/certs/fullchain.pem /etc/letsencrypt/live/$SERVER_IP/fullchain.pem
    
    print_status "SSL certificates created (self-signed)"
    print_warning "For production, run: certbot certonly --webroot -w /var/www/certbot -d your-domain.com"
}

# ============================================
# Step 8: Start all services
# ============================================
start_services() {
    echo ""
    echo "🐳 Starting all services..."
    
    cd $DEPLOY_DIR
    docker compose up -d
    
    # Wait for services to start
    echo "Waiting for services to initialize..."
    sleep 30
    
    print_status "All services started"
}

# ============================================
# Step 9: Verify services
# ============================================
verify_services() {
    echo ""
    echo "🔍 Verifying services..."
    echo ""
    
    check_service() {
        local name=$1
        local url=$2
        
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "✅ $name: ${GREEN}Running${NC}"
            return 0
        else
            echo -e "❌ $name: ${RED}Not responding${NC}"
            return 1
        fi
    }
    
    check_service "Piper TTS" "http://$SERVER_IP:10200"
    check_service "Whisper STT" "http://$SERVER_IP:9000/"
    check_service "Ollama LLM" "http://$SERVER_IP:11434/"
    check_service "Worker API" "http://$SERVER_IP:8080/health"
    check_service "Uptime Kuma" "http://$SERVER_IP:3001/"
    
    # Check Redis separately
    if docker exec redis-queue redis-cli ping | grep -q "PONG"; then
        echo -e "✅ Redis: ${GREEN}Running${NC}"
    else
        echo -e "❌ Redis: ${RED}Not responding${NC}"
    fi
    
    echo ""
}

# ============================================
# Step 10: Print summary
# ============================================
print_summary() {
    echo ""
    echo "========================================="
    echo "🎉 Deployment Complete!"
    echo "========================================="
    echo ""
    echo "Service URLs:"
    echo "  TTS_URL=http://$SERVER_IP:10200"
    echo "  STT_URL=http://$SERVER_IP:9000"
    echo "  LLM_URL=http://$SERVER_IP:11434"
    echo "  WORKER_URL=http://$SERVER_IP:8080"
    echo "  QUEUE_URL=redis://$SERVER_IP:6379"
    echo "  MONITOR_URL=http://$SERVER_IP:3001"
    echo ""
    echo "Next Steps:"
    echo "  1. Access Uptime Kuma at http://$SERVER_IP:3001 to set up monitoring"
    echo "  2. Configure these URLs in your Supabase edge function secrets"
    echo "  3. For production SSL, run the certbot command above"
    echo ""
    echo "Useful commands:"
    echo "  cd $DEPLOY_DIR"
    echo "  docker compose logs -f          # View all logs"
    echo "  docker compose ps               # Check service status"
    echo "  docker compose restart          # Restart all services"
    echo ""
}

# ============================================
# Main execution
# ============================================
main() {
    echo ""
    echo "This script will deploy the open-source stack to your server."
    echo "Target IP: $SERVER_IP"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        install_docker
        print_warning "Please log out and back in for Docker permissions, then re-run this script."
        exit 0
    fi
    
    setup_directories
    copy_files
    configure_env
    configure_firewall
    setup_ssl
    start_services
    setup_ollama
    verify_services
    print_summary
}

# Run main
main "$@"
