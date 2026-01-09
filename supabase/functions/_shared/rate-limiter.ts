/**
 * Persistent rate limiter with database tracking for alerting
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  blocked: boolean;
}

/**
 * Check rate limit with persistent tracking for alerting
 * Falls back to in-memory if DB write fails
 */
// deno-lint-ignore no-explicit-any
export async function checkRateLimitPersistent(
  sbAdmin: any,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(now - config.windowMs);

  try {
    // Check existing rate limit record
    const { data: existing } = await sbAdmin
      .from("rate_limit_log")
      .select("id, request_count, window_start, blocked_at")
      .eq("identifier", identifier)
      .eq("endpoint", config.endpoint)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const newCount = existing.request_count + 1;
      const allowed = newCount <= config.maxRequests;
      const blocked = !allowed && !existing.blocked_at;

      // Update the record
      await sbAdmin
        .from("rate_limit_log")
        .update({
          request_count: newCount,
          blocked_at: blocked ? new Date().toISOString() : existing.blocked_at,
        })
        .eq("id", existing.id);

      return {
        allowed,
        remaining: Math.max(0, config.maxRequests - newCount),
        resetAt: new Date(existing.window_start).getTime() + config.windowMs,
        blocked,
      };
    } else {
      // Create new window
      await sbAdmin.from("rate_limit_log").insert({
        identifier,
        endpoint: config.endpoint,
        request_count: 1,
        window_start: new Date().toISOString(),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
        blocked: false,
      };
    }
  } catch (error) {
    // On DB error, allow request but log
    console.error("[RATE_LIMIT] DB error, allowing request:", error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      blocked: false,
    };
  }
}

/**
 * Get client identifier from request for rate limiting
 * Combines IP and optional user ID for more precise limiting
 */
export function getRateLimitIdentifier(req: Request, userId?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  if (userId) {
    return `${ip}:${userId}`;
  }
  return ip;
}
