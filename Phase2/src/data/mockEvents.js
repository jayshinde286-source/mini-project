/**
 * Realistic initial events matching edu.spit.cache.event.CacheEvent
 */

const now = Date.now();

export const initialEvents = [
  {
    eventId: 1045,
    timestamp: now - 2000,
    type: 'CACHE_SET',
    key: 'user:1024',
    source: 'Cache Engine',
    transactionId: 'TXN-001024',
    status: 'SUCCESS',
    detail: 'Key user:1024 inserted with TTL 60000ms'
  },
  {
    eventId: 1044,
    timestamp: now - 8000,
    type: 'CACHE_HIT',
    key: 'session:8842',
    source: 'Cache Engine',
    transactionId: '',
    status: 'SUCCESS',
    detail: 'Lookup hit for session:8842 (version 1030)'
  },
  {
    eventId: 1043,
    timestamp: now - 15000,
    type: 'TTL_EXPIRED',
    key: 'temp:cache:44',
    source: 'TTL Manager',
    transactionId: '',
    status: 'EXPIRED',
    detail: 'Entry reached TTL expiration epoch'
  },
  {
    eventId: 1042,
    timestamp: now - 28000,
    type: 'CACHE_MISS',
    key: 'token:auth:9999',
    source: 'Cache Engine',
    transactionId: '',
    status: 'MISS',
    detail: 'Lookup missed: key not found in primary hashmap'
  },
  {
    eventId: 1041,
    timestamp: now - 42000,
    type: 'CACHE_HIT',
    key: 'user:1001',
    source: 'Cache Engine',
    transactionId: '',
    status: 'SUCCESS',
    detail: 'Lookup hit for user:1001'
  },
  {
    eventId: 1040,
    timestamp: now - 65000,
    type: 'CACHE_EVICTED',
    key: 'session:443',
    source: 'Eviction Manager',
    transactionId: '',
    status: 'EVICTED',
    detail: 'LRU eviction triggered by capacity check'
  },
  {
    eventId: 1039,
    timestamp: now - 92000,
    type: 'CACHE_DELETE',
    key: 'temp:session:102',
    source: 'Cache Engine',
    transactionId: 'TXN-001019',
    status: 'SUCCESS',
    detail: 'Entry deleted and marked tombstone in WAL'
  },
  {
    eventId: 1038,
    timestamp: now - 180000,
    type: 'SNAPSHOT_CREATED',
    key: 'ALL_KEYS',
    source: 'Snapshot Manager',
    transactionId: 'SNAP-0042',
    status: 'SUCCESS',
    detail: 'Snapshot version 42 persisted with 128 active entries'
  }
];
