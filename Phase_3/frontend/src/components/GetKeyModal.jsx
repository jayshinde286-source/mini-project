import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock, Hash, Calendar } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatTTLRemaining, formatFullDateTime } from '../utils/formatters';

export const GetKeyModal = ({ isOpen, onClose, initialKey = '' }) => {
  const { getEntry } = useCache();
  const [lookupKey, setLookupKey] = useState(initialKey);
  const [result, setResult] = useState(null);
  const [hasQueried, setHasQueried] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupKey.trim()) return;

    setIsSearching(true);
    try {
      const res = await getEntry(lookupKey.trim());
      setResult(res);
      setHasQueried(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setHasQueried(false);
    setLookupKey('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleLookup}>
          <div className="modal-header">
            <div className="modal-title">
              <Search size={18} color="var(--accent-blue)" />
              GET Cache Entry
            </div>
            <button type="button" className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="lookup-cache-key">
                Enter Cache Key to Retrieve
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="lookup-cache-key"
                  type="text"
                  className="input mono"
                  placeholder="e.g. user:1001 or student:jay"
                  value={lookupKey}
                  onChange={(e) => setLookupKey(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  id="execute-get-btn"
                  className="btn btn-primary"
                  disabled={isSearching || !lookupKey.trim()}
                >
                  {isSearching ? 'Querying...' : 'GET'}
                </button>
              </div>
            </div>

            {/* Interactive Query Result */}
            {hasQueried && result && (
              <div style={{ marginTop: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                {result.hit ? (
                  <div style={{
                    border: '1px solid var(--status-green-border)',
                    backgroundColor: 'var(--status-green-bg)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={20} color="var(--status-green)" />
                        <span style={{ fontWeight: 700, color: 'var(--status-green)', fontSize: '1rem', letterSpacing: '0.04em' }}>
                          CACHE HIT
                        </span>
                      </div>
                      <span className="badge badge-green">STATUS: ACTIVE</span>
                    </div>

                    <div style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Key:</span>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {result.entry.key}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Value:</span>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          background: 'var(--bg-tertiary)',
                          padding: '8px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--accent-cyan)',
                          wordBreak: 'break-all'
                        }}>
                          {result.entry.value}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px', fontSize: '0.775rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>TTL Remaining: </span>
                          <span style={{ color: 'var(--status-amber)', fontWeight: 600 }}>
                            {formatTTLRemaining(result.entry.expiresAt).text}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Access Count: </span>
                          <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {result.entry.accessCount}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Version / Seq: </span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            #{result.entry.version}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Created: </span>
                          <span>{formatFullDateTime(result.entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '1px solid var(--status-red-border)',
                    backgroundColor: 'var(--status-red-bg)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <XCircle size={20} color="var(--status-red)" />
                      <span style={{ fontWeight: 700, color: 'var(--status-red)', fontSize: '1rem', letterSpacing: '0.04em' }}>
                        CACHE MISS
                      </span>
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      Key <code style={{ color: 'var(--text-primary)' }}>{result.key}</code> was not found in the primary in-memory hash store, or has already reached its TTL expiry threshold.
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Emitted event: <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>CACHE_MISS</span> &rarr; Recorded in Audit stream.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {hasQueried && (
              <button type="button" className="btn btn-outline" onClick={handleReset}>
                Lookup Another Key
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
