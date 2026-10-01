/**
 * Zero-Hardcoded Real Data Baseline
 * Cache starts completely empty and populates exclusively from live backend storage
 * (WAL records and Snapshot files).
 */

export const initialCacheEntries = [];

export const initialEvictionStats = {
  capacity: 50,
  currentUsage: 0,
  policy: 'LRU',
  evictionsCount: 0,
  lastEvictedKey: 'None',
  lastEvictedReason: 'None',
  lastEvictedTimestamp: 0
};
