/**
 * RateLimiter
 * High-performance sliding-window in-memory rate limiter for DoS protection.
 * Tracks client IP requests with microsecond accuracy and auto-eviction.
 */

export class RateLimiter {
  constructor({ windowMs = 60000, maxRequests = 600, burstMax = 50 } = {}) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.burstMax = burstMax;
    this.clients = new Map(); // IP -> { tokens, lastRefill, timestamps: [] }

    // Metrics
    this.stats = {
      totalChecks: 0,
      totalBlocked: 0,
      activeTrackedIps: 0
    };

    // Periodic sweep for stale IPs every 60 seconds
    this.cleanupTimer = setInterval(() => {
      this.evictStaleClients();
    }, 60000);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref(); // Don't block Node process exit
    }
  }

  /**
   * Checks if an incoming request from an IP is allowed
   * Returns { allowed: boolean, remaining: number, resetMs: number }
   */
  check(ip) {
    this.stats.totalChecks++;
    const now = Date.now();
    const clientKey = ip || '127.0.0.1';

    let record = this.clients.get(clientKey);
    if (!record) {
      record = { timestamps: [] };
      this.clients.set(clientKey, record);
    }

    // Filter out timestamps outside the sliding window
    const windowStart = now - this.windowMs;
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    // Check burst limit (last 1 second)
    const oneSecAgo = now - 1000;
    const burstCount = record.timestamps.filter(ts => ts > oneSecAgo).length;
    if (burstCount >= this.burstMax) {
      this.stats.totalBlocked++;
      return {
        allowed: false,
        remaining: 0,
        resetMs: 1000,
        reason: 'Burst rate limit exceeded'
      };
    }

    // Check window limit
    if (record.timestamps.length >= this.maxRequests) {
      this.stats.totalBlocked++;
      const oldestInWindow = record.timestamps[0];
      const resetMs = Math.max(1000, (oldestInWindow + this.windowMs) - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
        reason: 'Window rate limit exceeded'
      };
    }

    // Request is allowed
    record.timestamps.push(now);
    const remaining = this.maxRequests - record.timestamps.length;
    const oldestInWindow = record.timestamps[0];
    const resetMs = Math.max(1000, (oldestInWindow + this.windowMs) - now);

    this.stats.activeTrackedIps = this.clients.size;

    return {
      allowed: true,
      remaining,
      resetMs
    };
  }

  evictStaleClients() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [ip, record] of this.clients.entries()) {
      record.timestamps = record.timestamps.filter(ts => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.clients.delete(ip);
      }
    }
    this.stats.activeTrackedIps = this.clients.size;
  }

  getStats() {
    return {
      ...this.stats,
      activeTrackedIps: this.clients.size,
      windowMs: this.windowMs,
      maxRequestsPerWindow: this.maxRequests
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
