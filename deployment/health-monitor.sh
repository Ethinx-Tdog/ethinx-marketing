#!/bin/bash

# ============================================
# Ethinx Stack Health Monitor
# Checks service health, restarts failed containers,
# and sends alerts to Slack/Discord
# ============================================

set -euo pipefail

DEPLOY_DIR="/opt/ethinx"
LOG_FILE="/var/log/ethinx-health.log"
STATE_FILE="/tmp/ethinx-health-state"
MAX_LOG_SIZE=10485760  # 10MB

# Services to monitor (name|health_url|container_name)
SERVICES=(
    "Worker|http://localhost:8080/health|fastapi-worker"
    "Ollama|http://localhost:11434/|ollama-llm"
    "Whisper|http://localhost:9000/|whisper-stt"
    "Piper|http://localhost:10200|piper-tts"
    "Redis|redis-cli|redis-queue"
    "Uptime Kuma|http://localhost:3001/|uptime-kuma"
    "Nginx|http://localhost:80/|nginx-proxy"
)

# Webhook configuration from environment
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
GENERIC_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"

# Alert configuration
ALERT_ON_RECOVERY="${ALERT_ON_RECOVERY:-true}"
ALERT_COOLDOWN_MINUTES="${ALERT_COOLDOWN_MINUTES:-15}"
SERVER_NAME="${SERVER_NAME:-Ethinx Stack}"
DOMAIN="${DOMAIN:-}"

# ============================================
# Logging Functions
# ============================================
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
    
    # Rotate log if too large
    if [[ -f "$LOG_FILE" ]]; then
        local size=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null || echo 0)
        if [[ $size -gt $MAX_LOG_SIZE ]]; then
            mv "$LOG_FILE" "${LOG_FILE}.old"
            log "Log rotated"
        fi
    fi
}

# ============================================
# Alert Cooldown Management
# ============================================
get_last_alert_time() {
    local service="$1"
    local key="alert_${service//[^a-zA-Z0-9]/_}"
    
    if [[ -f "$STATE_FILE" ]]; then
        grep "^$key=" "$STATE_FILE" 2>/dev/null | cut -d= -f2 || echo 0
    else
        echo 0
    fi
}

set_last_alert_time() {
    local service="$1"
    local key="alert_${service//[^a-zA-Z0-9]/_}"
    local now=$(date +%s)
    
    touch "$STATE_FILE"
    if grep -q "^$key=" "$STATE_FILE" 2>/dev/null; then
        sed -i "s/^$key=.*/$key=$now/" "$STATE_FILE"
    else
        echo "$key=$now" >> "$STATE_FILE"
    fi
}

should_alert() {
    local service="$1"
    local last_alert=$(get_last_alert_time "$service")
    local now=$(date +%s)
    local cooldown=$((ALERT_COOLDOWN_MINUTES * 60))
    
    if [[ $((now - last_alert)) -gt $cooldown ]]; then
        return 0  # Should alert
    else
        return 1  # Still in cooldown
    fi
}

# ============================================
# Slack Webhook
# ============================================
send_slack_alert() {
    local title="$1"
    local message="$2"
    local level="${3:-warning}"
    local service="${4:-}"
    
    if [[ -z "$SLACK_WEBHOOK_URL" ]]; then
        return 0
    fi
    
    # Color based on level
    local color
    case "$level" in
        error|critical) color="#dc3545" ;;  # Red
        warning)        color="#ffc107" ;;  # Yellow
        success|ok)     color="#28a745" ;;  # Green
        *)              color="#6c757d" ;;  # Gray
    esac
    
    # Build fields
    local fields="[]"
    if [[ -n "$DOMAIN" ]]; then
        fields="[{\"title\":\"Server\",\"value\":\"$DOMAIN\",\"short\":true},{\"title\":\"Time\",\"value\":\"$(date '+%Y-%m-%d %H:%M:%S UTC')\",\"short\":true}]"
    fi
    
    # Build payload
    local payload=$(cat <<EOF
{
    "username": "Ethinx Monitor",
    "icon_emoji": ":robot_face:",
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": $fields,
            "footer": "$SERVER_NAME Health Monitor",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -sf -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        > /dev/null 2>&1 || log "Failed to send Slack alert"
}

# ============================================
# Discord Webhook
# ============================================
send_discord_alert() {
    local title="$1"
    local message="$2"
    local level="${3:-warning}"
    local service="${4:-}"
    
    if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
        return 0
    fi
    
    # Color based on level (Discord uses decimal)
    local color
    case "$level" in
        error|critical) color="14423100" ;;  # Red
        warning)        color="16761095" ;;  # Yellow
        success|ok)     color="2664261" ;;   # Green
        *)              color="7105644" ;;   # Gray
    esac
    
    # Emoji based on level
    local emoji
    case "$level" in
        error|critical) emoji="🚨" ;;
        warning)        emoji="⚠️" ;;
        success|ok)     emoji="✅" ;;
        *)              emoji="ℹ️" ;;
    esac
    
    # Build payload
    local payload=$(cat <<EOF
{
    "username": "Ethinx Monitor",
    "avatar_url": "https://cdn.discordapp.com/embed/avatars/0.png",
    "embeds": [
        {
            "title": "$emoji $title",
            "description": "$message",
            "color": $color,
            "fields": [
                {
                    "name": "Server",
                    "value": "${DOMAIN:-$SERVER_NAME}",
                    "inline": true
                },
                {
                    "name": "Time",
                    "value": "$(date '+%Y-%m-%d %H:%M:%S UTC')",
                    "inline": true
                }
            ],
            "footer": {
                "text": "$SERVER_NAME Health Monitor"
            },
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        }
    ]
}
EOF
)
    
    curl -sf -X POST "$DISCORD_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        > /dev/null 2>&1 || log "Failed to send Discord alert"
}

