#!/bin/bash

# ============================================
# Ethinx Stack Health Monitor
# Checks service health and restarts failed containers
# ============================================

set -euo pipefail

DEPLOY_DIR="/opt/ethinx"
LOG_FILE="/var/log/ethinx-health.log"
MAX_LOG_SIZE=10485760  # 10MB

# Services to monitor (name|health_url|container_name)
SERVICES=(
    "Worker|http://localhost:8080/health|fastapi-worker"
    "Ollama|http://localhost:11434/|ollama-llm"
    "Whisper|http://localhost:9000/|whisper-stt"
    "Piper|http://localhost:10200|piper-tts"
    "Redis|redis-cli|redis-queue"
    "Uptime Kuma|http://localhost:3001/|uptime-kuma"
)

# Webhook URL for alerts (optional - set in .env)
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
    
    # Rotate log if too large
    if [[ -f "$LOG_FILE" ]] && [[ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
    fi
}

send_alert() {
    local message="$1"
    local level="${2:-warning}"
    
    log "ALERT [$level]: $message"
    
    if [[ -n "$ALERT_WEBHOOK_URL" ]]; then
        curl -sf -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"🚨 Ethinx Alert: $message\", \"level\": \"$level\"}" \
            > /dev/null 2>&1 || true
    fi
}

check_service() {
    local name="$1"
    local check="$2"
    local container="$3"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 1
    fi
    
    # Check health endpoint or command
    if [[ "$check" == "redis-cli" ]]; then
        docker exec "$container" redis-cli ping 2>/dev/null | grep -q "PONG"
    else
        curl -sf --connect-timeout 5 --max-time 10 "$check" > /dev/null 2>&1
    fi
}

restart_container() {
    local container="$1"
    log "Restarting container: $container"
    docker restart "$container" --time 30 2>/dev/null
}

main() {
    log "Starting health check"
    
    local failed_services=()
    local restarted_services=()
    
    for service in "${SERVICES[@]}"; do
        IFS='|' read -r name check container <<< "$service"
        
        if ! check_service "$name" "$check" "$container"; then
            log "UNHEALTHY: $name ($container)"
            failed_services+=("$name")
            
            # Attempt restart
            if restart_container "$container"; then
                sleep 10
                
                # Check again after restart
                if check_service "$name" "$check" "$container"; then
                    log "RECOVERED: $name after restart"
                    restarted_services+=("$name")
                else
                    log "FAILED: $name still unhealthy after restart"
                fi
            fi
        else
            log "HEALTHY: $name"
        fi
    done
    
    # Send alerts if needed
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        local still_failed=()
        for svc in "${failed_services[@]}"; do
            if [[ ! " ${restarted_services[*]} " =~ " ${svc} " ]]; then
                still_failed+=("$svc")
            fi
        done
        
        if [[ ${#still_failed[@]} -gt 0 ]]; then
            send_alert "Services failed and could not recover: ${still_failed[*]}" "error"
        elif [[ ${#restarted_services[@]} -gt 0 ]]; then
            send_alert "Services auto-recovered: ${restarted_services[*]}" "warning"
        fi
    fi
    
    log "Health check complete"
}

# Load environment if exists
if [[ -f "$DEPLOY_DIR/.env" ]]; then
    set -a
    source "$DEPLOY_DIR/.env"
    set +a
fi

main
