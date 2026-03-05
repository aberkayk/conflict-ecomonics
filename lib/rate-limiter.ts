interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private maxTokens: number;
  private refillRate: number; // tokens per ms

  constructor(maxTokens: number, refillPerMinute: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillPerMinute / 60000;
  }

  check(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, retryAfterMs: 0 };
    }

    const retryAfterMs = Math.ceil((1 - bucket.tokens) / this.refillRate);
    return { allowed: false, retryAfterMs };
  }
}

export const apiLimiter = new RateLimiter(30, 30); // 30 req/min
export const analysisLimiter = new RateLimiter(10, 10); // 10 req/min
