import React, { useState } from 'react';
import { PlusCircle, AlertCircle, Database } from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const CacheOperationModal = ({ isOpen, onClose, initialKey = '', initialValue = '', initialTTL = 60 }) => {
  const { setEntry } = useCache();
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState(initialValue);
  const [ttl, setTtl] = useState(initialTTL);
  const [unit, setUnit] = useState('seconds');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!key.trim()) {
      setError('Cache key is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setEntry(key.trim(), value, ttl, unit);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to set cache entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="modal-title">
              <PlusCircle size={18} color="var(--accent-blue)" />
              SET Cache Entry
            </div>
            <button type="button" className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'var(--status-red-bg)',
                border: '1px solid var(--status-red-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--status-red)',
                fontSize: '0.8rem',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="set-cache-key">
                Cache Key <span className="req">*</span>
              </label>
              <input
                id="set-cache-key"
                type="text"
                className="input mono"
                placeholder="e.g. user:1001 or session:abc"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoFocus
                required
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Unique namespace key in memory index.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="set-cache-value">
                Value <span className="req">*</span>
              </label>
              <textarea
                id="set-cache-value"
                className="textarea mono"
                rows={3}
                placeholder="Enter string or serialized JSON payload"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="set-cache-ttl">
                  Time-To-Live (TTL)
                </label>
                <input
                  id="set-cache-ttl"
                  type="number"
                  min="0"
                  step="1"
                  className="input mono"
                  placeholder="0 = Persistent"
                  value={ttl}
                  onChange={(e) => setTtl(e.target.value)}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Set 0 for never-expiring key.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="set-cache-unit">
                  Unit
                </label>
                <select
                  id="set-cache-unit"
                  className="select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="milliseconds">Milliseconds</option>
                </select>
              </div>
            </div>

            <div style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <strong>Engine Flow:</strong> Writes to exclusive WAL (V2 record with CRC32 hex) &rarr; updates ConcurrentHashMap &rarr; updates TTL min-heap &rarr; emits CACHE_SET event to EventBus.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" id="submit-set-entry-btn" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Writing to WAL...' : 'SET ENTRY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
