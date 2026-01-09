"""
FastAPI Worker - Job Queue Processor
Replaces Modal compute for AI headshot processing

Connects to Lovable Edge Functions via HMAC-signed callbacks.
Includes real-time dashboard for monitoring.
"""

import os
import json
import hmac
import hashlib
import asyncio
import logging
import platform
import psutil
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager
from collections import deque

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
PIPER_URL = os.getenv("PIPER_URL", "http://localhost:10200")
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:9000")
WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "4"))
MAX_RETRIES = int(os.getenv("WORKER_MAX_RETRIES", "3"))
SERVER_NAME = os.getenv("SERVER_NAME", "Ethinx Worker")
DOMAIN = os.getenv("DOMAIN", "")

# Supabase/Lovable callback configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ywaseswwmlxjkfpnwaou.supabase.co")
WORKER_API_KEY = os.getenv("WORKER_API_KEY", "")
FINALIZE_ORDER_URL = f"{SUPABASE_URL}/functions/v1/finalize-order"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Metrics storage
START_TIME = datetime.utcnow()
JOB_HISTORY: deque = deque(maxlen=100)  # Last 100 jobs
METRICS = {
    "jobs_processed": 0,
    "jobs_failed": 0,
    "jobs_retried": 0,
    "total_processing_time": 0.0,
    "last_job_at": None
}

# Redis connection pool
redis_pool: Optional[redis.Redis] = None


class JobPayload(BaseModel):
    """Job payload from poll-queue edge function"""
    order_id: str
    order_token: str
    email: str
    package_name: Optional[str] = "starter"
    photo_count: Optional[int] = 5
    promo_code: Optional[str] = None
    upload_prefix: Optional[str] = None
    result_prefix: Optional[str] = None
    zip_path: Optional[str] = None
    # Legacy fields
    photo_urls: Optional[list[str]] = None
    style: str = "professional"
    webhook_url: Optional[str] = None
    metadata: Optional[dict] = None


class JobResult(BaseModel):
    job_id: str
    status: str
    result_urls: Optional[list[str]] = None
    error: Optional[str] = None
    processed_at: Optional[str] = None


