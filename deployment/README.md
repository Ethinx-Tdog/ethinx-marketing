# Open-Source Stack Deployment

Complete deployment configuration for self-hosted open-source services replacing paid APIs.

## Services Included

| Service | Port | Purpose | Replaces |
|---------|------|---------|----------|
| **Piper** | 10200 | Text-to-Speech | ElevenLabs TTS |
| **Whisper** | 9000 | Speech-to-Text | ElevenLabs STT |
| **Ollama** | 11434 | Local LLM | Lovable AI / OpenAI |
| **Redis** | 6379 | Job Queue | - |
| **FastAPI Worker** | 8080 | Job Processor | Modal |
| **Postal** | 5000, 25, 587 | Email Server | Resend |
| **Uptime Kuma** | 3001 | Monitoring | Paid monitoring |
| **Nginx** | 80, 443 | Reverse Proxy | - |

## Quick Start

### 1. Copy files to your server

```bash
scp -r deployment/* root@91.99.162.243:/tmp/openstack/
```

### 2. SSH into server and run deploy script

```bash
ssh root@91.99.162.243
cd /tmp/openstack
chmod +x deploy.sh
./deploy.sh
```

### 3. Verify all services are running

```bash
curl http://91.99.162.243:10200          # Piper TTS
curl http://91.99.162.243:9000/          # Whisper STT  
curl http://91.99.162.243:11434/         # Ollama
curl http://91.99.162.243:8080/health    # Worker
curl http://91.99.162.243:3001/          # Uptime Kuma
```

## Environment Variables for Supabase

Add these to your Supabase Edge Function secrets:

```
TTS_URL=http://91.99.162.243:10200
STT_URL=http://91.99.162.243:9000
EMAIL_URL=http://91.99.162.243:5000
LLM_URL=http://91.99.162.243:11434
QUEUE_URL=redis://91.99.162.243:6379
WORKER_URL=http://91.99.162.243:8080
MONITOR_URL=http://91.99.162.243:3001
```

## Ollama Models

The deployment pulls `llama3.2` by default. To add more models:

```bash
docker exec ollama-llm ollama pull mistral
docker exec ollama-llm ollama pull codellama
docker exec ollama-llm ollama list
```

## SSL Certificates

For production, get real certificates:

```bash
docker run -it --rm \
  -v /opt/openstack/certbot:/etc/letsencrypt \
  -v /opt/openstack/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d your-domain.com \
  --email admin@your-domain.com \
  --agree-tos
```

## Monitoring

Access Uptime Kuma at `http://91.99.162.243:3001` and add monitors for:

- Piper TTS: `http://piper:10200`
- Whisper STT: `http://whisper:9000/`
- Ollama: `http://ollama:11434/`
- Worker: `http://worker:8080/health`
- Redis: TCP check on port 6379

## Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f ollama
docker compose logs -f worker
```

## Troubleshooting

### Ollama not responding
```bash
docker exec ollama-llm ollama list
docker restart ollama-llm
```

### Worker failing jobs
```bash
docker compose logs -f worker
curl http://91.99.162.243:8080/queue/stats
```

### Redis connection issues
```bash
docker exec redis-queue redis-cli ping
docker restart redis-queue
```

## License Compliance

All services use open-source licenses:

| Service | License |
|---------|---------|
| Piper | MIT |
| Whisper | MIT |
| Ollama | MIT |
| Redis | BSD-3 |
| FastAPI | MIT |
| Postal | MIT |
| Uptime Kuma | MIT |
| Nginx | BSD-2 |

✅ **Open-Source Compliance: Verified**
