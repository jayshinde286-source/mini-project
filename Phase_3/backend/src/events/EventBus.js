/**
 * EventBus
 * Decoupled event publication and subscription pipeline.
 */
import { EventEmitter } from 'events';

export const EventType = {
  CACHE_HIT: 'CACHE_HIT',
  CACHE_MISS: 'CACHE_MISS',
  CACHE_PUT: 'CACHE_PUT',
  CACHE_UPDATE: 'CACHE_UPDATE',
  CACHE_DELETE: 'CACHE_DELETE',
  CACHE_EVICTED: 'CACHE_EVICTED',
  TTL_EXPIRED: 'TTL_EXPIRED',
  WAL_APPENDED: 'WAL_APPENDED',
  SNAPSHOT_CREATED: 'SNAPSHOT_CREATED',
  RECOVERY_COMPLETED: 'RECOVERY_COMPLETED'
};

export class EventBus {
  constructor(maxHistory = 200) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
    this.history = [];
    this.maxHistory = maxHistory;
    this.eventIdSequence = 0;
  }

  publish(type, data = {}) {
    this.eventIdSequence++;
    const event = {
      id: `EVT-${Date.now()}-${this.eventIdSequence}`,
      type,
      timestamp: Date.now(),
      data
    };

    // Store in circular history buffer
    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Non-blocking asynchronous dispatch
    setImmediate(() => {
      this.emitter.emit(type, event);
      this.emitter.emit('*', event);
    });

    return event;
  }

  subscribe(type, listener) {
    this.emitter.on(type, listener);
    return () => this.emitter.off(type, listener);
  }

  getRecentEvents(limit = 50, filterType = null) {
    let list = this.history;
    if (filterType && filterType !== 'ALL') {
      list = list.filter(e => e.type === filterType);
    }
    return list.slice(0, limit);
  }

  clearHistory() {
    this.history = [];
  }
}
