import React, { useState, useEffect } from 'react';
import { Flame, Zap, Snowflake, RefreshCw } from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const HotKeysWidget = ({ onInspectKey }) => {
  const { cacheEntries, getEntry, isBackendConnected } = useCache();
  const [hotkeys, setHotkeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHotKeys = async () => {
    setLoading(true);
    const BACKEND_URL = (typeof window !== 'undefined' && window.__SPIT_BACKEND_URL__) || 'http://localhost:8080';

    if (isBackendConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/hotkeys?limit=6`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.hotkeys)) {
            setHotkeys(data.hotkeys);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}
    }

    const active = (cacheEntries || []).filter((e) => e.status === 'ACTIVE');
    const sorted = [...active].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));

    const derived = sorted.slice(0, 6).map((e) => {
      const cnt = e.accessCount || 1;
      const heat = cnt >= 10 ? 'HOT' : (cnt >= 3 ? 'WARM' : 'COLD');
      const valStr = typeof e.value === 'string' ? e.value : JSON.stringify(e.value || '');
      const byteSize = e.key.length * 2 + valStr.length * 2;
      return {
        key: e.key,
        accessCount: cnt,
        heat,
        byteSize,
        recencySec: Math.max(0, Math.floor((Date.now() - (e.lastAccessed || e.createdAt)) / 1000))
      };
    });

    setHotkeys(derived);
    setLoading(false);
  };

  useEffect(() => {
    fetchHotKeys();
  }, [cacheEntries, isBackendConnected]);

  const handleTouchKey = async (key) => {
    await getEntry(key);
    fetchHotKeys();
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={16} color="var(--accent-rose)" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Hot-Keys & Access Frequency
            </h3>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Live LFU frequency tracking & MRU ranking
            </div>
          </div>
        </div>

        <button
          onClick={fetchHotKeys}
          className="btn btn-outline btn-sm"
          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          title="Refresh Hot Keys"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {hotkeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          No active keys with frequency data. Insert keys or run benchmark to populate.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {hotkeys.map((item, idx) => {
            const isHot = item.heat === 'HOT';
            const isWarm = item.heat === 'WARM';

            return (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    width: '14px',
                    textAlign: 'center'
                  }}>
                    #{idx + 1}
                  </span>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        onClick={() => onInspectKey && onInspectKey(item.key)}
                        style={{
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        {item.key}
                      </span>

                      {isHot ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                          <Flame size={11} /> HOT
                        </span>
                      ) : isWarm ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                          <Zap size={11} /> WARM
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          <Snowflake size={11} /> COLD
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.byteSize} B • {item.recencySec}s ago
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                    {item.accessCount} hits
                  </span>

                  <button
                    onClick={() => handleTouchKey(item.key)}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '3px 7px', fontSize: '0.68rem' }}
                    title="Simulate Hit: Move to MRU Head"
                  >
                    Touch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
