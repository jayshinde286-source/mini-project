import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { initialCacheEntries, initialEvictionStats } from '../data/mockCacheData';
import { initialEvents } from '../data/mockEvents';
import { initialMetrics, initialHealthStatus, generateInitialActivityHistory } from '../data/mockMetrics';
import { initialPersistenceOverview, initialWalRecords, initialSnapshot, initialRecoveryStatus, createRealWalRecord } from '../data/mockPersistence';
import { initialAuditLogs } from '../data/mockAudit';
import { cacheService } from '../services/cacheService';
import { persistenceService } from '../services/persistenceService';
import { eventService } from '../services/eventService';
import { recoveryService } from '../services/recoveryService';
import { crc32Hex } from '../utils/checksum';

const CacheContext = createContext(null);

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

const BACKEND_URL = (typeof window !== 'undefined' && window.__SPIT_BACKEND_URL__) || 'http://localhost:8080';

export const CacheProvider = ({ children }) => {
  const [cacheEntries, setCacheEntries] = useState(initialCacheEntries);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [events, setEvents] = useState(initialEvents);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [walRecords, setWalRecords] = useState(initialWalRecords);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [persistenceOverview, setPersistenceOverview] = useState(initialPersistenceOverview);
  const [recoveryStatus, setRecoveryStatus] = useState(initialRecoveryStatus);
  const [recoveryStep, setRecoveryStep] = useState(null);
  const [evictionStats, setEvictionStats] = useState(initialEvictionStats);
  const [healthStatus, setHealthStatus] = useState(initialHealthStatus);
  const [activityHistory, setActivityHistory] = useState(generateInitialActivityHistory);
  const [liveSimulation, setLiveSimulation] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [startTime] = useState(Date.now());
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendMeta, setBackendMeta] = useState(null);

  // Modern Theme State (Dark / Light)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('spit_cache_theme');
    if (saved === 'black') return 'dark';
    if (saved === 'white') return 'light';
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('spit_cache_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    addToast(
      'Theme Updated',
      `Switched to ${nextTheme === 'dark' ? 'Modern Obsidian Dark' : 'Clean Slate Light'} mode.`,
      'info'
    );
  };

  const nextWalSequence = useRef(1);
  const nextEventId = useRef(1);
  const nextAuditId = useRef(1);

  // Toast Helper
  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Check Backend Connectivity on Mount and Sync Real Data
  const checkBackendSync = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const healthRes = await fetch(`${BACKEND_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setIsBackendConnected(true);
        setBackendMeta(healthData);

        // Fetch Live Metrics
        const metricsRes = await fetch(`${BACKEND_URL}/api/metrics`);
        if (metricsRes.ok) {
          const m = await metricsRes.json();
          setMetrics({
            totalEntries: m.activeEntries || 0,
            hits: m.hits || 0,
            misses: m.misses || 0,
            hitRatePercent: m.hitRatePercentage || 0.0,
            evictions: m.evictions || 0,
            expirations: m.expirations || 0,
            walRecords: m.wal?.recordCount || 0,
            activeEvents: m.activeEntries || 0,
            totalRequests: m.totalRequests || 0,
            puts: m.puts || 0,
            deletes: m.deletes || 0,
            avgResponseTimeMs: m.latency ? Number((m.latency.avgUs / 1000).toFixed(2)) : 0.0,
            casSuccesses: 0,
            casRejections: 0,
            snapshotsCreated: m.snapshot?.exists ? 1 : 0,
            recoveriesCompleted: 0
          });

          // Live Eviction & Capacity telemetry
          setEvictionStats((prev) => ({
            ...prev,
            capacity: m.capacity || 50,
            currentUsage: m.activeEntries || 0,
            evictionsCount: m.evictions || 0,
            lastEvictedKey: m.evictions > 0 ? (m.lastEvictedKey || prev.lastEvictedKey || 'None') : 'None',
            lastEvictedReason: m.evictions > 0 ? 'LRU Capacity Threshold Exceeded' : 'None'
          }));

          if (m.wal) {
            setPersistenceOverview((prev) => ({
              ...prev,
              walRecordsCount: m.wal.recordCount,
              currentLsn: m.wal.currentLsn,
              fileSizeBytes: m.wal.fileSizeBytes
            }));
          }

          if (m.snapshot && m.snapshot.exists) {
            setSnapshot({
              id: `snapshot_checkpoint_${m.snapshot.checkpointLsn}`,
              version: m.snapshot.checkpointLsn,
              entriesCount: m.snapshot.entryCount,
              createdAt: m.snapshot.timestamp,
              checksum: m.snapshot.checksum,
              status: 'VALID',
              sizeBytes: `${(m.snapshot.fileSizeBytes / 1024).toFixed(1)} KB`
            });
          }
        }

        // Fetch Live Cache Entries
        const cacheRes = await fetch(`${BACKEND_URL}/api/cache`);
        if (cacheRes.ok) {
          const cData = await cacheRes.json();
          if (Array.isArray(cData.entries)) {
            setCacheEntries(cData.entries.map((e) => ({
              key: e.key,
              value: typeof e.value === 'object' ? JSON.stringify(e.value) : String(e.value),
              version: 1,
              createdAt: e.createdAt,
              lastAccessed: e.lastAccessed || e.createdAt,
              accessCount: e.accessCount || 1,
              expiresAt: e.expiresAt || 0,
              status: e.expiresAt > 0 && Date.now() > e.expiresAt ? 'EXPIRED' : 'ACTIVE'
            })));
          }
        }

        // Fetch Live WAL
        const walRes = await fetch(`${BACKEND_URL}/api/wal`);
        if (walRes.ok) {
          const wData = await walRes.json();
          if (Array.isArray(wData.records)) {
            setWalRecords(wData.records.map((r) => ({
              sequence: r.lsn,
              timestamp: r.timestamp,
              transactionId: `TXN-${String(r.lsn).padStart(6, '0')}`,
              operation: r.opcode,
              key: r.key,
              value: typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value || ''),
              expiresAt: r.ttlSeconds > 0 ? r.timestamp + r.ttlSeconds * 1000 : 0,
              checksum: '0x' + (r.checksum || '00000000'),
              status: 'VALID'
            })).reverse());
          }
        }

        // Fetch Live Audit Logs
        const auditRes = await fetch(`${BACKEND_URL}/api/audit`);
        if (auditRes.ok) {
          const aData = await auditRes.json();
          if (Array.isArray(aData.logs)) {
            setAuditLogs(aData.logs.map((a) => ({
              logId: `AUD-${a.sequence}`,
              timestamp: new Date(a.timestamp).getTime(),
              operation: a.action,
              key: a.target,
              actor: a.actor,
              status: 'SUCCESS',
              details: `Hash: ${a.hash ? a.hash.slice(0, 16) + '...' : 'Verified'}`
            })));
          }
        }

        // Fetch Live Events
        const eventsRes = await fetch(`${BACKEND_URL}/api/events?limit=50`);
        if (eventsRes.ok) {
          const eData = await eventsRes.json();
          if (Array.isArray(eData.events)) {
            setEvents(eData.events.map((ev) => ({
              eventId: ev.id,
              timestamp: ev.timestamp,
              type: ev.type,
              key: ev.data?.key || ev.data?.target || 'SYSTEM',
              source: 'Cache Engine',
              transactionId: ev.data?.lsn ? `TXN-${String(ev.data.lsn).padStart(6, '0')}` : '',
              status: 'SUCCESS',
              detail: typeof ev.data === 'object' ? JSON.stringify(ev.data) : String(ev.data || '')
            })));
          }
        }
      } else {
        setIsBackendConnected(false);
      }
    } catch (e) {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    checkBackendSync();
    const interval = setInterval(checkBackendSync, 5000); // Live sync every 5s
    return () => clearInterval(interval);
  }, [checkBackendSync]);

  // Real-Time Server-Sent Events (SSE) Listener for Zero Latency Push Updates
  useEffect(() => {
    if (!isBackendConnected) return;
    let eventSource;
    try {
      eventSource = new EventSource(`${BACKEND_URL}/api/events/stream`);
      eventSource.onmessage = (event) => {
        try {
          const ev = JSON.parse(event.data);
          if (ev && ev.type) {
            const formatted = {
              eventId: ev.id || `EVT-${Date.now()}`,
              timestamp: ev.timestamp || Date.now(),
              type: ev.type,
              key: ev.data?.key || ev.data?.target || 'SYSTEM',
              source: 'Cache Engine',
              transactionId: ev.data?.lsn ? `TXN-${String(ev.data.lsn).padStart(6, '0')}` : '',
              status: 'SUCCESS',
              detail: typeof ev.data === 'object' ? JSON.stringify(ev.data) : String(ev.data || '')
            };
            setEvents((prev) => [formatted, ...prev.filter(x => x.eventId !== formatted.eventId)].slice(0, 100));
            // Trigger instant synchronization of metrics and cache entries
            checkBackendSync();
          }
        } catch (err) {}
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
      };
    } catch (e) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isBackendConnected, checkBackendSync]);

  // Live timer for TTL countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCacheEntries((prev) =>
        prev.map((entry) => {
          if (entry.expiresAt > 0 && Date.now() >= entry.expiresAt && entry.status === 'ACTIVE') {
            return { ...entry, status: 'EXPIRED' };
          }
          return entry;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SET Cache Entry Operation
  const setEntry = async (key, value, ttl = 0, unit = 'seconds') => {
    try {
      const ttlSec = unit === 'minutes' ? Number(ttl) * 60 : (unit === 'hours' ? Number(ttl) * 3600 : Number(ttl));
      const now = Date.now();

      // If live backend connected, forward request directly
      if (isBackendConnected) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/cache`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value, ttlSeconds: ttlSec })
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.message || errJson.error || 'Backend PUT rejected');
          }
          await checkBackendSync();
          addToast('Cache Set Success', `Key '${key}' committed to WAL & memory store.`, 'success');
          return { success: true };
        } catch (backendErr) {
          console.warn('Backend PUT failed, falling back to local engine:', backendErr.message);
        }
      }

      // Local In-Browser Reactive Engine
      const result = await cacheService.set(key, value, ttl, unit);
      const seq = nextWalSequence.current++;
      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;
      const txnId = `TXN-${String(seq).padStart(6, '0')}`;

      setCacheEntries((prev) => {
        const existingIdx = prev.findIndex((e) => e.key === result.key);
        const newEntry = {
          key: result.key,
          value: result.value,
          version: seq,
          createdAt: existingIdx >= 0 ? prev[existingIdx].createdAt : now,
          lastAccessed: now,
          accessCount: existingIdx >= 0 ? prev[existingIdx].accessCount + 1 : 1,
          expiresAt: result.expiresAt,
          status: 'ACTIVE'
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newEntry;
          return updated;
        } else {
          return [newEntry, ...prev];
        }
      });

      const newWal = persistenceService.createWalRecord(seq, 'SET', result.key, result.value, result.expiresAt, txnId);
      setWalRecords((prev) => [newWal, ...prev]);

      const newEvent = eventService.createEvent(
        'CACHE_SET',
        result.key,
        `Key ${result.key} stored with TTL ${result.ttlMs}ms (version ${seq})`,
        txnId,
        'Cache Engine',
        'SUCCESS'
      );
      newEvent.eventId = evId;
      setEvents((prev) => [newEvent, ...prev]);

      const auditEntry = {
        logId: `AUD-${audId}`,
        timestamp: now,
        operation: 'SET',
        key: result.key,
        actor: 'Client API',
        status: 'SUCCESS',
        details: `Key ${result.key} committed to WAL (seq ${seq}) with TTL ${result.ttlMs}ms`
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      setMetrics((prev) => {
        const newPuts = prev.puts + 1;
        const newTotalReqs = prev.totalRequests + 1;
        const newTotalEntries = prev.totalEntries + 1;
        return {
          ...prev,
          puts: newPuts,
          totalRequests: newTotalReqs,
          totalEntries: newTotalEntries,
          walRecords: prev.walRecords + 1
        };
      });

      setEvictionStats((prev) => ({
        ...prev,
        currentUsage: prev.currentUsage + 1
      }));

      updateActivityTrend('SET');
      addToast('Cache Set Success', `Key '${result.key}' persisted & cached.`, 'success');
      return { success: true, entry: result };
    } catch (err) {
      addToast('Operation Failed', err.message, 'error');
      throw err;
    }
  };

  // GET Cache Entry Operation
  const getEntry = async (key) => {
    try {
      const validKey = key?.trim();
      if (!validKey) throw new Error('Key cannot be empty');
      const now = Date.now();

      // If backend connected, perform real HTTP lookup
      if (isBackendConnected) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/cache/${encodeURIComponent(validKey)}`);
          if (res.ok) {
            const data = await res.json();
            await checkBackendSync();
            addToast('Cache Hit', `Found '${validKey}' in memory store.`, 'success');
            return { hit: true, entry: { key: data.key, value: data.value } };
          } else {
            await checkBackendSync();
            addToast('Cache Miss', `Key '${validKey}' not found or expired.`, 'warning');
            return { hit: false };
          }
        } catch (e) {
          console.warn('Backend GET failed, falling back to local engine');
        }
      }

      // Local engine lookup
      const existing = cacheEntries.find((e) => e.key === validKey);
      const isExpired = existing && existing.expiresAt > 0 && now >= existing.expiresAt;
      const isHit = existing && !isExpired && existing.status === 'ACTIVE';

      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;

      if (isHit) {
        setCacheEntries((prev) =>
          prev.map((e) =>
            e.key === validKey
              ? { ...e, lastAccessed: now, accessCount: e.accessCount + 1 }
              : e
          )
        );

        const newEvent = eventService.createEvent(
          'CACHE_HIT',
          validKey,
          `Lookup hit for ${validKey} (version ${existing.version})`,
          '',
          'Cache Engine',
          'SUCCESS'
        );
        newEvent.eventId = evId;
        setEvents((prev) => [newEvent, ...prev]);

        setAuditLogs((prev) => [
          {
            logId: `AUD-${audId}`,
            timestamp: now,
            operation: 'GET',
            key: validKey,
            actor: 'Client API',
            status: 'SUCCESS',
            details: `Cache hit for ${validKey} (accessCount: ${existing.accessCount + 1})`
          },
          ...prev
        ]);

        setMetrics((prev) => {
          const newHits = prev.hits + 1;
          const totalHitsMisses = newHits + prev.misses;
          const hitRate = (newHits / totalHitsMisses) * 100;
          return {
            ...prev,
            hits: newHits,
            totalRequests: prev.totalRequests + 1,
            hitRatePercent: Number(hitRate.toFixed(1))
          };
        });

        updateActivityTrend('HIT');
        addToast('Cache Hit', `Found '${validKey}' in memory store.`, 'success');
        return { hit: true, entry: existing };
      } else {
        const newEvent = eventService.createEvent(
          'CACHE_MISS',
          validKey,
          isExpired ? `Key ${validKey} expired prior to read` : `Key ${validKey} not found in index`,
          '',
          'Cache Engine',
          'WARNING'
        );
        newEvent.eventId = evId;
        setEvents((prev) => [newEvent, ...prev]);

        setAuditLogs((prev) => [
          {
            logId: `AUD-${audId}`,
            timestamp: now,
            operation: 'GET',
            key: validKey,
            actor: 'Client API',
            status: 'FAILED',
            details: `Cache miss: ${isExpired ? 'expired TTL' : 'non-existent key'}`
          },
          ...prev
        ]);

        setMetrics((prev) => {
          const newMisses = prev.misses + 1;
          const totalHitsMisses = prev.hits + newMisses;
          const hitRate = totalHitsMisses > 0 ? (prev.hits / totalHitsMisses) * 100 : 0.0;
          return {
            ...prev,
            misses: newMisses,
            totalRequests: prev.totalRequests + 1,
            hitRatePercent: Number(hitRate.toFixed(1))
          };
        });

        updateActivityTrend('MISS');
        addToast('Cache Miss', `Key '${validKey}' not found or expired.`, 'warning');
        return { hit: false };
      }
    } catch (err) {
      addToast('Lookup Failed', err.message, 'error');
      throw err;
    }
  };

  // DELETE Cache Entry Operation
  const deleteEntry = async (key) => {
    try {
      const now = Date.now();

      if (isBackendConnected) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/cache/${encodeURIComponent(key)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            await checkBackendSync();
            addToast('Entry Deleted', `Key '${key}' removed from backend cache.`, 'info');
            return { success: true };
          }
        } catch (e) {
          console.warn('Backend DELETE failed, using local');
        }
      }

      const seq = nextWalSequence.current++;
      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;
      const txnId = `TXN-${String(seq).padStart(6, '0')}`;

      setCacheEntries((prev) => prev.filter((e) => e.key !== key));

      const newWal = persistenceService.createWalRecord(seq, 'DELETE', key, '', 0, txnId);
      setWalRecords((prev) => [newWal, ...prev]);

      const newEvent = eventService.createEvent(
        'CACHE_DELETE',
        key,
        `Explicit eviction/delete requested for key ${key}`,
        txnId,
        'Cache Engine',
        'SUCCESS'
      );
      newEvent.eventId = evId;
      setEvents((prev) => [newEvent, ...prev]);

      setAuditLogs((prev) => [
        {
          logId: `AUD-${audId}`,
          timestamp: now,
          operation: 'DELETE',
          key,
          actor: 'Client API',
          status: 'SUCCESS',
          details: `Tombstone marker logged in WAL for key ${key}`
        },
        ...prev
      ]);

      setMetrics((prev) => ({
        ...prev,
        deletes: prev.deletes + 1,
        totalRequests: prev.totalRequests + 1,
        totalEntries: Math.max(0, prev.totalEntries - 1),
        walRecords: prev.walRecords + 1
      }));

      setEvictionStats((prev) => ({
        ...prev,
        currentUsage: Math.max(0, prev.currentUsage - 1)
      }));

      updateActivityTrend('DELETE');
      addToast('Entry Deleted', `Key '${key}' removed from cache & tombstone logged.`, 'info');
      return { success: true };
    } catch (err) {
      addToast('Delete Failed', err.message, 'error');
      throw err;
    }
  };

  // Simulate TTL Expiry with Real Backend Integration
  const simulateTTLExpiry = async () => {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/demo/run-scenario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: 'ttl' })
        });
        if (res.ok) {
          await checkBackendSync();
          addToast('TTL Expiry Triggered', 'Inserted 5 keys with 3-second TTL for active sweep validation.', 'warning');
          return;
        }
      } catch (backendErr) {
        console.warn('Backend TTL scenario failed, using local fallback:', backendErr.message);
      }
    }

    const activeEntry = cacheEntries.find((e) => e.status === 'ACTIVE' && e.expiresAt > 0);
    const keyToExpire = activeEntry ? activeEntry.key : (cacheEntries[0]?.key || 'session:test');
    const now = Date.now();
    const evId = nextEventId.current++;
    const audId = nextAuditId.current++;

    setCacheEntries((prev) =>
      prev.map((e) => (e.key === keyToExpire ? { ...e, status: 'EXPIRED' } : e))
    );

    const newEvent = eventService.createEvent(
      'TTL_EXPIRED',
      keyToExpire,
      `TTL timestamp reached; entry ${keyToExpire} purged by background reaper`,
      '',
      'TTL Manager',
      'EXPIRED'
    );
    newEvent.eventId = evId;
    setEvents((prev) => [newEvent, ...prev]);

    setAuditLogs((prev) => [
      {
        logId: `AUD-${audId}`,
        timestamp: now,
        operation: 'TTL_EXPIRE',
        key: keyToExpire,
        actor: 'TTL Manager',
        status: 'SUCCESS',
        details: `Active eviction of expired key ${keyToExpire}`
      },
      ...prev
    ]);

    setMetrics((prev) => ({
      ...prev,
      expirations: prev.expirations + 1
    }));

    addToast('TTL Expiry Triggered', `Entry '${keyToExpire}' marked EXPIRED.`, 'warning');
  };

  // Simulate LRU Eviction with Real Backend Integration
  const simulateEviction = async () => {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/demo/run-scenario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: 'lru' })
        });
        if (res.ok) {
          await checkBackendSync();
          addToast('LRU Eviction Triggered', 'Inserted 55 keys to exceed capacity and trigger real LRU evictions.', 'warning');
          return;
        }
      } catch (backendErr) {
        console.warn('Backend LRU scenario failed, using local fallback:', backendErr.message);
      }
    }

    const activeEntries = cacheEntries.filter((e) => e.status === 'ACTIVE');
    if (activeEntries.length === 0) {
      addToast('Eviction Skipped', 'No active entries available to evict.', 'info');
      return;
    }

    const victim = [...activeEntries].sort((a, b) => a.lastAccessed - b.lastAccessed)[0];
    const now = Date.now();
    const evId = nextEventId.current++;
    const audId = nextAuditId.current++;

    setCacheEntries((prev) =>
      prev.map((e) => (e.key === victim.key ? { ...e, status: 'EVICTED' } : e))
    );

    const newEvent = eventService.createEvent(
      'CACHE_EVICTED',
      victim.key,
      `Evicted from LRU cache head due to capacity threshold`,
      '',
      'Eviction Manager',
      'EVICTED'
    );
    newEvent.eventId = evId;
    setEvents((prev) => [newEvent, ...prev]);

    setAuditLogs((prev) => [
      {
        logId: `AUD-${audId}`,
        timestamp: now,
        operation: 'EVICTION',
        key: victim.key,
        actor: 'Eviction Manager',
        status: 'SUCCESS',
        details: `LRU eviction of ${victim.key} to preserve capacity`
      },
      ...prev
    ]);

    setEvictionStats((prev) => ({
      ...prev,
      evictionsCount: prev.evictionsCount + 1,
      lastEvictedKey: victim.key,
      lastEvictedReason: 'LRU Capacity Threshold',
      lastEvictedTimestamp: now,
      currentUsage: Math.max(0, prev.currentUsage - 1)
    }));

    setMetrics((prev) => ({
      ...prev,
      evictions: prev.evictions + 1,
      totalEntries: Math.max(0, prev.totalEntries - 1)
    }));

    addToast('Cache Eviction', `Key '${victim.key}' evicted by LRU manager.`, 'warning');
  };

  // Clear All Entries with Real Backend Integration
  const clearEntries = async () => {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cache/clear`, { method: 'POST' });
        if (res.ok) {
          await checkBackendSync();
          addToast('Cache Flushed', 'All in-memory cache entries cleared in backend.', 'info');
          return { success: true };
        }
      } catch (e) {
        console.warn('Backend clear failed:', e.message);
      }
    }
    setCacheEntries([]);
    addToast('Cache Flushed', 'In-memory entries cleared.', 'info');
    return { success: true };
  };

  // Simulate Dirty Crash (Volatile Heap Purge)
  const simulateCrash = async () => {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/recovery/crash-simulate`, { method: 'POST' });
        if (res.ok) {
          await checkBackendSync();
          addToast('Dirty Crash Simulated', 'Volatile heap memory purged. Persistent WAL & snapshot files remain intact!', 'warning');
          return { success: true };
        }
      } catch (e) {
        console.warn('Backend crash simulate failed:', e.message);
      }
    }
    setCacheEntries([]);
    addToast('Dirty Crash Simulated', 'Memory state purged.', 'warning');
    return { success: true };
  };

  // Trigger Point-in-time Snapshot
  const simulateSnapshot = async () => {
    const now = Date.now();

    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/wal/snapshot`, { method: 'POST' });
        if (res.ok) {
          const snapData = await res.json();
          await checkBackendSync();
          addToast('Snapshot Created', `Point-in-time snapshot LSN ${snapData.checkpointLsn} created on disk.`, 'success');
          return;
        }
      } catch (e) {
        console.warn('Backend snapshot failed, using local');
      }
    }

    const evId = nextEventId.current++;
    const audId = nextAuditId.current++;
    const newVersion = snapshot.version + 1;
    const snapId = `snapshot_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(newVersion).padStart(4, '0')}`;
    const activeItems = cacheEntries.filter((e) => e.status === 'ACTIVE');
    const serialized = JSON.stringify(activeItems);
    const checksum = '0x' + crc32Hex(serialized);
    const byteSize = (new Blob([serialized]).size / 1024).toFixed(1);

    const newSnap = {
      id: snapId,
      version: newVersion,
      entriesCount: activeItems.length,
      createdAt: now,
      checksum,
      status: 'VALID',
      sizeBytes: `${byteSize} KB`
    };

    setSnapshot(newSnap);
    setPersistenceOverview((prev) => ({
      ...prev,
      lastSnapshotTime: now,
      pendingWrites: 0
    }));

    const newEvent = eventService.createEvent(
      'SNAPSHOT_CREATED',
      'ALL_KEYS',
      `Snapshot version ${newVersion} created with ${newSnap.entriesCount} entries`,
      `SNAP-00${newVersion}`,
      'Snapshot Manager',
      'SUCCESS'
    );
    newEvent.eventId = evId;
    setEvents((prev) => [newEvent, ...prev]);

    setAuditLogs((prev) => [
      {
        logId: `AUD-${audId}`,
        timestamp: now,
        operation: 'SNAPSHOT',
        key: 'ALL_KEYS',
        actor: 'System Admin',
        status: 'SUCCESS',
        details: `Snapshot ${snapId} written successfully with CRC32 ${checksum}`
      },
      ...prev
    ]);

    setMetrics((prev) => ({
      ...prev,
      snapshotsCreated: prev.snapshotsCreated + 1
    }));

    addToast('Snapshot Created', `Version ${newVersion} saved with ${newSnap.entriesCount} entries.`, 'success');
  };

  // Run 7-Step Recovery Workflow
  const startRecovery = async () => {
    setRecoveryStatus((prev) => ({ ...prev, status: 'RECOVERING' }));
    addToast('Recovery Started', 'Executing 7-step replay & verification pipeline...', 'info');

    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/recovery/execute`, { method: 'POST' });
        if (res.ok) {
          const recSummary = await res.json();
          await checkBackendSync();
          setRecoveryStatus({
            status: 'READY',
            lastRecoveryTimestamp: Date.now(),
            latestSnapshotStatus: recSummary.snapshotFound ? 'VALID' : 'NONE',
            walIntegrityStatus: 'VALID',
            recoverableEntries: recSummary.restoredFromSnapshotCount + recSummary.replayedFromWalCount,
            report: {
              snapshotEntriesRestored: recSummary.restoredFromSnapshotCount,
              walOperationsApplied: recSummary.replayedFromWalCount,
              incompleteTransactionOperationsSkipped: 0,
              rejectedTransactionBatches: 0,
              legacyTransactionBatchesAccepted: 0,
              expiredEntriesSkipped: recSummary.expiredSkippedCount || 0,
              malformedWalRecords: 0,
              checksumFailures: 0,
              snapshotSequence: recSummary.snapshotCheckpointLsn || 0,
              finalWalSequence: recSummary.lastRecoveredLsn || 0,
              totalEntriesMaterialized: recSummary.restoredFromSnapshotCount + recSummary.replayedFromWalCount
            }
          });
          setRecoveryStep({ step: 7, name: 'Recovery Complete', detail: `Restored ${recSummary.restoredFromSnapshotCount + recSummary.replayedFromWalCount} keys in ${recSummary.elapsedMs}ms` });
          addToast('Recovery Complete', `Restored ${recSummary.restoredFromSnapshotCount + recSummary.replayedFromWalCount} keys cleanly from disk!`, 'success');
          return;
        }
      } catch (e) {
        console.warn('Backend recovery execution failed, using local');
      }
    }

    try {
      const result = await recoveryService.startRecovery((stepInfo) => {
        setRecoveryStep(stepInfo);
      });

      const now = Date.now();
      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;

      setRecoveryStatus({
        status: 'READY',
        lastRecoveryTimestamp: now,
        latestSnapshotStatus: 'VALID',
        walIntegrityStatus: 'VALID',
        recoverableEntries: result.report.totalEntriesMaterialized,
        report: result.report
      });

      setRecoveryStep({ step: 7, name: 'Recovery Complete', detail: 'All 7 verification steps completed successfully!' });

      const newEvent = eventService.createEvent(
        'RECOVERY_COMPLETED',
        'ALL_KEYS',
        `Recovery completed: ${result.report.snapshotEntriesRestored} snapshot entries + ${result.report.walOperationsApplied} WAL replays`,
        'REC-SUCCESS',
        'Recovery Manager',
        'SUCCESS'
      );
      newEvent.eventId = evId;
      setEvents((prev) => [newEvent, ...prev]);

      setAuditLogs((prev) => [
        {
          logId: `AUD-${audId}`,
          timestamp: now,
          operation: 'RECOVERY',
          key: 'ALL_KEYS',
          actor: 'Recovery Manager',
          status: 'SUCCESS',
          details: `Crash recovery passed: ${result.report.totalEntriesMaterialized} entries materialized.`
        },
        ...prev
      ]);

      setMetrics((prev) => ({
        ...prev,
        recoveriesCompleted: prev.recoveriesCompleted + 1
      }));

      addToast('Recovery Complete', 'Cache state restored and consistency verified.', 'success');
    } catch (err) {
      setRecoveryStatus((prev) => ({ ...prev, status: 'ERROR' }));
      addToast('Recovery Error', err.message, 'error');
    }
  };

  // Chart trend update helper
  const updateActivityTrend = (opType) => {
    setActivityHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = { ...prev[prev.length - 1] };
      if (opType === 'HIT') last.hits += 1;
      if (opType === 'MISS') last.misses += 1;
      if (opType === 'SET') {
        last.sets += 1;
        last.gets += 1;
      }
      if (opType === 'DELETE') last.deletes += 1;
      return [...prev.slice(0, prev.length - 1), last];
    });
  };

  // Controlled real-time simulation
  useEffect(() => {
    if (!liveSimulation) return;
    const interval = setInterval(() => {
      const activeKeys = cacheEntries.filter(e => e.status === 'ACTIVE').map(e => e.key);
      const keys = activeKeys.length > 0 ? activeKeys : ['demo:active:key'];
      const actions = ['GET_HIT', 'GET_HIT', 'GET_HIT', 'GET_MISS', 'SET'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      if (action === 'GET_HIT') {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        getEntry(randomKey).catch(() => {});
      } else if (action === 'GET_MISS') {
        getEntry(`unknown:key:${Math.floor(Math.random() * 9000)}`).catch(() => {});
      } else if (action === 'SET') {
        const id = Math.floor(Math.random() * 900) + 100;
        setEntry(`session:${id}`, `session_state_${id}`, 60, 'seconds').catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [liveSimulation, cacheEntries]);

  const value = {
    cacheEntries,
    metrics,
    events,
    auditLogs,
    walRecords,
    snapshot,
    persistenceOverview,
    recoveryStatus,
    recoveryStep,
    evictionStats,
    healthStatus,
    activityHistory,
    liveSimulation,
    setLiveSimulation,
    uptime: startTime,
    theme,
    setTheme,
    toggleTheme,
    toasts,
    addToast,
    removeToast,
    setEntry,
    getEntry,
    deleteEntry,
    simulateTTLExpiry,
    simulateEviction,
    simulateSnapshot,
    startRecovery,
    clearEntries,
    simulateCrash,
    isBackendConnected,
    backendMeta,
    checkBackendSync
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};
