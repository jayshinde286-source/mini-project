import React, { useState } from 'react';
import { FileText, Search, Filter, Download, ArrowDownRight } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const AuditPage = () => {
  const { auditLogs, addToast } = useCache();
  const [filterOp, setFilterOp] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const operations = [
    'ALL',
    'SET',
    'GET',
    'DELETE',
    'RECOVERY',
    'SNAPSHOT',
    'EVICTION',
    'TTL'
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesOp =
      filterOp === 'ALL' ||
      log.operation.toUpperCase().includes(filterOp.toUpperCase());

    const query = (searchQuery || '').trim().toLowerCase();
    const matchesSearch =
      !query ||
      String(log.key || log.target || '').toLowerCase().includes(query) ||
      String(log.actor || '').toLowerCase().includes(query) ||
      String(log.details || '').toLowerCase().includes(query) ||
      String(log.operation || '').toLowerCase().includes(query);

    return matchesOp && matchesSearch;
  });

  const handleExportJSONL = () => {
    const lines = auditLogs.map((l) => JSON.stringify(l)).join('\n');
    const blob = new Blob([lines], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_journal_${Date.now()}.jsonl`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addToast('Audit Log Exported', 'Downloaded audit stream in JSONL format matching backend AuditLogListener.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={22} color="var(--accent-blue)" />
            Audit Journal & Compliance Trail
          </h1>
          <p className="page-subtitle">
            Append-only JSON Lines audit stream recording all actor operations, recovery checkpoints, and evictions.
          </p>
        </div>

        <div className="actions-row">
          <button className="btn btn-outline" onClick={handleExportJSONL}>
            <Download size={14} />
            <span>EXPORT JSONL</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              id="audit-search-input"
              type="text"
              className="input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search key, actor, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operation:</span>
            {operations.map((op) => (
              <button
                key={op}
                onClick={() => setFilterOp(op)}
                className={`btn btn-sm ${filterOp === op ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.725rem', padding: '3px 8px' }}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Operation</th>
                <th>Key</th>
                <th>Actor</th>
                <th>Status</th>
                <th>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No audit records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let badgeClass = 'badge-blue';
                  if (log.operation === 'GET') badgeClass = 'badge-green';
                  if (log.operation === 'DELETE') badgeClass = 'badge-red';
                  if (log.operation.includes('TTL') || log.operation.includes('EVICT')) badgeClass = 'badge-amber';
                  if (log.operation === 'RECOVERY' || log.operation === 'SNAPSHOT') badgeClass = 'badge-purple';

                  return (
                    <tr key={log.logId}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.logId}
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatTimestamp(log.timestamp)}
                        <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(log.timestamp)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {log.operation}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.key}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                        {log.actor}
                      </td>
                      <td>
                        <span className={`badge ${log.status === 'SUCCESS' ? 'badge-green' : log.status === 'MISS' ? 'badge-red' : 'badge-amber'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
