/**
 * Realistic initial cache entries for system demonstration
 * Matches edu.spit.cache.core.CacheEntry
 */

const now = Date.now();

export const initialCacheEntries = [
  {
    key: 'user:1001',
    value: 'Jay Shinde (UID 2024800115)',
    version: 1024,
    createdAt: now - 3600000,
    lastAccessed: now - 12000,
    accessCount: 84,
    expiresAt: now + 58000, // 58s remaining
    status: 'ACTIVE'
  },
  {
    key: 'session:4421',
    value: 'auth_jwt_token_b3_cse_spit_valid',
    version: 1018,
    createdAt: now - 7200000,
    lastAccessed: now - 45000,
    accessCount: 142,
    expiresAt: now + 720000, // 12m remaining
    status: 'ACTIVE'
  },
  {
    key: 'product:889',
    value: 'MacBook Pro M3 Max 36GB Unified Memory',
    version: 994,
    createdAt: now - 86400000,
    lastAccessed: now - 300000,
    accessCount: 312,
    expiresAt: now - 10000, // Expired 10s ago
    status: 'EXPIRED'
  },
  {
    key: 'config:database',
    value: 'jdbc:postgresql://localhost:5432/spit_cache_pool?max=30',
    version: 512,
    createdAt: now - 172800000,
    lastAccessed: now - 60000,
    accessCount: 650,
    expiresAt: 0, // Persistent entry
    status: 'ACTIVE'
  },
  {
    key: 'temp:token:44',
    value: 'otp_nonce_928419',
    version: 1042,
    createdAt: now - 180000,
    lastAccessed: now - 15000,
    accessCount: 3,
    expiresAt: now + 25000, // 25s remaining
    status: 'ACTIVE'
  },
  {
    key: 'session:8842',
    value: 'user_state_student_active_session_8842',
    version: 1030,
    createdAt: now - 300000,
    lastAccessed: now - 8000,
    accessCount: 19,
    expiresAt: now + 180000,
    status: 'ACTIVE'
  },
  {
    key: 'user:1002',
    value: 'Nikhil Shelar (UID 2024800113)',
    version: 1035,
    createdAt: now - 1800000,
    lastAccessed: now - 150000,
    accessCount: 42,
    expiresAt: now + 120000,
    status: 'ACTIVE'
  },
  {
    key: 'user:1003',
    value: 'Sanchit Gaikwad (UID 2024800029)',
    version: 1038,
    createdAt: now - 1200000,
    lastAccessed: now - 80000,
    accessCount: 51,
    expiresAt: now + 90000,
    status: 'ACTIVE'
  },
  {
    key: 'system:guide',
    value: 'Prof. Suhas Kakade (SPIT CSE)',
    version: 100,
    createdAt: now - 259200000,
    lastAccessed: now - 10000,
    accessCount: 920,
    expiresAt: 0, // Persistent
    status: 'ACTIVE'
  }
];

export const initialEvictionStats = {
  capacity: 1000,
  currentUsage: 128,
  policy: 'LRU',
  evictionsCount: 24,
  lastEvictedKey: 'session:443',
  lastEvictedReason: 'Capacity Limit (LRU head)',
  lastEvictedTimestamp: now - 240000
};
