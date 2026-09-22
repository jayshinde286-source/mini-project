import React from 'react';
import {
  PlayCircle,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Layers,
  Camera,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const DemoControls = ({ onOpenSetModal, onOpenGetModal }) => {
  const {
    getEntry,
    deleteEntry,
    simulateTTLExpiry,
    simulateEviction,
    simulateSnapshot,
    startRecovery,
    cacheEntries
  } = useCache();

  // Quick simulate triggers
  const handleSimulateHit = () => {
    const active = cacheEntries.find((e) => e.status === 'ACTIVE');
    const key = active ? active.key : 'user:1001';
    getEntry(key);
  };

  const handleSimulateMiss = () => {
    const randomKey = `nonexistent:key:${Math.floor(Math.random() * 9000) + 1000}`;
    getEntry(randomKey);
  };

  const handleSimulateDelete = () => {
    const tempEntry = cacheEntries.find((e) => e.key.startsWith('temp:'));
    if (tempEntry) {
      deleteEntry(tempEntry.key);
    } else {
      deleteEntry('user:1002');
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} color="var(--accent-blue)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Interactive Demo Controls
        </span>
        <span className="badge badge-gray" style={{ fontSize: '0.675rem' }}>
          Viva Shortcuts
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          id="demo-simulate-set-btn"
          className="btn btn-outline btn-sm"
          onClick={onOpenSetModal}
          title="Open SET entry dialog"
        >
          <Plus size={13} color="var(--accent-blue)" />
          <span>SET Entry</span>
        </button>

        <button
          id="demo-simulate-hit-btn"
          className="btn btn-outline btn-sm"
          onClick={handleSimulateHit}
          title="Simulate successful cache hit"
        >
          <CheckCircle2 size={13} color="var(--status-green)" />
          <span>Simulate GET HIT</span>
        </button>

        <button
          id="demo-simulate-miss-btn"
          className="btn btn-outline btn-sm"
          onClick={handleSimulateMiss}
          title="Simulate cache miss on unknown key"
        >
          <XCircle size={13} color="var(--status-red)" />
          <span>Simulate GET MISS</span>
        </button>

        <button
          id="demo-simulate-delete-btn"
          className="btn btn-outline btn-sm"
          onClick={handleSimulateDelete}
          title="Simulate key deletion with WAL tombstone"
        >
          <Trash2 size={13} color="var(--text-muted)" />
          <span>Simulate DELETE</span>
        </button>

        <button
          id="demo-simulate-ttl-btn"
          className="btn btn-outline btn-sm"
          onClick={simulateTTLExpiry}
          title="Simulate background TTL expiration"
        >
          <Clock size={13} color="var(--status-amber)" />
          <span>Simulate TTL Expiry</span>
        </button>

        <button
          id="demo-simulate-eviction-btn"
          className="btn btn-outline btn-sm"
          onClick={simulateEviction}
          title="Simulate LRU eviction from capacity head"
        >
          <Layers size={13} color="var(--accent-purple)" />
          <span>Simulate Eviction</span>
        </button>

        <button
          id="demo-simulate-snapshot-btn"
          className="btn btn-outline btn-sm"
          onClick={simulateSnapshot}
          title="Create and persist point-in-time snapshot"
        >
          <Camera size={13} color="var(--accent-cyan)" />
          <span>Simulate Snapshot</span>
        </button>

        <button
          id="demo-simulate-recovery-btn"
          className="btn btn-outline btn-sm"
          onClick={startRecovery}
          title="Execute 7-step crash recovery pipeline"
        >
          <RotateCcw size={13} color="var(--status-green)" />
          <span>Simulate Recovery</span>
        </button>
      </div>
    </div>
  );
};
