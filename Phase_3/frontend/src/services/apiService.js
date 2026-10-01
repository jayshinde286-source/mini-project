/**
 * Base API Client Service
 * Configured for real backend REST & SSE gateway (100% genuine data, zero mock).
 */

export const API_CONFIG = {
  BASE_URL: (typeof window !== 'undefined' && window.__SPIT_BACKEND_URL__) || 
            (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_API_URL) || 
            'http://localhost:8080/api',
  IS_MOCK_MODE: false,
  DEFAULT_LATENCY_MS: 5
};

export const simulateNetworkDelay = (ms = API_CONFIG.DEFAULT_LATENCY_MS) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class ApiError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Generic request wrapper supporting live backend integration
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(errBody.message || errBody.error || `HTTP ${res.status}: ${res.statusText}`, res.status, errBody);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Network connection failed to backend: ${err.message}`, 503);
  }
}
