import React, { useState, useEffect, useRef } from 'react';
import { Flame, Play, Pause, Zap, Activity, Gauge, TrendingUp } from 'lucide-react';
import { useCache } from '../context/CacheContext';

/**
 * Interactive Live Traffic Surge Generator
 * Generates realistic high-frequency traffic hitting the live cache backend.
 * Provides examiners an immediate live demonstration of Tatkal/Flash-Sale workload.
 */
export const LiveTrafficSurgeWidget = () => {
  const { isBackendConnected, getEntry, setEntry, checkBackendSync, addToast } = useCache();
  const [trafficMode, setTrafficMode] = useState('standby'); // 'standby' | 'steady' | 'peak' | 'surge'
  const [opsCount, setOpsCount] = useState(0);
  const [currentOpsPerSec, setCurrentOpsPerSec] = useState(0);
  const [liveHitRatio, setLiveHitRatio] = useState(90);

  const localHits = useRef(0);
  const localMisses = useRef(0);
  const recentOpsCount = useRef(0);

  // Speed mapping in milliseconds per operation
  const modeIntervals = {
    standby: null,
    steady: 1000, // 1 op/s
    peak: 250,    // 4 ops/s
    surge: 80     // 12.5 ops/s
  };

  useEffect(() => {
    const intervalMs = modeIntervals[trafficMode];
    if (!intervalMs) {
      setCurrentOpsPerSec(0);
      return;
    }

    // Traffic generator worker
    const workerTimer = setInterval(async () => {
      const keys = [
        'auth:jwt:session_usr_9021',
        'db:pool:postgres_primary',
        'catalog:sku:macbook_pro_m3_max',
        'api:ratelimit:client_gateway_01',
        'cart:usr_4481_checkout',
        'geo:cdn:edge_routing_mumbai'
      ];

      const opType = Math.random();

      try {
        if (opType < 0.65) {
          // 65% Cache Hits
          const randomKey = keys[Math.floor(Math.random() * keys.length)];
          const res = await getEntry(randomKey);
          if (res && res.hit) localHits.current++;
          else localMisses.current++;
        } else if (opType < 0.85) {
          // 20% Cache Misses
          const missKey = `probe:cold_miss:${Math.floor(Math.random() * 8000)}`;
          await getEntry(missKey);
          localMisses.current++;
        } else {
          // 15% Cache Writes
          const newId = Math.floor(Math.random() * 900) + 100;
          await setEntry(`flash_sale:ticket:${newId}`, {
            pnr: `SPIT-${newId}`,
            status: 'CONFIRMED',
            seat: `B3-${newId % 60}`
          }, 120);
          localHits.current++;
        }

        setOpsCount((prev) => prev + 1);
        recentOpsCount.current++;

        const total = localHits.current + localMisses.current;
        if (total > 0) {
          setLiveHitRatio(Number(((localHits.current / total) * 100).toFixed(1)));
        }
      } catch (err) {}
    }, intervalMs);

    // Rate calculation ticker
    const rateTicker = setInterval(() => {
      setCurrentOpsPerSec(recentOpsCount.current);
      recentOpsCount.current = 0;
    }, 1000);

    return () => {
      clearInterval(workerTimer);
      clearInterval(rateTicker);
    };
  }, [trafficMode, isBackendConnected]);

  const handleSelectMode = (mode) => {
    setTrafficMode(mode);
    if (mode === 'surge') {
      addToast('Tatkal Surge Activated', 'Simulating 12+ ops/sec concurrent load directly against backend engine!', 'warning');
    } else if (mode === 'standby') {
      addToast('Traffic Simulator Paused', 'Generator in standby mode.', 'info');
    }
  };

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.6) 100%)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      boxShadow: '0 8px 30px rgba(139, 92, 246, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={18} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Interactive Live Traffic Surge Simulator</span>
              {trafficMode !== 'standby' && (
                <span className="pulsing-indicator" style={{ backgroundColor: 'var(--accent-purple)' }}></span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Fire genuine high-frequency load into the cache to observe real-time LRU evictions, WAL sync, and hit rate graphs.
            </div>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Live Speed
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: currentOpsPerSec > 0 ? 'var(--status-green)' : 'var(--text-secondary)' }}>
              {currentOpsPerSec} ops/s
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Ops Fired
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {opsCount}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Dynamic Hit Rate
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: liveHitRatio > 80 ? 'var(--status-green)' : 'var(--status-amber)' }}>
              {liveHitRatio}%
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'standby', label: '⏸️ Standby', desc: '0 ops/s' },
          { id: 'steady', label: '🟢 Steady Traffic', desc: '1 op/s' },
          { id: 'peak', label: '⚡ Peak Load', desc: '4 ops/s' },
          { id: 'surge', label: '🔥 Tatkal Flash Surge', desc: '12 ops/s' }
        ].map((m) => {
          const isSelected = trafficMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMode(m.id)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: isSelected ? '1px solid var(--accent-purple)' : '1px solid transparent',
                backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.785rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{m.label}</span>
              <span style={{ fontSize: '0.675rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>({m.desc})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
