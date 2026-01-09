"""
FastAPI Worker - Job Queue Processor
Replaces Modal compute for AI headshot processing

Connects to Lovable Edge Functions via HMAC-signed callbacks.
"""

import os
import json
import hmac
import hashlib
import asyncio
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
PIPER_URL = os.getenv("PIPER_URL", "http://localhost:10200")
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:9000")
WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "4"))
MAX_RETRIES = int(os.getenv("WORKER_MAX_RETRIES", "3"))

# Supabase/Lovable callback configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ywaseswwmlxjkfpnwaou.supabase.co")
WORKER_API_KEY = os.getenv("WORKER_API_KEY", "")
FINALIZE_ORDER_URL = f"{SUPABASE_URL}/functions/v1/finalize-order"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    payload = job["payload"]
    order_id = payload.get("order_id")
    order_token = payload.get("order_token")
    email = payload.get("email")
    
    try:
        # Mark as processing
        job["status"] = "processing"
        job["attempts"] += 1
        job["started_at"] = datetime.utcnow().isoformat()
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
        
        # Mark as completed locally
        job["status"] = "completed"
        job["result_urls"] = result_urls
        job["completed_at"] = datetime.utcnow().isoformat()
        await redis_pool.set(f"job:{job_id}", json.dumps(job))
        
        logger.info(f"Completed job: {job_id}, notifying finalize-order...")
        
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
