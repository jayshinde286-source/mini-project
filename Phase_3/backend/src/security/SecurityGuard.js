/**
 * SecurityGuard
 * Enterprise-grade input sanitization, prototype pollution defense,
 * payload validation, and key safety verification for SPIT Cache Module.
 */

export class SecurityGuard {
  // Prohibited dangerous prototype manipulation property names
  static FORBIDDEN_KEYS = new Set([
    '__proto__',
    'constructor',
    'prototype'
  ]);

  // Allowed key regex: alphanumeric, underscores, hyphens, colons, dots, slashes, @, #
  static KEY_PATTERN = /^[a-zA-Z0-9_.:\-/@#]{1,256}$/;

  // Max payload limits
  static MAX_KEY_LENGTH = 256; // 256 bytes
  static MAX_VALUE_SIZE_BYTES = 2 * 1024 * 1024; // 2 Megabytes
  static MAX_TTL_SECONDS = 31536000; // 1 Year

  /**
   * Validates and sanitizes a cache key
   * Throws Error with explicit security violation reason if invalid
   */
  static validateKey(key) {
    if (typeof key !== 'string') {
      throw new Error('Security Error: Cache key must be a valid non-empty string');
    }

    const trimmed = key.trim();
    if (trimmed.length === 0) {
      throw new Error('Security Error: Cache key cannot be empty');
    }

    if (trimmed.length > SecurityGuard.MAX_KEY_LENGTH) {
      throw new Error(`Security Error: Cache key exceeds maximum permitted length of ${SecurityGuard.MAX_KEY_LENGTH} characters`);
    }

    // Prototype pollution prevention
    if (SecurityGuard.FORBIDDEN_KEYS.has(trimmed.toLowerCase())) {
      throw new Error(`Security Error: Forbidden key name "${trimmed}" (prototype pollution prevention)`);
    }

    // Path traversal prevention
    if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) {
      throw new Error('Security Error: Key contains forbidden path traversal or null byte sequences');
    }

    // Pattern enforcement
    if (!SecurityGuard.KEY_PATTERN.test(trimmed)) {
      throw new Error('Security Error: Cache key contains prohibited characters. Allowed: [a-zA-Z0-9_.:-/@#]');
    }

    return trimmed;
  }

  /**
   * Validates cache payload value and measures real byte size
   */
  static validateValue(value) {
    if (value === undefined) {
      throw new Error('Security Error: Cache value cannot be undefined');
    }

    let byteSize = 0;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      byteSize = Buffer.byteLength(serialized, 'utf8');
    } catch (e) {
      throw new Error('Security Error: Value cannot be safely serialized: ' + e.message);
    }

    if (byteSize > SecurityGuard.MAX_VALUE_SIZE_BYTES) {
      throw new Error(
        `Security Error: Value size (${(byteSize / 1024).toFixed(1)} KB) exceeds maximum limit of ${SecurityGuard.MAX_VALUE_SIZE_BYTES / (1024 * 1024)} MB`
      );
    }

    return { valid: true, byteSize };
  }

  /**
   * Validates TTL parameter
   */
  static validateTtl(ttlSeconds) {
    if (ttlSeconds === null || ttlSeconds === undefined || ttlSeconds === '') {
      return 0; // Default or persistent
    }

    const num = Number(ttlSeconds);
    if (!Number.isFinite(num) || isNaN(num) || num < 0) {
      throw new Error('Security Error: TTL must be a non-negative finite number of seconds');
    }

    if (num > SecurityGuard.MAX_TTL_SECONDS) {
      throw new Error(`Security Error: TTL exceeds maximum allowed limit of ${SecurityGuard.MAX_TTL_SECONDS} seconds`);
    }

    return Math.floor(num);
  }

  /**
   * Sanitizes generic string inputs to prevent injection
   */
  static sanitizeString(input, maxLength = 500) {
    if (typeof input !== 'string') return '';
    return input
      .slice(0, maxLength)
      .replace(/[<>'"\0]/g, '')
      .trim();
  }
}
