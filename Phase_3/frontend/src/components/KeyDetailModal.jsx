import React, { useState } from 'react';
import { X, Copy, Check, Clock, Database, Tag, ShieldCheck, Trash2, ArrowUpRight } from 'lucide-react';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const KeyDetailModal = ({ entry, isOpen, onClose, onLookup, onDelete }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !entry) return null;

  const handleCopy = () => {
    const text = typeof entry.value === 'object' ? JSON.stringify(entry.value, null, 2) : String(entry.value);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedValue = typeof entry.value === 'object'
    ? JSON.stringify(entry.value, null, 2)
    : String(entry.value);

  const approxBytes = entry.key.length * 2 + formattedValue.length + 64;

  const isExpired = entry.expiresAt > 0 && Date.now() >= entry.expiresAt;
  const remainingSec = entry.expiresAt > 0 ? Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)) : null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', borderRadius: '14px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Key Inspector & Node Metadata</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>In-Memory Doubly-Linked Node Inspection</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Key Badge */}
        <div style={{ background: 'var(--surface-hover)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '2px' }}>Storage Key</div>
            <code style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{entry.key}</code>
          </div>
          <span className={`badge ${entry.status === 'ACTIVE' && !isExpired ? 'badge-active' : 'badge-expired'}`}>
            {entry.status === 'ACTIVE' && !isExpired ? 'ACTIVE NODE' : 'EXPIRED / PURGED'}
          </span>
        </div>

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Access Count</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>{entry.accessCount || 1} hits</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Version / LSN</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px', color: 'var(--accent-indigo)' }}>v{entry.version || 1}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Est. Memory</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px', color: 'var(--accent-emerald)' }}>~{approxBytes} B</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TTL Remaining</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px', color: remainingSec ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
              {remainingSec !== null ? `${remainingSec}s` : 'Infinity'}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>Created: <span style={{ color: 'var(--text-secondary)' }}>{formatTimestamp(entry.createdAt)}</span></div>
          <div>Last Accessed: <span style={{ color: 'var(--text-secondary)' }}>{formatRelativeTime(entry.lastAccessed)}</span></div>
        </div>

        {/* Payload / Value Box */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Payload Content (Value)</span>
            <button
              onClick={handleCopy}
              className="btn-outline"
              style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy Value'}
            </button>
          </div>
          <pre
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.82rem',
              maxHeight: '180px',
              overflowY: 'auto',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              margin: 0
            }}
          >
            {formattedValue}
          </pre>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <button
            onClick={() => {
              onDelete && onDelete(entry.key);
              onClose();
            }}
            className="btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 12px' }}
          >
            <Trash2 size={14} /> Delete Key
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                onLookup && onLookup(entry.key);
                onClose();
              }}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <ArrowUpRight size={14} /> Query Key (GET)
            </button>
            <button
              onClick={onClose}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '6px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
