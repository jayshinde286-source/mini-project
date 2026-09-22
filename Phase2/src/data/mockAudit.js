/**
 * Initial audit logs matching edu.spit.cache.event.AuditLogListener JSON Lines stream
 */

const now = Date.now();

export const initialAuditLogs = [
  {
    logId: 'AUD-901',
    timestamp: now - 3500,
    operation: 'SET',
    key: 'user:1024',
    actor: 'Client API',
    status: 'SUCCESS',
    details: 'Key user:1024 persisted to WAL (seq 2431) and indexed with TTL 60s'
  },
  {
    logId: 'AUD-900',
    timestamp: now - 8000,
    operation: 'GET',
    key: 'session:8842',
    actor: 'Client API',
    status: 'SUCCESS',
    details: 'Cache hit returned in 0.8ms'
  },
  {
    logId: 'AUD-899',
    timestamp: now - 15000,
    operation: 'TTL_EXPIRE',
    key: 'temp:cache:44',
    actor: 'TTL Manager',
    status: 'SUCCESS',
    details: 'Active background cleanup purged expired entry'
  },
  {
    logId: 'AUD-898',
    timestamp: now - 28000,
    operation: 'GET',
    key: 'token:auth:9999',
    actor: 'Client API',
    status: 'MISS',
    details: 'Key not found in primary store'
  },
  {
    logId: 'AUD-897',
    timestamp: now - 65000,
    operation: 'EVICTION',
    key: 'session:443',
    actor: 'Eviction Manager',
    status: 'SUCCESS',
    details: 'LRU eviction triggered when store approached capacity limit'
  },
  {
    logId: 'AUD-896',
    timestamp: now - 92000,
    operation: 'DELETE',
    key: 'temp:session:102',
    actor: 'Client API',
    status: 'SUCCESS',
    details: 'Tombstone record committed to WAL'
  },
  {
    logId: 'AUD-895',
    timestamp: now - 180000,
    operation: 'SNAPSHOT',
    key: 'ALL_KEYS',
    actor: 'System Admin',
    status: 'SUCCESS',
    details: 'Snapshot snapshot_2026_09_23_1041 written (version 42, 128 entries)'
  },
  {
    logId: 'AUD-894',
    timestamp: now - 86400000,
    operation: 'RECOVERY',
    key: 'ALL_KEYS',
    actor: 'Recovery Manager',
    status: 'SUCCESS',
    details: 'Cache restored: 124 snapshot entries + 4 WAL transactions replayed'
  }
];
