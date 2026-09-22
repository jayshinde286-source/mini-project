import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialCacheEntries, initialEvictionStats } from '../data/mockCacheData';
import { initialEvents } from '../data/mockEvents';
import { initialMetrics, initialHealthStatus, generateInitialActivityHistory } from '../data/mockMetrics';
import { initialPersistenceOverview, initialWalRecords, initialSnapshot, initialRecoveryStatus } from '../data/mockPersistence';
import { initialAuditLogs } from '../data/mockAudit';
import { cacheService } from '../services/cacheService';
import { persistenceService } from '../services/persistenceService';
import { eventService } from '../services/eventService';
import { recoveryService } from '../services/recoveryService';

const CacheContext = createContext(null);

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

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
  const [startTime] = useState(Date.now() - 4820000); // 1h 20m ago

  const nextWalSequence = useRef(2432);
  const nextEventId = useRef(1046);
  const nextAuditId = useRef(902);

  // Toast Helper
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Live timer for TTL countdown and periodic cleanup check
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
      const result = await cacheService.set(key, value, ttl, unit);
      const now = Date.now();
      const seq = nextWalSequence.current++;
      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;
      const txnId = `TXN-${String(seq).padStart(6, '0')}`;

      // Update Cache Entries
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

      // Update WAL
      const newWal = persistenceService.createWalRecord(seq, 'SET', result.key, result.value, result.expiresAt, txnId);
      setWalRecords((prev) => [newWal, ...prev]);

      // Update Event Stream
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

      // Update Audit Log
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

      // Update Metrics
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

      // Update Eviction capacity usage
      setEvictionStats((prev) => ({
        ...prev,
        currentUsage: prev.currentUsage + 1
      }));

      // Update chart activity
      updateActivityTrend('SET');

      addToast('Cache Set Success', `Key '${result.key}' persisted & cached.`, 'success');
      return { success: true, entry: result };
    } catch (err) {
      addToast('Cache Set Failed', err.message, 'error');
      throw err;
    }
  };

  // GET Cache Entry Operation
  const getEntry = async (key) => {
    try {
      const now = Date.now();
      const validKey = key?.trim();
      if (!validKey) throw new Error('Key cannot be empty');

      const existing = cacheEntries.find((e) => e.key === validKey);
      const isExpired = existing && existing.expiresAt > 0 && now >= existing.expiresAt;
      const isHit = existing && !isExpired && existing.status === 'ACTIVE';

      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;

      if (isHit) {
        // Record Hit
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
        // Record Miss
        const newEvent = eventService.createEvent(
          'CACHE_MISS',
          validKey,
          `Key ${validKey} not found in primary cache or expired`,
          '',
          'Cache Engine',
          'MISS'
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
            status: 'MISS',
            details: `Cache miss for key ${validKey}`
          },
          ...prev
        ]);

        setMetrics((prev) => {
          const newMisses = prev.misses + 1;
          const totalHitsMisses = prev.hits + newMisses;
          const hitRate = (prev.hits / totalHitsMisses) * 100;
          return {
            ...prev,
            misses: newMisses,
            totalRequests: prev.totalRequests + 1,
            hitRatePercent: Number(hitRate.toFixed(1))
          };
        });

        updateActivityTrend('MISS');
        addToast('Cache Miss', `Key '${validKey}' does not exist or expired.`, 'warning');
        return { hit: false, key: validKey };
      }
    } catch (err) {
      addToast('Lookup Error', err.message, 'error');
      throw err;
    }
  };

  // DELETE Cache Entry Operation
  const deleteEntry = async (key) => {
    try {
      await cacheService.delete(key);
      const now = Date.now();
      const seq = nextWalSequence.current++;
      const evId = nextEventId.current++;
      const audId = nextAuditId.current++;
      const txnId = `TXN-${String(seq).padStart(6, '0')}`;

      setCacheEntries((prev) => prev.filter((e) => e.key !== key));

      // WAL Tombstone Record
      const newWal = persistenceService.createWalRecord(seq, 'DELETE', key, '', 0, txnId);
      setWalRecords((prev) => [newWal, ...prev]);

      // Event
      const newEvent = eventService.createEvent(
        'CACHE_DELETE',
        key,
        `Tombstone recorded for ${key} in WAL and removed from map`,
        txnId,
        'Cache Engine',
        'SUCCESS'
      );
      newEvent.eventId = evId;
      setEvents((prev) => [newEvent, ...prev]);

      // Audit
      setAuditLogs((prev) => [
        {
          logId: `AUD-${audId}`,
          timestamp: now,
          operation: 'DELETE',
          key,
          actor: 'Client API',
          status: 'SUCCESS',
          details: `Entry ${key} deleted and tombstone committed to WAL (seq ${seq})`
        },
        ...prev
      ]);

      // Metrics
      setMetrics((prev) => ({
        ...prev,
        deletes: prev.deletes + 1,
        totalRequests: prev.totalRequests + 1,
        totalEntries: Math.max(0, prev.totalEntries - 1),
        walRecords: prev.walRecords + 1
      }));

      // Eviction usage update
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

  // Simulate TTL Expiry
  const simulateTTLExpiry = () => {
    const activeEntry = cacheEntries.find((e) => e.status === 'ACTIVE' && e.expiresAt > 0);
    const keyToExpire = activeEntry ? activeEntry.key : 'temp:token:44';
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

  // Simulate LRU Eviction
  const simulateEviction = () => {
    const activeEntries = cacheEntries.filter((e) => e.status === 'ACTIVE');
    if (activeEntries.length === 0) {
      addToast('Eviction Skipped', 'No active entries available to evict.', 'info');
      return;
    }

    // Pick least recently accessed
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
      `Evicted from LRU cache head due to mock capacity threshold`,
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

  // Simulate Snapshot Creation
  const simulateSnapshot = () => {
    const now = Date.now();
    const evId = nextEventId.current++;
    const audId = nextAuditId.current++;
    const newVersion = snapshot.version + 1;
    const snapId = `snapshot_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(newVersion).padStart(4, '0')}`;

    const newSnap = {
      id: snapId,
      version: newVersion,
      entriesCount: cacheEntries.filter((e) => e.status === 'ACTIVE').length,
      createdAt: now,
      checksum: '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase(),
      status: 'VALID',
      sizeBytes: `${(24.8 + Math.random() * 2).toFixed(1)} KB`
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
        details: `Snapshot ${snapId} written successfully to persistence directory`
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
      const keys = ['user:1001', 'user:1002', 'session:4421', 'session:8842', 'config:database', 'temp:token:44'];
      const actions = ['GET_HIT', 'GET_HIT', 'GET_HIT', 'GET_MISS', 'SET'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      if (action === 'GET_HIT') {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        getEntry(randomKey).catch(() => {});
      } else if (action === 'GET_MISS') {
        getEntry(`unknown:key:${Math.floor(Math.random() * 9000)}`).catch(() => {});
      } else if (action === 'SET') {
        const id = Math.floor(Math.random() * 900) + 100;
        setEntry(`session:${id}`, `mock_session_state_${id}`, 60, 'seconds').catch(() => {});
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
    toasts,
    addToast,
    removeToast,
    setEntry,
    getEntry,
    deleteEntry,
    simulateTTLExpiry,
    simulateEviction,
    simulateSnapshot,
    startRecovery
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};
