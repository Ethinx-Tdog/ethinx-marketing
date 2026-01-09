"""
FastAPI Worker - Job Queue Processor
Replaces Modal compute for AI headshot processing
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
PIPER_URL = os.getenv("PIPER_URL", "http://localhost:10200")
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:9000")
WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "4"))
MAX_RETRIES = int(os.getenv("WORKER_MAX_RETRIES", "3"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis connection pool
redis_pool: Optional[redis.Redis] = None


class JobPayload(BaseModel):
    order_id: str
    photo_urls: list[str]
    style: str = "professional"
    webhook_url: Optional[str] = None
    metadata: Optional[dict] = None


class JobResult(BaseModel):
    job_id: str
    status: str
    result_urls: Optional[list[str]] = None
    error: Optional[str] = None
    processed_at: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global redis_pool
    
    # Startup
    logger.info("Starting worker service...")
    redis_pool = redis.from_url(REDIS_URL, decode_responses=True)
    
    # Start background job processor
    asyncio.create_task(job_processor())
    
    yield
    
    # Shutdown
    logger.info("Shutting down worker service...")
    if redis_pool:
        await redis_pool.close()


app = FastAPI(
    title="AI Worker Queue",
    description="FastAPI-based job queue processor for AI headshot generation",
    version="1.0.0",
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
        "services": {
            "redis": redis_status,
            "ollama": ollama_status
        }
    }


@app.post("/jobs/enqueue")
async def enqueue_job(payload: JobPayload):
    """Add a new job to the queue"""
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
    
    logger.info(f"Enqueued job: {job_id}")
    
    return {"job_id": job_id, "status": "queued"}


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
    """Process a single job"""
    job_id = job["id"]
    
    try:
        # Mark as processing
        job["status"] = "processing"
        job["attempts"] += 1
        job["started_at"] = datetime.utcnow().isoformat()
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
        await redis_pool.sadd("jobs_processing", job_id)
        
        logger.info(f"Processing job: {job_id} (attempt {job['attempts']})")
        
        # Simulate AI processing (replace with actual implementation)
        payload = job["payload"]
        result_urls = await process_headshots(
            photo_urls=payload["photo_urls"],
            style=payload.get("style", "professional")
        )
        
        # Mark as completed
        job["status"] = "completed"
        job["result_urls"] = result_urls
        job["completed_at"] = datetime.utcnow().isoformat()
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
        
        # Call webhook if provided
        if payload.get("webhook_url"):
            await call_webhook(payload["webhook_url"], job)
        
        logger.info(f"Completed job: {job_id}")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        
        job["error"] = str(e)
        
        if job["attempts"] < MAX_RETRIES:
            # Requeue for retry
            job["status"] = "queued"
            await redis_pool.lpush("job_queue", json.dumps(job))
            logger.info(f"Requeued job {job_id} for retry")
        else:
            # Mark as failed
            job["status"] = "failed"
            job["failed_at"] = datetime.utcnow().isoformat()
            logger.error(f"Job {job_id} permanently failed after {MAX_RETRIES} attempts")
        
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
    
    finally:
        await redis_pool.srem("jobs_processing", job_id)


async def process_headshots(photo_urls: list[str], style: str) -> list[str]:
    """
    Process headshots using local AI services
    This is where you'd integrate with your actual AI pipeline
    """
    result_urls = []
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        for url in photo_urls:
            # For now, return placeholder - integrate with your AI model here
            # You could call Ollama for image understanding, or integrate
            # with a local Stable Diffusion / ComfyUI instance
            
            logger.info(f"Processing photo: {url} with style: {style}")
            
            # Simulate processing time
            await asyncio.sleep(2)
            
            # Return processed URL (replace with actual processing)
            result_urls.append(f"{url}?processed=true&style={style}")
    
    return result_urls


async def call_webhook(webhook_url: str, job: dict):
    """Call webhook with job result"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(webhook_url, json={
                "job_id": job["id"],
                "status": job["status"],
                "result_urls": job.get("result_urls"),
                "error": job.get("error"),
                "completed_at": job.get("completed_at")
            })
            logger.info(f"Called webhook for job {job['id']}")
    except Exception as e:
        logger.error(f"Webhook call failed for job {job['id']}: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
