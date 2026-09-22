/**
 * Initial metrics matching edu.spit.cache.metrics.CacheMetrics & MetricsSnapshot
 */

export const initialMetrics = {
  totalEntries: 128,
  hits: 1842,
  misses: 326,
  hitRatePercent: 85.0,
  evictions: 24,
  expirations: 17,
  walRecords: 2431,
  activeEvents: 6,
  totalRequests: 2168,
  puts: 1420,
  deletes: 212,
  avgResponseTimeMs: 1.8,
  casSuccesses: 45,
  casRejections: 2,
  snapshotsCreated: 42,
  recoveriesCompleted: 1
};

export const initialHealthStatus = {
  cacheEngine: { status: 'Healthy', active: true, desc: 'Primary ConcurrentHashMap active' },
  persistence: { status: 'Healthy', active: true, desc: 'Sync-on-commit flush mode enabled' },
  wal: { status: 'Active', active: true, desc: 'Exclusive WAL owner channel open' },
  snapshot: { status: 'Available', active: true, desc: 'Version 42 valid with CRC32 pass' },
  eventBus: { status: 'Connected', active: true, desc: 'Non-blocking async dispatcher online' },
  recoveryState: { status: 'Ready', active: true, desc: 'Snapshot + WAL replay verified' },
  ttlManager: { status: 'Running', active: true, desc: 'Active cleanup thread 1000ms tick' },
  evictionManager: { status: 'Running', active: true, desc: 'LRU linked doubly list consistent' }
};

// 60-minute time-bucketed activity trend data for charts
export const generateInitialActivityHistory = () => {
  const points = [];
  const now = Date.now();
  for (let i = 11; i >= 0; i--) {
    const timestamp = now - i * 5 * 60 * 1000;
    const timeLabel = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    points.push({
      time: timeLabel,
      hits: Math.floor(130 + Math.random() * 40),
      misses: Math.floor(20 + Math.random() * 15),
      sets: Math.floor(40 + Math.random() * 25),
      gets: Math.floor(150 + Math.random() * 50),
      deletes: Math.floor(5 + Math.random() * 8),
      responseTime: Number((1.5 + Math.random() * 0.6).toFixed(2))
    });
  }
  return points;
};
