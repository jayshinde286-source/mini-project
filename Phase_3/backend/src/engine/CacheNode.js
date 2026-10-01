/**
 * CacheNode
 * Fundamental node element stored in the in-memory doubly-linked list.
 */
export class CacheNode {
  constructor(key, value, ttlSeconds = 0) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = ttlSeconds > 0 ? this.createdAt + (ttlSeconds * 1000) : 0;
    this.accessCount = 1;
    this.prev = null;
    this.next = null;
  }

  isExpired(currentTime = Date.now()) {
    if (this.expiresAt === 0) return false;
    return currentTime >= this.expiresAt;
  }

  getTtlRemainingMs(currentTime = Date.now()) {
    if (this.expiresAt === 0) return Infinity;
    const remaining = this.expiresAt - currentTime;
    return remaining > 0 ? remaining : 0;
  }

  toJSON() {
    return {
      key: this.key,
      value: this.value,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      ttlRemainingMs: this.getTtlRemainingMs(),
      accessCount: this.accessCount,
      expired: this.isExpired()
    };
  }
}
