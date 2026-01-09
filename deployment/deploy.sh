#!/bin/bash

# ============================================
# Ethinx Open-Source Stack Deployment Script
# Enhanced version with error handling, logging, and GPU detection
# ============================================

set -euo pipefail

# ============================================
# Configuration
# ============================================
SERVER_IP="${SERVER_IP:-91.99.162.243}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/ethinx}"
LOG_FILE="${DEPLOY_DIR}/deploy.log"
BACKUP_DIR="${DEPLOY_DIR}/backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default options
SKIP_DOCKER=false
SKIP_FIREWALL=false
SKIP_SSL=false
NO_PROMPT=false
VERBOSE=false
ROLLBACK=false

# ============================================
# Colors and Output
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE" 2>/dev/null || true
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}[$timestamp]${NC} $1"
    fi
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

print_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "STEP: $1"
}

# ============================================
# Cleanup and Error Handling
# ============================================
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        print_error "Deployment failed with exit code $exit_code"
        print_info "Check log file: $LOG_FILE"
        print_info "To rollback: $0 --rollback"
    fi
}

trap cleanup EXIT

# ============================================
# Help and Usage
# ============================================
show_help() {
    cat << EOF
Ethinx Open-Source Stack Deployment Script

Usage: $0 [OPTIONS]

Options:
    --skip-docker       Skip Docker installation (if already installed)
    --skip-firewall     Skip firewall configuration
    --skip-ssl          Skip SSL certificate setup
    --no-prompt         Run without confirmation prompts
    --verbose, -v       Enable verbose logging
    --rollback          Rollback to previous deployment
    --help, -h          Show this help message

Environment Variables:
    SERVER_IP           Target server IP (default: 91.99.162.243)
    DEPLOY_DIR          Deployment directory (default: /opt/ethinx)

Examples:
    $0                          # Interactive deployment
    $0 --no-prompt              # Automated deployment
    $0 --skip-docker --verbose  # Skip Docker, verbose output
    $0 --rollback               # Restore previous deployment

EOF
    exit 0
}

# ============================================
# Parse Arguments
# ============================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-firewall)
                SKIP_FIREWALL=true
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            --no-prompt)
                NO_PROMPT=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --help|-h)
                show_help
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