def generate_hmac_signature(payload: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for callback authentication"""
    return hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_pool
    
    # Startup
    logger.info("Starting worker service...")
    logger.info(f"Supabase URL: {SUPABASE_URL}")
    logger.info(f"Finalize endpoint: {FINALIZE_ORDER_URL}")
    redis_pool = redis.from_url(REDIS_URL, decode_responses=True)
    
    # Start background job processor
    asyncio.create_task(job_processor())
    
    yield
    
    # Shutdown
    logger.info("Shutting down worker service...")
    if redis_pool:
        await redis_pool.close()


app = FastAPI(
    title="ETHINX AI Worker",
    description="FastAPI-based job queue processor for AI headshot generation",
    version="2.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await redis_pool.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    # Check Ollama connection
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_URL}/")
            ollama_status = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        ollama_status = "unreachable"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "services": {
            "redis": redis_status,
            "ollama": ollama_status
        },
        "config": {
            "supabase_url": SUPABASE_URL,
            "finalize_endpoint": FINALIZE_ORDER_URL,
            "concurrency": WORKER_CONCURRENCY
        }
    }


@app.post("/jobs/enqueue")
async def enqueue_job(payload: JobPayload, x_api_key: Optional[str] = Header(None)):
    """Add a new job to the queue"""
    # Optional: Verify API key
    if WORKER_API_KEY and x_api_key != WORKER_API_KEY:
        logger.warning(f"Invalid API key for order {payload.order_id}")
        # Don't reject for now to maintain backward compatibility
    
    job_id = f"job_{payload.order_id}_{datetime.utcnow().timestamp()}"
    
    job_data = {
        "id": job_id,
        "payload": payload.model_dump(),
        "status": "queued",
        "attempts": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Add to Redis queue
    await redis_pool.lpush("job_queue", json.dumps(job_data))
    await redis_pool.set(f"job:{job_id}", json.dumps(job_data))
    
    logger.info(f"Enqueued job: {job_id} for order {payload.order_id}")
    
    return {"job_id": job_id, "status": "queued", "order_id": payload.order_id}


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status by ID"""
    job_data = await redis_pool.get(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return json.loads(job_data)


@app.get("/jobs")
async def list_jobs(status: Optional[str] = None, limit: int = 50):
    """List recent jobs"""
    # Get all job keys
    keys = await redis_pool.keys("job:*")
    jobs = []
    
    for key in keys[:limit]:
        job_data = await redis_pool.get(key)
        if job_data:
            job = json.loads(job_data)
            if status is None or job.get("status") == status:
                jobs.append(job)
    
    return {"jobs": jobs, "count": len(jobs)}


@app.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str):
    """Retry a failed job"""
    job_data = await redis_pool.get(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = json.loads(job_data)
    
    if job["status"] not in ["failed", "error"]:
        raise HTTPException(status_code=400, detail="Can only retry failed jobs")
    
    job["status"] = "queued"
    job["attempts"] = 0
    job["error"] = None
    
    await redis_pool.set(f"job:{job_id}", json.dumps(job))
    await redis_pool.lpush("job_queue", json.dumps(job))
    
    return {"job_id": job_id, "status": "requeued"}


@app.get("/queue/stats")
async def queue_stats():
    """Get queue statistics"""
    queue_length = await redis_pool.llen("job_queue")
    processing = await redis_pool.scard("jobs_processing")
    
    # Count jobs by status
    keys = await redis_pool.keys("job:*")
    status_counts = {"queued": 0, "processing": 0, "completed": 0, "failed": 0}
    
    for key in keys:
        job_data = await redis_pool.get(key)
        if job_data:
            job = json.loads(job_data)
            status = job.get("status", "unknown")
            if status in status_counts:
                status_counts[status] += 1
    
    return {
        "queue_length": queue_length,
        "processing": processing,
        "status_counts": status_counts
    }


# ============================================
# Dashboard Endpoints
# ============================================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    """Serve the monitoring dashboard"""
    return DASHBOARD_HTML


@app.get("/api/metrics")
async def get_metrics():
    """Get comprehensive system and job metrics"""
    uptime = datetime.utcnow() - START_TIME
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Queue stats
    queue_length = await redis_pool.llen("job_queue") if redis_pool else 0
    processing_count = await redis_pool.scard("jobs_processing") if redis_pool else 0
    
    # Calculate rates
    avg_processing_time = (
        METRICS["total_processing_time"] / METRICS["jobs_processed"]
        if METRICS["jobs_processed"] > 0 else 0
    )
    
    success_rate = (
        (METRICS["jobs_processed"] / (METRICS["jobs_processed"] + METRICS["jobs_failed"])) * 100
        if (METRICS["jobs_processed"] + METRICS["jobs_failed"]) > 0 else 100
    )
    
    return {
        "server": {
            "name": SERVER_NAME,
            "domain": DOMAIN or "localhost",
            "version": "2.0.0",
            "uptime_seconds": int(uptime.total_seconds()),
            "uptime_formatted": format_duration(uptime),
            "started_at": START_TIME.isoformat()
        },
        "system": {
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "cpu_percent": cpu_percent,
            "cpu_count": psutil.cpu_count(),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_percent": memory.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_percent": disk.percent
        },
        "queue": {
            "pending": queue_length,
            "processing": processing_count,
            "concurrency": WORKER_CONCURRENCY
        },
        "jobs": {
            "processed": METRICS["jobs_processed"],
            "failed": METRICS["jobs_failed"],
            "retried": METRICS["jobs_retried"],
            "success_rate": round(success_rate, 1),
            "avg_processing_time": round(avg_processing_time, 2),
            "last_job_at": METRICS["last_job_at"]
        },
        "config": {
            "redis_url": REDIS_URL.split("@")[-1] if "@" in REDIS_URL else REDIS_URL,
            "supabase_url": SUPABASE_URL,
            "max_retries": MAX_RETRIES
        }
    }


@app.get("/api/history")
async def get_job_history(limit: int = 50):
    """Get recent job history"""
    history = list(JOB_HISTORY)[-limit:]
    history.reverse()  # Most recent first
    return {"jobs": history, "count": len(history)}


@app.get("/api/services")
async def get_services_status():
    """Check status of all connected services"""
    services = {}
    
    # Check Redis
    try:
        if redis_pool:
            await redis_pool.ping()
            info = await redis_pool.info()
            services["redis"] = {
                "status": "healthy",
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "unknown"),
                "uptime_days": info.get("uptime_in_days", 0)
            }
    except Exception as e:
        services["redis"] = {"status": "unhealthy", "error": str(e)}
    
    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                services["ollama"] = {
                    "status": "healthy",
                    "models": models[:5],  # First 5 models
                    "model_count": len(data.get("models", []))
                }
            else:
                services["ollama"] = {"status": "degraded", "code": response.status_code}
    except Exception as e:
        services["ollama"] = {"status": "unhealthy", "error": str(e)}
    
    # Check Piper TTS
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(PIPER_URL)
            services["piper"] = {
                "status": "healthy" if response.status_code in [200, 404] else "degraded"
            }
    except Exception as e:
        services["piper"] = {"status": "unhealthy", "error": str(e)}
    
    # Check Whisper STT
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{WHISPER_URL}/")
            services["whisper"] = {
                "status": "healthy" if response.status_code == 200 else "degraded"
            }
    except Exception as e:
        services["whisper"] = {"status": "unhealthy", "error": str(e)}
    
    return {"services": services, "timestamp": datetime.utcnow().isoformat()}


def format_duration(delta: timedelta) -> str:
    """Format timedelta as human-readable string"""
    days = delta.days
    hours, remainder = divmod(delta.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if seconds > 0 or not parts:
        parts.append(f"{seconds}s")
    
    return " ".join(parts)


# Dashboard HTML Template
DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ethinx Worker Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        .status-healthy { color: #22c55e; }
        .status-degraded { color: #f59e0b; }
        .status-unhealthy { color: #ef4444; }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-7xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-3xl font-bold text-white flex items-center gap-3">
                    <span class="w-3 h-3 bg-green-500 rounded-full pulse-dot"></span>
                    Ethinx Worker Dashboard
                </h1>
                <p class="text-gray-400 mt-1" id="server-info">Loading...</p>
            </div>
            <div class="text-right">
                <div class="text-sm text-gray-400">Last updated</div>
                <div class="text-lg font-mono" id="last-update">--:--:--</div>
            </div>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-gray-400 text-sm mb-1">Queue Pending</div>
                <div class="text-3xl font-bold text-blue-400" id="queue-pending">0</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-gray-400 text-sm mb-1">Processing</div>
                <div class="text-3xl font-bold text-yellow-400" id="queue-processing">0</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-gray-400 text-sm mb-1">Completed</div>
                <div class="text-3xl font-bold text-green-400" id="jobs-completed">0</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="text-gray-400 text-sm mb-1">Failed</div>
                <div class="text-3xl font-bold text-red-400" id="jobs-failed">0</div>
            </div>
        </div>
        
        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- System Metrics -->
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="cpu" class="w-5 h-5"></i>
                    System Metrics
                </h2>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-400">CPU</span>
                            <span id="cpu-percent">0%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full transition-all" id="cpu-bar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-400">Memory</span>
                            <span id="memory-percent">0%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full transition-all" id="memory-bar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-400">Disk</span>
                            <span id="disk-percent">0%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-purple-500 h-2 rounded-full transition-all" id="disk-bar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="pt-2 border-t border-gray-700">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">Uptime</span>
                            <span id="uptime">--</span>
                        </div>
                        <div class="flex justify-between text-sm mt-2">
                            <span class="text-gray-400">Success Rate</span>
                            <span id="success-rate">--%</span>
                        </div>
                        <div class="flex justify-between text-sm mt-2">
                            <span class="text-gray-400">Avg Process Time</span>
                            <span id="avg-time">--s</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Services Status -->
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="server" class="w-5 h-5"></i>
                    Services
                </h2>
                <div class="space-y-3" id="services-list">
                    <div class="text-gray-400">Loading...</div>
                </div>
            </div>
            
            <!-- Recent Jobs -->
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="list" class="w-5 h-5"></i>
                    Recent Jobs
                </h2>
                <div class="space-y-2 max-h-80 overflow-y-auto" id="jobs-list">
                    <div class="text-gray-400">No jobs yet</div>
                </div>
            </div>
        </div>
        
        <!-- Job History Table -->
        <div class="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                <i data-lucide="history" class="w-5 h-5"></i>
                Job History
            </h2>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-gray-400 border-b border-gray-700">
                            <th class="pb-2 pr-4">Job ID</th>
                            <th class="pb-2 pr-4">Order</th>
                            <th class="pb-2 pr-4">Status</th>
                            <th class="pb-2 pr-4">Duration</th>
                            <th class="pb-2">Time</th>
                        </tr>
                    </thead>
                    <tbody id="history-table">
                        <tr><td colspan="5" class="py-4 text-gray-400">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Status colors
        const statusColors = {
            'queued': 'text-blue-400',
            'processing': 'text-yellow-400',
            'completed': 'text-green-400',
            'failed': 'text-red-400'
        };
        
        const statusBadge = (status) => {
            const color = statusColors[status] || 'text-gray-400';
            return `<span class="${color} capitalize">${status}</span>`;
        };
        
        // Fetch and update metrics
        async function updateMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                // Server info
                document.getElementById('server-info').textContent = 
                    `${data.server.domain || 'localhost'} • v${data.server.version}`;
                
                // Queue stats
                document.getElementById('queue-pending').textContent = data.queue.pending;
                document.getElementById('queue-processing').textContent = data.queue.processing;
                document.getElementById('jobs-completed').textContent = data.jobs.processed;
                document.getElementById('jobs-failed').textContent = data.jobs.failed;
                
                // System metrics
                document.getElementById('cpu-percent').textContent = `${data.system.cpu_percent}%`;
                document.getElementById('cpu-bar').style.width = `${data.system.cpu_percent}%`;
                
                document.getElementById('memory-percent').textContent = `${data.system.memory_percent}%`;
                document.getElementById('memory-bar').style.width = `${data.system.memory_percent}%`;
                
                document.getElementById('disk-percent').textContent = `${data.system.disk_percent}%`;
                document.getElementById('disk-bar').style.width = `${data.system.disk_percent}%`;
                
                document.getElementById('uptime').textContent = data.server.uptime_formatted;
                document.getElementById('success-rate').textContent = `${data.jobs.success_rate}%`;
                document.getElementById('avg-time').textContent = `${data.jobs.avg_processing_time}s`;
                
                document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
            } catch (e) {
                console.error('Failed to fetch metrics:', e);
            }
        }
        
        // Fetch and update services
        async function updateServices() {
            try {
                const response = await fetch('/api/services');
                const data = await response.json();
                
                const container = document.getElementById('services-list');
                container.innerHTML = '';
                
                for (const [name, info] of Object.entries(data.services)) {
                    const statusClass = `status-${info.status}`;
                    const icon = info.status === 'healthy' ? 'check-circle' : 
                                 info.status === 'degraded' ? 'alert-circle' : 'x-circle';
                    
                    let details = '';
                    if (info.models) details = `${info.model_count} models`;
                    if (info.connected_clients) details = `${info.connected_clients} clients`;
                    if (info.used_memory) details += ` • ${info.used_memory}`;
                    
                    container.innerHTML += `
                        <div class="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                            <div class="flex items-center gap-2">
                                <i data-lucide="${icon}" class="w-4 h-4 ${statusClass}"></i>
                                <span class="capitalize">${name}</span>
                            </div>
                            <span class="text-xs text-gray-400">${details || info.status}</span>
                        </div>
                    `;
                }
                
                lucide.createIcons();
            } catch (e) {
                console.error('Failed to fetch services:', e);
            }
        }
        
        // Fetch and update job history
        async function updateHistory() {
            try {
                const response = await fetch('/api/history?limit=20');
                const data = await response.json();
                
                const table = document.getElementById('history-table');
                
                if (data.jobs.length === 0) {
                    table.innerHTML = '<tr><td colspan="5" class="py-4 text-gray-400">No jobs in history</td></tr>';
                    return;
                }
                
                table.innerHTML = data.jobs.map(job => `
                    <tr class="border-b border-gray-700/50">
                        <td class="py-2 pr-4 font-mono text-xs">${job.id?.slice(0, 20) || '--'}...</td>
                        <td class="py-2 pr-4">${job.order_id?.slice(0, 8) || '--'}...</td>
                        <td class="py-2 pr-4">${statusBadge(job.status)}</td>
                        <td class="py-2 pr-4">${job.duration ? job.duration.toFixed(1) + 's' : '--'}</td>
                        <td class="py-2 text-gray-400">${job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : '--'}</td>
                    </tr>
                `).join('');
            } catch (e) {
                console.error('Failed to fetch history:', e);
            }
        }
        
        // Fetch recent jobs for sidebar
        async function updateRecentJobs() {
            try {
                const response = await fetch('/jobs?limit=10');
                const data = await response.json();
                
                const container = document.getElementById('jobs-list');
                
                if (data.jobs.length === 0) {
                    container.innerHTML = '<div class="text-gray-400">No jobs yet</div>';
                    return;
                }
                
                container.innerHTML = data.jobs.map(job => `
                    <div class="p-2 bg-gray-700/50 rounded text-sm">
                        <div class="flex justify-between items-center">
                            <span class="font-mono text-xs">${job.id?.slice(4, 20) || '--'}</span>
                            ${statusBadge(job.status)}
                        </div>
                    </div>
                `).join('');
            } catch (e) {
                console.error('Failed to fetch jobs:', e);
            }
        }
        
        // Initial load and auto-refresh
        updateMetrics();
        updateServices();
        updateHistory();
        updateRecentJobs();
        
        setInterval(updateMetrics, 5000);      // Every 5 seconds
        setInterval(updateServices, 30000);    // Every 30 seconds
        setInterval(updateHistory, 10000);     // Every 10 seconds
        setInterval(updateRecentJobs, 5000);   // Every 5 seconds
    </script>
</body>
</html>
"""


async def job_processor():
    """Background job processor"""
    logger.info(f"Starting job processor with concurrency={WORKER_CONCURRENCY}")
    
    semaphore = asyncio.Semaphore(WORKER_CONCURRENCY)
    
    while True:
        try:
            # Pop job from queue (blocking)
            job_data = await redis_pool.brpop("job_queue", timeout=5)
            
            if job_data:
                _, job_json = job_data
                job = json.loads(job_json)
                
                async with semaphore:
                    asyncio.create_task(process_job(job))
            
        except Exception as e:
            logger.error(f"Job processor error: {e}")
            await asyncio.sleep(1)


async def process_job(job: dict):
    """Process a single job with metrics tracking"""
    job_id = job["id"]
    payload = job["payload"]
    order_id = payload.get("order_id")
    order_token = payload.get("order_token")
    email = payload.get("email")
    
    start_time = datetime.utcnow()
    
    try:
        # Mark as processing
        job["status"] = "processing"
        job["attempts"] += 1
        job["started_at"] = start_time.isoformat()
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
        await redis_pool.sadd("jobs_processing", job_id)
        
        logger.info(f"Processing job: {job_id} for order {order_id} (attempt {job['attempts']})")
        
        # Process headshots
        photo_urls = payload.get("photo_urls") or []
        result_urls = await process_headshots(
            photo_urls=photo_urls,
            style=payload.get("style", "professional"),
            upload_prefix=payload.get("upload_prefix"),
            result_prefix=payload.get("result_prefix")
        )
        
        # Calculate duration
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Mark as completed locally
        job["status"] = "completed"
        job["result_urls"] = result_urls
        job["completed_at"] = end_time.isoformat()
        job["duration"] = duration
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
        
        # Update metrics
        METRICS["jobs_processed"] += 1
        METRICS["total_processing_time"] += duration
        METRICS["last_job_at"] = end_time.isoformat()
        
        # Add to history
        JOB_HISTORY.append({
            "id": job_id,
            "order_id": order_id,
            "status": "completed",
            "duration": duration,
            "completed_at": end_time.isoformat(),
            "photo_count": len(photo_urls)
        })
        
        logger.info(f"Completed job: {job_id} in {duration:.2f}s, notifying finalize-order...")
        
        # Call finalize-order edge function with HMAC signature
        await notify_finalize_order(
            order_id=order_id,
            order_token=order_token,
            email=email,
            results=result_urls,
            zip_key=payload.get("zip_path", f"orders/zips/{order_token}.zip")
        )
        
        # Also call legacy webhook if provided
        if payload.get("webhook_url"):
            await call_webhook(payload["webhook_url"], job)
        
        logger.info(f"Successfully completed and notified for job: {job_id}")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        job["error"] = str(e)
        job["duration"] = duration
        
        if job["attempts"] < MAX_RETRIES:
            # Requeue for retry
            job["status"] = "queued"
            await redis_pool.lpush("job_queue", json.dumps(job))
            METRICS["jobs_retried"] += 1
            logger.info(f"Requeued job {job_id} for retry")
        else:
            # Mark as failed
            job["status"] = "failed"
            job["failed_at"] = end_time.isoformat()
            METRICS["jobs_failed"] += 1
            
            # Add to history
            JOB_HISTORY.append({
                "id": job_id,
                "order_id": order_id,
                "status": "failed",
                "duration": duration,
                "completed_at": end_time.isoformat(),
                "error": str(e)[:100]
            })
            
            logger.error(f"Job {job_id} permanently failed after {MAX_RETRIES} attempts")
        
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
    
    finally:
        await redis_pool.srem("jobs_processing", job_id)


async def process_headshots(
    photo_urls: list[str], 
    style: str,
    upload_prefix: Optional[str] = None,
    result_prefix: Optional[str] = None
) -> list[str]:
    """
    Process headshots using local AI services
    This is where you'd integrate with your actual AI pipeline
    
    TODO: Integrate with:
    - Ollama for image understanding
    - Local Stable Diffusion / ComfyUI for image generation
    - Supabase Storage for file upload/download
    """
    result_urls = []
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        for i, url in enumerate(photo_urls):
            logger.info(f"Processing photo {i+1}/{len(photo_urls)}: {url} with style: {style}")
            
            # Simulate processing time (replace with actual AI processing)
            await asyncio.sleep(2)
            
            # Generate result filename
            result_filename = f"result_{i:03d}.jpg"
            if result_prefix:
                result_url = f"{result_prefix}{result_filename}"
            else:
                result_url = f"{url}?processed=true&style={style}"
            
            result_urls.append(result_url)
            logger.info(f"Generated result: {result_url}")
    
    return result_urls


async def notify_finalize_order(
    order_id: str,
    order_token: str,
    email: str,
    results: list[str],
    zip_key: str
):
    """
    Call the finalize-order edge function with HMAC-signed payload
    
    This notifies Lovable/Supabase that the job is complete and triggers:
    - Order status update to 'completed'
    - Signed URL generation for download
    - Customer email notification
    """
    if not WORKER_API_KEY:
        logger.warning("WORKER_API_KEY not set, skipping finalize-order callback")
        return
    
    # Build callback payload
    callback_payload = {
        "order_id": order_id,
        "order_token": order_token,
        "email": email,
        "results": results,
        "zip_key": zip_key
    }
    
    payload_json = json.dumps(callback_payload, separators=(',', ':'))
    
    # Generate HMAC-SHA256 signature
    signature = generate_hmac_signature(payload_json, WORKER_API_KEY)
    
    logger.info(f"Calling finalize-order for order {order_id}")
    logger.debug(f"Payload: {payload_json}")
    logger.debug(f"Signature: {signature[:16]}...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                FINALIZE_ORDER_URL,
                content=payload_json,
                headers={
                    "Content-Type": "application/json",
                    "x-ethinx-signature": signature
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully notified finalize-order for order {order_id}")
            else:
                logger.error(
                    f"finalize-order returned {response.status_code}: {response.text}"
                )
                raise Exception(f"finalize-order failed with status {response.status_code}")
                
    except httpx.TimeoutException:
        logger.error(f"Timeout calling finalize-order for order {order_id}")
        raise
    except Exception as e:
        logger.error(f"Error calling finalize-order: {e}")
        raise


async def call_webhook(webhook_url: str, job: dict):
    """Call legacy webhook with job result"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(webhook_url, json={
                "job_id": job["id"],
                "status": job["status"],
                "result_urls": job.get("result_urls"),
                "error": job.get("error"),
                "completed_at": job.get("completed_at")
            })
            logger.info(f"Called legacy webhook for job {job['id']}")
    except Exception as e:
        logger.error(f"Legacy webhook call failed for job {job['id']}: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
