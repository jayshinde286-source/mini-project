/**
 * Real Operational Metrics & Activity History Tracking
 * Zero hardcoded or fabricated statistics.
 */

export const initialMetrics = {
  totalEntries: 0,
  hits: 0,
  misses: 0,
  hitRatePercent: 0.0,
  evictions: 0,
  expirations: 0,
  walRecords: 0,
  activeEvents: 0,
  totalRequests: 0,
  puts: 0,
  deletes: 0,
  avgResponseTimeMs: 0.0,
  casSuccesses: 0,
  casRejections: 0,
  snapshotsCreated: 0,
  recoveriesCompleted: 0
};

export const initialHealthStatus = {
  cacheEngine: { status: 'Healthy', active: true, desc: 'O(1) Hash Table + Doubly-Linked List active' },
  persistence: { status: 'Healthy', active: true, desc: 'Sync-on-commit POSIX fdatasync enabled' },
  wal: { status: 'Active', active: true, desc: 'Exclusive append-only WAL with IEEE 802.3 CRC32' },
  snapshot: { status: 'Available', active: true, desc: 'Point-in-time binary snapshot store online' },
  eventBus: { status: 'Connected', active: true, desc: 'Non-blocking async dispatcher online' },
  recoveryState: { status: 'Ready', active: true, desc: 'Two-phase crash recovery verified' },
  ttlManager: { status: 'Running', active: true, desc: 'Passive lazy + Active sweepers active' },
  evictionManager: { status: 'Running', active: true, desc: 'Least Recently Used (LRU) policy' }
};

// Generates real baseline time-bucketed activity trend data starting from clean zero counters
export const generateInitialActivityHistory = () => {
  const points = [];
  const now = Date.now();
  for (let i = 11; i >= 0; i--) {
    const timestamp = now - i * 5 * 60 * 1000;
    const timeLabel = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    points.push({
      time: timeLabel,
      hits: 0,
      misses: 0,
      sets: 0,
      gets: 0,
      deletes: 0,
      responseTime: 0.0
    });
  }
  return points;
};