# ============================================
# Prerequisite Checks
# ============================================
check_prerequisites() {
    print_step "Checking Prerequisites"
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
    print_status "Running as root"
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot detect OS. This script requires Ubuntu/Debian."
        exit 1
    fi
    source /etc/os-release
    print_status "Detected OS: $PRETTY_NAME"
    
    # Check disk space (require at least 20GB free)
    local free_space=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $free_space -lt 20 ]]; then
        print_error "Insufficient disk space. Need at least 20GB, have ${free_space}GB"
        exit 1
    fi
    print_status "Disk space: ${free_space}GB available"
    
    # Check memory (require at least 4GB)
    local total_mem=$(free -g | awk 'NR==2 {print $2}')
    if [[ $total_mem -lt 4 ]]; then
        print_warning "Low memory: ${total_mem}GB. Recommended: 8GB+"
    else
        print_status "Memory: ${total_mem}GB available"
    fi
    
    # Check required ports
    local ports=(22 25 80 443 587 3001 5000 6379 8080 9000 10200 11434)
    local blocked_ports=()
    
    for port in "${ports[@]}"; do
        if ss -tuln | grep -q ":$port "; then
            blocked_ports+=($port)
        fi
    done
    
    if [[ ${#blocked_ports[@]} -gt 0 ]]; then
        print_warning "Ports already in use: ${blocked_ports[*]}"
        print_info "This may be okay if services are already running"
    else
        print_status "All required ports available"
    fi
    
    # Check internet connectivity
    if ! curl -sf --connect-timeout 5 https://hub.docker.com > /dev/null 2>&1; then
        print_error "No internet connectivity. Cannot reach Docker Hub."
        exit 1
    fi
    print_status "Internet connectivity verified"
}

# ============================================
# GPU Detection
# ============================================
detect_gpu() {
    print_step "Detecting GPU"
    
    HAS_NVIDIA_GPU=false
    
    # Check for NVIDIA GPU
    if command -v nvidia-smi &> /dev/null; then
        if nvidia-smi &> /dev/null; then
            local gpu_info=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
            print_status "NVIDIA GPU detected: $gpu_info"
            HAS_NVIDIA_GPU=true
        fi
    elif lspci 2>/dev/null | grep -i nvidia &> /dev/null; then
        print_warning "NVIDIA GPU detected but drivers not installed"
        print_info "Install NVIDIA drivers for GPU acceleration"
    fi
    
    if [[ "$HAS_NVIDIA_GPU" == "false" ]]; then
        print_info "No NVIDIA GPU detected - Ollama will run on CPU"
        print_info "Using docker-compose.nogpu.yml override"
    fi
}

# ============================================
# Retry Function
# ============================================
retry() {
    local retries="${1:-3}"
    local delay="${2:-5}"
    local cmd="${@:3}"
    local attempt=1
    
    while [[ $attempt -le $retries ]]; do
        log "Attempt $attempt/$retries: $cmd"
        if eval "$cmd"; then
            return 0
        fi
        
        if [[ $attempt -lt $retries ]]; then
            print_warning "Attempt $attempt failed, retrying in ${delay}s..."
            sleep "$delay"
        fi
        ((attempt++))
    done
    
    print_error "Command failed after $retries attempts: $cmd"
    return 1
}

# ============================================
# Backup Existing Deployment
# ============================================
create_backup() {
    if [[ -d "$DEPLOY_DIR" && -f "$DEPLOY_DIR/docker-compose.yml" ]]; then
        print_step "Creating Backup"
        
        local backup_name="backup_$(date '+%Y%m%d_%H%M%S')"
        local backup_path="$BACKUP_DIR/$backup_name"
        
        mkdir -p "$BACKUP_DIR"
        
        # Stop services before backup
        if docker compose -f "$DEPLOY_DIR/docker-compose.yml" ps -q 2>/dev/null | grep -q .; then
            print_info "Stopping services for backup..."
            docker compose -f "$DEPLOY_DIR/docker-compose.yml" down --timeout 30 || true
        fi
        
        # Create backup
        cp -r "$DEPLOY_DIR" "$backup_path"
        rm -rf "$backup_path/backups"  # Don't backup backups
        
        print_status "Backup created: $backup_path"
        
        # Keep only last 5 backups
        local backup_count=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
        if [[ $backup_count -gt 5 ]]; then
            ls -1t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
            print_info "Cleaned old backups, keeping last 5"
        fi
    fi
}

# ============================================
# Rollback Function
# ============================================
do_rollback() {
    print_step "Rolling Back Deployment"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        print_error "No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    # List available backups
    echo ""
    echo "Available backups:"
    ls -1t "$BACKUP_DIR" | head -5 | nl
    echo ""
    
    if [[ "$NO_PROMPT" == "true" ]]; then
        local latest=$(ls -1t "$BACKUP_DIR" | head -1)
        print_info "Using latest backup: $latest"
    else
        read -p "Enter backup number (1 for latest): " backup_num
        local latest=$(ls -1t "$BACKUP_DIR" | sed -n "${backup_num}p")
    fi
    
    if [[ -z "$latest" ]]; then
        print_error "Invalid backup selection"
        exit 1
    fi
    
    local backup_path="$BACKUP_DIR/$latest"
    
    # Stop current services
    if [[ -f "$DEPLOY_DIR/docker-compose.yml" ]]; then
        docker compose -f "$DEPLOY_DIR/docker-compose.yml" down --timeout 30 || true
    fi
    
    # Restore backup
    rm -rf "$DEPLOY_DIR.old" 2>/dev/null || true
    mv "$DEPLOY_DIR" "$DEPLOY_DIR.old" 2>/dev/null || true
    cp -r "$backup_path" "$DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mv "$DEPLOY_DIR.old/backups/"* "$BACKUP_DIR/" 2>/dev/null || true
    rm -rf "$DEPLOY_DIR.old"
    
    # Restart services
    cd "$DEPLOY_DIR"
    if [[ "$HAS_NVIDIA_GPU" == "true" ]]; then
        docker compose up -d
    else
        docker compose -f docker-compose.yml -f docker-compose.nogpu.yml up -d
    fi
    
    print_status "Rollback complete from: $latest"
    exit 0
}

# ============================================
# Install Docker
# ============================================
install_docker() {
    if [[ "$SKIP_DOCKER" == "true" ]]; then
        print_info "Skipping Docker installation (--skip-docker)"
        return 0
    fi
    
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | awk '{print $3}' | tr -d ',')
        print_status "Docker already installed: $docker_version"
        
        # Ensure Docker Compose plugin is available
        if ! docker compose version &> /dev/null; then
            print_info "Installing Docker Compose plugin..."
            apt-get update
            apt-get install -y docker-compose-plugin
        fi
        return 0
    fi
    
    print_step "Installing Docker"
    
    # Update and install prerequisites
    retry 3 5 "apt-get update"
    retry 3 5 "apt-get install -y ca-certificates curl gnupg lsb-release"
    
    # Add Docker GPG key
    install -m 0755 -d /etc/apt/keyrings
    retry 3 5 "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg"
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    retry 3 5 "apt-get update"
    retry 3 5 "apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    # Verify installation
    if docker --version && docker compose version; then
        print_status "Docker installed successfully"
    else
        print_error "Docker installation verification failed"
        exit 1
    fi
}

# ============================================
# Setup Directories
# ============================================
setup_directories() {
    print_step "Setting Up Directories"
    
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR/nginx/conf.d"
    mkdir -p "$DEPLOY_DIR/worker"
    mkdir -p "$DEPLOY_DIR/postal"
    mkdir -p "$DEPLOY_DIR/certs"
    mkdir -p "$BACKUP_DIR"
    
    # Initialize log file
    touch "$LOG_FILE"
    
    print_status "Directories created: $DEPLOY_DIR"
}

# ============================================
# Validate and Copy Files
# ============================================
copy_files() {
    print_step "Copying Deployment Files"
    
    # Validate source files exist
    local required_files=(
        "docker-compose.yml"
        ".env.example"
        "nginx/nginx.conf"
        "worker/Dockerfile"
        "worker/main.py"
        "worker/requirements.txt"
    )
    
    local missing_files=()
    for file in "${required_files[@]}"; do
        if [[ ! -f "$SCRIPT_DIR/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_error "Missing required files: ${missing_files[*]}"
        print_info "Ensure you're running from the deployment directory"
        exit 1
    fi
    
    # Copy files
    cp "$SCRIPT_DIR/docker-compose.yml" "$DEPLOY_DIR/"
    
    # Copy nogpu override if exists
    if [[ -f "$SCRIPT_DIR/docker-compose.nogpu.yml" ]]; then
        cp "$SCRIPT_DIR/docker-compose.nogpu.yml" "$DEPLOY_DIR/"
    fi
    
    # Create .env from example if not exists
    if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
        cp "$SCRIPT_DIR/.env.example" "$DEPLOY_DIR/.env"
    else
        print_info "Preserving existing .env file"
    fi
    
    cp "$SCRIPT_DIR/nginx/nginx.conf" "$DEPLOY_DIR/nginx/"
    cp -r "$SCRIPT_DIR/worker/"* "$DEPLOY_DIR/worker/"
    
    if [[ -f "$SCRIPT_DIR/postal/postal.yml" ]]; then
        cp "$SCRIPT_DIR/postal/postal.yml" "$DEPLOY_DIR/postal/"
    fi
    
    print_status "Files copied to $DEPLOY_DIR"
}

# ============================================
# Configure Environment
# ============================================
configure_env() {
    print_step "Configuring Environment"
    
    local env_file="$DEPLOY_DIR/.env"
    
    # Generate secure passwords if placeholders exist
    if grep -q "change_me_secure_password_123" "$env_file" 2>/dev/null; then
        local postal_pass=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
        sed -i "s/change_me_secure_password_123/$postal_pass/" "$env_file"
        print_status "Generated secure Postal DB password"
    fi
    
    if grep -q "generate_a_secure_random_key_here" "$env_file" 2>/dev/null; then
        local api_key=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
        sed -i "s/generate_a_secure_random_key_here/$api_key/" "$env_file"
        print_status "Generated secure API key"
    fi
    
    # Update SERVER_IP
    sed -i "s/your-domain.com/$SERVER_IP/g" "$env_file" 2>/dev/null || true
    sed -i "s/SERVER_IP=.*/SERVER_IP=$SERVER_IP/" "$env_file" 2>/dev/null || true
    
    # Validate required variables
    local required_vars=("POSTAL_DB_ROOT_PASSWORD" "WORKER_API_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=.\+" "$env_file" 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_warning "Missing or empty env variables: ${missing_vars[*]}"
        print_info "Edit $env_file to set these values"
    else
        print_status "Environment configured"
    fi
}

# ============================================
# Configure Firewall
# ============================================
configure_firewall() {
    if [[ "$SKIP_FIREWALL" == "true" ]]; then
        print_info "Skipping firewall configuration (--skip-firewall)"
        return 0
    fi
    
    print_step "Configuring Firewall"
    
    # Check if ufw is installed
    if ! command -v ufw &> /dev/null; then
        print_info "Installing UFW..."
        apt-get install -y ufw
    fi
    
    # Configure rules
    local ports=(
        "22/tcp"    # SSH
        "80/tcp"    # HTTP
        "443/tcp"   # HTTPS
        "25/tcp"    # SMTP
        "587/tcp"   # SMTP TLS
        "3001/tcp"  # Uptime Kuma
        "8080/tcp"  # Worker API
        "9000/tcp"  # Whisper
        "10200/tcp" # Piper
        "11434/tcp" # Ollama
    )
    
    for port in "${ports[@]}"; do
        ufw allow "$port" > /dev/null 2>&1 || true
    done
    
    # Enable UFW
    ufw --force enable
    
    print_status "Firewall configured with ${#ports[@]} rules"
}

# ============================================
# Setup SSL
# ============================================
setup_ssl() {
    if [[ "$SKIP_SSL" == "true" ]]; then
        print_info "Skipping SSL setup (--skip-ssl)"
        return 0
    fi
    
    print_step "Setting Up SSL Certificates"
    
    local cert_dir="$DEPLOY_DIR/certs"
    
    # Check if certs already exist
    if [[ -f "$cert_dir/fullchain.pem" && -f "$cert_dir/privkey.pem" ]]; then
        print_info "SSL certificates already exist"
        return 0
    fi
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$cert_dir/privkey.pem" \
        -out "$cert_dir/fullchain.pem" \
        -subj "/CN=$SERVER_IP" 2>/dev/null
    
    # Create Let's Encrypt directory structure
    mkdir -p "/etc/letsencrypt/live/$SERVER_IP"
    ln -sf "$cert_dir/privkey.pem" "/etc/letsencrypt/live/$SERVER_IP/privkey.pem"
    ln -sf "$cert_dir/fullchain.pem" "/etc/letsencrypt/live/$SERVER_IP/fullchain.pem"
    
    print_status "Self-signed SSL certificate created"
    print_warning "For production: certbot certonly --webroot -w /var/www/certbot -d your-domain.com"
}

# ============================================
# Start Services
# ============================================
start_services() {
    print_step "Starting Services"
    
    cd "$DEPLOY_DIR"
    
    # Load environment
    set -a
    source .env
    set +a
    
    # Build worker image
    print_info "Building worker image..."
    docker compose build worker
    
    # Start services with appropriate compose files
    print_info "Starting all services..."
    if [[ "$HAS_NVIDIA_GPU" == "true" ]]; then
        docker compose up -d
    else
        docker compose -f docker-compose.yml -f docker-compose.nogpu.yml up -d
    fi
    
    print_status "Services starting..."
}

# ============================================
# Setup Ollama Model
# ============================================
setup_ollama() {
    print_step "Setting Up Ollama Model"
    
    # Wait for Ollama to be healthy
    print_info "Waiting for Ollama to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf http://localhost:11434/ > /dev/null 2>&1; then
            break
        fi
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_warning "Ollama not ready after ${max_attempts} attempts"
        print_info "You can manually pull the model later: docker exec ollama-llm ollama pull llama3.2"
        return 0
    fi
    
    # Pull default model
    print_info "Pulling llama3.2 model (this may take a while)..."
    if docker exec ollama-llm ollama pull llama3.2; then
        print_status "Ollama model downloaded"
    else
        print_warning "Failed to pull model - you can retry manually"
    fi
}

# ============================================
# Verify Services
# ============================================
verify_services() {
    print_step "Verifying Services"
    
    # Wait for services to initialize
    print_info "Waiting for services to initialize (30s)..."
    sleep 30
    
    local services=(
        "Piper TTS|http://localhost:10200"
        "Whisper STT|http://localhost:9000/"
        "Ollama LLM|http://localhost:11434/"
        "Worker API|http://localhost:8080/health"
        "Uptime Kuma|http://localhost:3001/"
    )
    
    local failed=0
    
    for service in "${services[@]}"; do
        local name="${service%%|*}"
        local url="${service##*|}"
        
        if retry 3 2 "curl -sf '$url' > /dev/null 2>&1"; then
            echo -e "  ✅ $name: ${GREEN}Running${NC}"
        else
            echo -e "  ❌ $name: ${RED}Not responding${NC}"
            ((failed++))
        fi
    done
    
    # Check Redis
    if docker exec redis-queue redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "  ✅ Redis: ${GREEN}Running${NC}"
    else
        echo -e "  ❌ Redis: ${RED}Not responding${NC}"
        ((failed++))
    fi
    
    echo ""
    
    if [[ $failed -gt 0 ]]; then
        print_warning "$failed service(s) not responding"
        print_info "Check logs: docker compose logs -f"
    else
        print_status "All services healthy!"
    fi
}

# ============================================
# Print Summary
# ============================================
print_summary() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  🎉 Deployment Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Service URLs:"
    echo -e "  ${CYAN}TTS${NC}      http://$SERVER_IP:10200"
    echo -e "  ${CYAN}STT${NC}      http://$SERVER_IP:9000"
    echo -e "  ${CYAN}LLM${NC}      http://$SERVER_IP:11434"
    echo -e "  ${CYAN}Worker${NC}   http://$SERVER_IP:8080"
    echo -e "  ${CYAN}Redis${NC}    redis://$SERVER_IP:6379"
    echo -e "  ${CYAN}Monitor${NC}  http://$SERVER_IP:3001"
    echo ""
    echo "GPU Mode: $(if [[ "$HAS_NVIDIA_GPU" == "true" ]]; then echo "NVIDIA GPU"; else echo "CPU Only"; fi)"
    echo "Log File: $LOG_FILE"
    echo ""
    echo "Next Steps:"
    echo "  1. Access Uptime Kuma at http://$SERVER_IP:3001"
    echo "  2. Configure these URLs in your edge function secrets"
    echo "  3. For production SSL: certbot certonly --webroot -w /var/www/certbot -d your-domain.com"
    echo ""
    echo "Useful commands:"
    echo "  cd $DEPLOY_DIR"
    echo "  docker compose logs -f          # View logs"
    echo "  docker compose ps               # Check status"
    echo "  docker compose restart          # Restart all"
    echo "  $0 --rollback                   # Rollback deployment"
    echo ""
}

# ============================================
# Main Execution
# ============================================
main() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Ethinx Open-Source Stack Deployment${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Target: $SERVER_IP"
    echo "Deploy: $DEPLOY_DIR"
    echo ""
    
    # Handle rollback
    if [[ "$ROLLBACK" == "true" ]]; then
        detect_gpu
        do_rollback
    fi
    
    # Confirmation
    if [[ "$NO_PROMPT" == "false" ]]; then
        read -p "Continue with deployment? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    detect_gpu
    create_backup
    install_docker
    setup_directories
    copy_files
    configure_env
    configure_firewall
    setup_ssl
    start_services
    setup_ollama
    verify_services
    print_summary
    
    log "Deployment completed successfully"
}

# Parse arguments and run
parse_args "$@"
main
