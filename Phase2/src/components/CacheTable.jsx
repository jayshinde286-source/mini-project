import React, { useState } from 'react';
import { Search, Database, Trash2, ExternalLink, Filter } from 'lucide-react';
import { TTLVisualizer } from './TTLVisualizer';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const CacheTable = ({ entries, onLookupKey, onDeleteKey }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = entries.filter((entry) => {
    const matchesSearch =
      entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(entry.value).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && entry.status === 'ACTIVE') ||
      (statusFilter === 'EXPIRED' && entry.status === 'EXPIRED') ||
      (statusFilter === 'EVICTED' && entry.status === 'EVICTED');

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            id="cache-search-input"
            type="text"
            className="input"
            style={{ paddingLeft: '32px' }}
            placeholder="Search by key or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>Status:</span>
          {['ALL', 'ACTIVE', 'EXPIRED', 'EVICTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.725rem', padding: '3px 8px' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>TTL</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Accessed</th>
              <th>Access Count</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No cache entries found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                let badgeClass = 'badge-green';
                if (entry.status === 'EXPIRED') badgeClass = 'badge-red';
                if (entry.status === 'EVICTED') badgeClass = 'badge-amber';

                return (
                  <tr key={entry.key}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {entry.key}
                        </span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          v{entry.version}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{
                        maxWidth: '260px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem'
                      }}>
                        {entry.value}
                      </div>
                    </td>
                    <td>
                      <TTLVisualizer expiresAt={entry.expiresAt} />
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(entry.lastAccessed)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {entry.accessCount}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Get / inspect this key"
                          onClick={() => onLookupKey(entry.key)}
                          style={{ padding: '3px 8px' }}
                        >
                          <ExternalLink size={12} />
                          <span>GET</span>
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Delete key"
                          onClick={() => onDeleteKey(entry.key)}
                          style={{ padding: '3px 8px', color: 'var(--status-red)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
