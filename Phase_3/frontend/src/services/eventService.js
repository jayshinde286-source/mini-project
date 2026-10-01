/**
 * Event Bus Service Layer
 * Interfaces with the cache module's EventBus (edu.spit.cache.event.EventBus)
 */

import { apiRequest, API_CONFIG } from './apiService.js';

export const eventService = {
  async getEvents(typeFilter = 'ALL') {
    if (!API_CONFIG.IS_MOCK_MODE) {
      const q = typeFilter !== 'ALL' ? `?type=${encodeURIComponent(typeFilter)}` : '';
      return await apiRequest(`/events${q}`);
    }
    return null;
  },

  createEvent(type, key, detail, transactionId = '', source = 'Cache Engine', status = 'SUCCESS') {
    return {
      eventId: Date.now() + Math.floor(Math.random() * 100),
      timestamp: Date.now(),
      type,
      key,
      source,
      transactionId,
      status,
      detail
    };
  }
};