# ============================================
# Generic Webhook
# ============================================
send_generic_alert() {
    local title="$1"
    local message="$2"
    local level="${3:-warning}"
    local service="${4:-}"
    
    if [[ -z "$GENERIC_WEBHOOK_URL" ]]; then
        return 0
    fi
    
    local payload=$(cat <<EOF
{
    "title": "$title",
    "message": "$message",
    "level": "$level",
    "service": "$service",
    "server": "${DOMAIN:-$SERVER_NAME}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "unix_timestamp": $(date +%s)
}
EOF
)
    
    curl -sf -X POST "$GENERIC_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        > /dev/null 2>&1 || log "Failed to send generic alert"
}

# ============================================
# Send Alert to All Configured Webhooks
# ============================================
send_alert() {
    local title="$1"
    local message="$2"
    local level="${3:-warning}"
    local service="${4:-}"
    
    # Check cooldown for this service
    if [[ -n "$service" ]] && ! should_alert "$service"; then
        log "Alert for $service skipped (cooldown active)"
        return 0
    fi
    
    log "ALERT [$level]: $title - $message"
    
    # Send to all configured webhooks
    send_slack_alert "$title" "$message" "$level" "$service"
    send_discord_alert "$title" "$message" "$level" "$service"
    send_generic_alert "$title" "$message" "$level" "$service"
    
    # Update cooldown timer
    if [[ -n "$service" ]]; then
        set_last_alert_time "$service"
    fi
}

# ============================================
# Service Health Check
# ============================================
check_service() {
    local name="$1"
    local check="$2"
    local container="$3"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
        return 1
    fi
    
    # Check health endpoint or command
    if [[ "$check" == "redis-cli" ]]; then
        docker exec "$container" redis-cli ping 2>/dev/null | grep -q "PONG"
    else
        curl -sf --connect-timeout 5 --max-time 10 "$check" > /dev/null 2>&1
    fi
}

# ============================================
# Restart Container
# ============================================
restart_container() {
    local container="$1"
    log "Restarting container: $container"
    docker restart "$container" --time 30 2>/dev/null
    return $?
}

# ============================================
# Get Container Logs (last few lines)
# ============================================
get_container_logs() {
    local container="$1"
    local lines="${2:-10}"
    docker logs --tail "$lines" "$container" 2>&1 | head -c 500
}

# ============================================
# Main Health Check Loop
# ============================================
main() {
    log "Starting health check"
    
    local failed_services=()
    local restarted_services=()
    local still_failed_services=()
    
    for service in "${SERVICES[@]}"; do
        IFS='|' read -r name check container <<< "$service"
        
        if ! check_service "$name" "$check" "$container"; then
            log "UNHEALTHY: $name ($container)"
            failed_services+=("$name")
            
            # Get logs before restart for debugging
            local error_logs=$(get_container_logs "$container" 5)
            
            # Attempt restart
            if restart_container "$container"; then
                sleep 15  # Wait for service to come up
                
                # Check again after restart
                if check_service "$name" "$check" "$container"; then
                    log "RECOVERED: $name after restart"
                    restarted_services+=("$name")
                else
                    log "FAILED: $name still unhealthy after restart"
                    still_failed_services+=("$name")
                fi
            else
                log "RESTART FAILED: Could not restart $container"
                still_failed_services+=("$name")
            fi
        else
            log "HEALTHY: $name"
        fi
    done
    
    # Send alerts for failed services
    if [[ ${#still_failed_services[@]} -gt 0 ]]; then
        local failed_list="${still_failed_services[*]}"
        send_alert \
            "🚨 Services Down" \
            "The following services failed and could not recover:\n• ${failed_list// /\\n• }\n\nManual intervention required." \
            "error" \
            "multiple_failures"
    fi
    
    # Send alerts for recovered services (optional)
    if [[ "$ALERT_ON_RECOVERY" == "true" ]] && [[ ${#restarted_services[@]} -gt 0 ]]; then
        local recovered_list="${restarted_services[*]}"
        send_alert \
            "✅ Services Recovered" \
            "The following services were automatically restarted and recovered:\n• ${recovered_list// /\\n• }" \
            "success" \
            "recovery"
    fi
    
    # Summary log
    local total=${#SERVICES[@]}
    local failed=${#failed_services[@]}
    local recovered=${#restarted_services[@]}
    local down=${#still_failed_services[@]}
    
    log "Health check complete: $((total - failed))/$total healthy, $recovered recovered, $down still down"
}

# ============================================
# Load Environment
# ============================================
if [[ -f "$DEPLOY_DIR/.env" ]]; then
    set -a
    source "$DEPLOY_DIR/.env"
    set +a
fi

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Run main
main "$@"
