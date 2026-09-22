import React from 'react';
import { Layers, AlertTriangle, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatRelativeTime } from '../utils/formatters';

export const EvictionPanel = () => {
  const { evictionStats, simulateEviction } = useCache();
  const usagePercent = Math.min(100, (evictionStats.currentUsage / evictionStats.capacity) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Layers size={17} color="var(--status-amber)" />
            LRU Eviction & Capacity Management
          </div>
          <div className="card-description">
            Monitors memory threshold and Least Recently Used (LRU) eviction eviction triggers
          </div>
        </div>

        <button
          id="simulate-eviction-btn"
          className="btn btn-outline btn-sm"
          onClick={simulateEviction}
          title="Manually trigger LRU eviction"
        >
          <ArrowDownRight size={13} color="var(--status-amber)" />
          <span>Simulate Eviction</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Usage Progress */}
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Cache Capacity:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{evictionStats.capacity} entries</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Usage:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {evictionStats.currentUsage} entries ({usagePercent.toFixed(1)}%)
            </span>
          </div>

          <div style={{
            height: '6px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              height: '100%',
              width: `${usagePercent}%`,
              backgroundColor: usagePercent > 80 ? 'var(--status-red)' : 'var(--accent-blue)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Policy & Count */}
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Eviction Policy:</span>
            <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)' }}>
              {evictionStats.policy} (Linked List)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Total Evictions:</span>
            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-amber)' }}>
              {evictionStats.evictionsCount}
            </span>
          </div>
        </div>

        {/* Last Evicted Key */}
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Last Evicted Key
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-red)', fontSize: '0.85rem' }}>
            {evictionStats.lastEvictedKey || 'None'}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Reason: {evictionStats.lastEvictedReason}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatRelativeTime(evictionStats.lastEvictedTimestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};
