/**
 * Cache Engine Service Layer
 * Abstracts cache operations (SET, GET, DELETE, CLEAR)
 * Connects directly to Java backend API when available, falls back to local state manager.
 */

import { apiRequest, ApiError, API_CONFIG } from './apiService.js';

export const validateKey = (key) => {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new ApiError('Cache key cannot be empty or blank.', 400);
  }
  if (key.length > 256) {
    throw new ApiError('Cache key exceeds maximum length of 256 characters.', 400);
  }
  return key.trim();
};

export const validateValue = (value) => {
  if (value === null || value === undefined) {
    throw new ApiError('Cache value cannot be null or undefined.', 400);
  }
  return String(value);
};

export const validateTTL = (ttl, unit = 'seconds') => {
  if (ttl === null || ttl === undefined || ttl === '') {
    return 0; // Persistent entry
  }
  const num = Number(ttl);
  if (isNaN(num) || num < 0) {
    throw new ApiError('TTL must be a non-negative number.', 400);
  }
  if (num === 0) return 0;

  switch (unit) {
    case 'minutes':
      return num * 60 * 1000;
    case 'hours':
      return num * 3600 * 1000;
    case 'milliseconds':
      return num;
    case 'seconds':
    default:
      return num * 1000;
  }
};

export const cacheService = {
  async getAllEntries() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/cache/entries');
    }
    return null; // Will be handled by state manager
  },

  async get(key) {
    const validKey = validateKey(key);
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest(`/cache/entries/${encodeURIComponent(validKey)}`);
    }
    return null;
  },

  async set(key, value, ttl = 0, unit = 'seconds') {
    const validKey = validateKey(key);
    const validVal = validateValue(value);
    const ttlMs = validateTTL(ttl, unit);

    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/cache/entries', {
        method: 'POST',
        body: JSON.stringify({ key: validKey, value: validVal, ttlMs })
      });
    }

    return {
      key: validKey,
      value: validVal,
      ttlMs,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0
    };
  },

  async delete(key) {
    const validKey = validateKey(key);
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest(`/cache/entries/${encodeURIComponent(validKey)}`, {
        method: 'DELETE'
      });
    }
    return { key: validKey, success: true };
  },

  async clear() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/cache/clear', { method: 'POST' });
    }
    return { cleared: true };
  }
};
