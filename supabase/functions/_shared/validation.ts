// Zod-like validation utilities for edge functions
// Using manual validation to avoid external dependencies

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Email validation
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

// UUID validation
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Safe string validation
export function isNonEmptyString(value: unknown, maxLength = 1000): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

// Path traversal check - CRITICAL for file access security
export function containsPathTraversal(path: string): boolean {
  // Check for directory traversal attempts
  const dangerous = [
    "..",
    "..\\",
    "../",
    "%2e%2e",
    "%2e%2e%2f",
    "%2e%2e/",
    "..%2f",
    "%252e%252e",
    "..%5c",
    "..%255c",
  ];
  
  const lowerPath = path.toLowerCase();
  return dangerous.some(pattern => lowerPath.includes(pattern));
}

// Validate file key format for storage
export function isValidStorageKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  if (key.length > 500) return false;
  if (containsPathTraversal(key)) return false;
  
  // Must match format: prefix/uuid/filename
  // e.g., raw/abc123-def456/image.jpg
  const validPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;
  return validPattern.test(key);
}

// Rate limiting state (in-memory, per-function instance)
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const state = rateLimitState.get(identifier);
  
  if (!state || now > state.resetAt) {
    // Reset or initialize
    const resetAt = now + config.windowMs;
    rateLimitState.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }
  
  if (state.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: state.resetAt };
  }
  
  state.count++;
  return { allowed: true, remaining: config.maxRequests - state.count, resetAt: state.resetAt };
}

// Get client identifier for rate limiting
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  
  return cfIp || realIp || forwarded?.split(",")[0]?.trim() || "unknown";
}

// Validate checkout request
export interface CheckoutInput {
  email?: string;
  package_name?: string;
  plan_id?: string;
  type?: string;
  credit_pack_id?: string;
}

export function validateCheckoutInput(body: unknown): ValidationResult<CheckoutInput> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== "object") {
    return { success: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }
  
  const input = body as Record<string, unknown>;
  
  // Validate email if present
  if (input.email !== undefined && !isValidEmail(input.email)) {
    errors.push({ field: "email", message: "Invalid email address" });
  }
  
  // Validate package_name if present
  if (input.package_name !== undefined && !isNonEmptyString(input.package_name, 50)) {
    errors.push({ field: "package_name", message: "Invalid package name" });
  }
  
  // Validate plan_id if present
  if (input.plan_id !== undefined && !isNonEmptyString(input.plan_id, 100)) {
    errors.push({ field: "plan_id", message: "Invalid plan ID" });
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: input as CheckoutInput };
}

// Validate upload request
export interface UploadInput {
  order_token: string;
  files: Array<{ name: string; type: string; base64: string }>;
}

export function validateUploadInput(body: unknown): ValidationResult<UploadInput> {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== "object") {
    return { success: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }
  
  const input = body as Record<string, unknown>;
  
  // Validate order_token
  if (!isValidUUID(input.order_token)) {
    errors.push({ field: "order_token", message: "Invalid order token" });
  }
  
  // Validate files array
  if (!Array.isArray(input.files) || input.files.length === 0) {
    errors.push({ field: "files", message: "Files array is required" });
  } else if (input.files.length > 20) {
    errors.push({ field: "files", message: "Maximum 20 files per upload" });
  } else {
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      if (!file || typeof file !== "object") {
        errors.push({ field: `files[${i}]`, message: "Invalid file object" });
        continue;
      }
      if (!isNonEmptyString(file.name, 255)) {
        errors.push({ field: `files[${i}].name`, message: "Invalid file name" });
      }
      if (containsPathTraversal(file.name || "")) {
        errors.push({ field: `files[${i}].name`, message: "Invalid characters in file name" });
      }
      if (!isNonEmptyString(file.type, 100)) {
        errors.push({ field: `files[${i}].type`, message: "Invalid file type" });
      }
      if (!isNonEmptyString(file.base64, 20 * 1024 * 1024)) { // ~15MB base64
        errors.push({ field: `files[${i}].base64`, message: "Invalid or too large file data" });
      }
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { 
    success: true, 
    data: {
      order_token: input.order_token as string,
      files: input.files as Array<{ name: string; type: string; base64: string }>
    }
  };
}

// Validate promo code
export function validatePromoCode(code: unknown): ValidationResult<string> {
  if (!isNonEmptyString(code, 50)) {
    return { success: false, errors: [{ field: "code", message: "Invalid promo code" }] };
  }
  
  // Only allow alphanumeric and basic punctuation
  if (!/^[A-Za-z0-9_-]+$/.test(code as string)) {
    return { success: false, errors: [{ field: "code", message: "Invalid promo code format" }] };
  }
  
  return { success: true, data: (code as string).toUpperCase() };
}
