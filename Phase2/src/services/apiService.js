/**
 * Base API Client Service
 * Configured for seamless switch between simulated demo mode and actual Java REST/HTTP endpoint
 */

export const API_CONFIG = {
  // In Phase III, set this to the backend server URL (e.g., http://localhost:8080/api)
  BASE_URL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_API_URL) || '',
  IS_MOCK_MODE: true, // Controlled via environment or state
  DEFAULT_LATENCY_MS: 30
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
 * Generic request wrapper supporting future backend integration
 */
export async function apiRequest(endpoint, options = {}) {
  if (API_CONFIG.IS_MOCK_MODE) {
    await simulateNetworkDelay();
    return null;
  }

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
      throw new ApiError(errBody.message || `HTTP ${res.status}: ${res.statusText}`, res.status, errBody);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Network connection failed to Java engine: ${err.message}`, 503);
  }
}
