/**
 * Metrics Service Layer
 * Interfaces with CacheMetrics (edu.spit.cache.metrics.CacheMetrics)
 */

import { apiRequest, API_CONFIG } from './apiService.js';

export const metricsService = {
  async getMetrics() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/metrics');
    }
    return null;
  },

  async getHealthStatus() {
    if (!API_CONFIG.IS_MOCK_MODE) {
      return await apiRequest('/health');
    }
    return null;
  }
};
