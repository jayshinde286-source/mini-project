import React, { useState } from 'react';
import {
  HardDrive,
  Camera,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatTimestamp, formatFullDateTime, formatRelativeTime } from '../utils/formatters';

export const PersistencePage = () => {
  const {
    persistenceOverview,
    walRecords,
    snapshot,
    simulateSnapshot,
    cacheEntries
  } = useCache();

  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <HardDrive size={22} color="var(--accent-cyan)" />
            Persistence & Write-Ahead Log (WAL)
          </h1>
          <p className="page-subtitle">
            Durable state persistence engine featuring exclusive writer lock, append-only WAL, CRC32 checksums, and point-in-time snapshots.
          </p>
        </div>

        <div className="actions-row">
          <button
            id="create-snapshot-top-btn"
            className="btn btn-primary"
            onClick={simulateSnapshot}
          >
            <Camera size={14} />
            <span>CREATE SNAPSHOT</span>
          </button>
        </div>
      </div>

      {/* Persistence Overview Cards */}
      <div className="stats-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Persistence Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot green"></span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-green)', fontFamily: 'var(--font-mono)' }}>
              {persistenceOverview.persistenceStatus}
            </span>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Sync-on-commit flush active
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            WAL Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot green"></span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-green)', fontFamily: 'var(--font-mono)' }}>
              {persistenceOverview.walStatus}
            </span>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Exclusive owner lock held
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Snapshot Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot blue"></span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {persistenceOverview.snapshotStatus}
            </span>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Last: {formatRelativeTime(persistenceOverview.lastSnapshotTime)}
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            WAL Records
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {walRecords.length.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Pending writes: {persistenceOverview.pendingWrites}
          </span>
        </div>
      </div>

      {/* Snapshot Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Camera size={18} color="var(--accent-purple)" />
              Point-in-Time Snapshot
            </div>
            <div className="card-description">
              Compact serialized baseline state for fast crash recovery without scanning full WAL history
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              id="view-snapshot-btn"
              className="btn btn-outline btn-sm"
              onClick={() => setShowSnapshotModal(true)}
            >
              <FileCode size={13} />
              <span>VIEW SNAPSHOT</span>
            </button>
            <button
              id="create-snapshot-btn"
              className="btn btn-primary btn-sm"
              onClick={simulateSnapshot}
            >
              <Camera size={13} />
              <span>CREATE SNAPSHOT</span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          backgroundColor: 'var(--bg-tertiary)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Snapshot</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-purple)', fontSize: '0.9rem' }}>
              {snapshot.id}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Version</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
              v{snapshot.version}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entries</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-green)' }}>
              {snapshot.entriesCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created At</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {formatTimestamp(snapshot.createdAt)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Integrity Checksum</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {snapshot.checksum}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
            <span className="badge badge-green">{snapshot.status}</span>
          </div>
        </div>
      </div>

      {/* WAL Records Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <HardDrive size={18} color="var(--accent-cyan)" />
              Write-Ahead Log (WAL) Records
            </div>
            <div className="card-description">
              Sequential V2 transaction entries. Each record is verified with CRC32 checksum before apply.
            </div>
          </div>
          <span className="badge badge-blue">FORMAT: V2 (TAB-DELIMITED)</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Transaction ID</th>
                <th>Operation</th>
                <th>Key</th>
                <th>Timestamp</th>
                <th>CRC32 Checksum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {walRecords.map((rec) => (
                <tr key={rec.sequence}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    #{rec.sequence}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {rec.transactionId}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${rec.operation === 'SET' ? 'badge-blue' : 'badge-red'}`}>
                      {rec.operation}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rec.key}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    {formatTimestamp(rec.timestamp)}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-cyan)'
                    }}>
                      {rec.checksum}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-green">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Content Viewer Modal */}
      {showSnapshotModal && (
        <div className="modal-overlay" onClick={() => setShowSnapshotModal(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Camera size={18} color="var(--accent-purple)" />
                Snapshot Inspector: {snapshot.id}
              </div>
              <button className="modal-close" onClick={() => setShowSnapshotModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VERSION:</span> <strong style={{ display: 'block' }}>{snapshot.version}</strong></div>
                <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ENTRIES:</span> <strong style={{ display: 'block' }}>{snapshot.entriesCount}</strong></div>
                <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FILE SIZE:</span> <strong style={{ display: 'block' }}>{snapshot.sizeBytes}</strong></div>
                <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INTEGRITY:</span> <strong style={{ display: 'block', color: 'var(--status-green)' }}>CRC32 PASS</strong></div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Snapshot Binary Dump Preview (Simulated In-Memory Stream):
                </span>
                <pre style={{
                  marginTop: '6px',
                  background: 'var(--bg-primary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
{`# SPIT CACHE SNAPSHOT DUMP v${snapshot.version}
# CREATED_AT: ${new Date(snapshot.createdAt).toISOString()}
# INTEGRITY_CRC32: ${snapshot.checksum}
# ----------------------------------------------------
${cacheEntries.slice(0, 10).map((e) => `ENTRY [v${e.version}] ${e.key} = ${e.value} (TTL: ${e.expiresAt})`).join('\n')}
... [${cacheEntries.length} total entries indexed in secondary B-tree]`}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowSnapshotModal(false)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
