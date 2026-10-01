import React, { useState, useMemo } from 'react';
import { Search, Database, Trash2, ExternalLink, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, Eye, CheckSquare, Square, Sparkles } from 'lucide-react';
import { TTLVisualizer } from './TTLVisualizer';
import { KeyDetailModal } from './KeyDetailModal';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const CacheTable = ({ entries, onLookupKey, onDeleteKey, onSetKey }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('lastAccessed');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [inspectingEntry, setInspectingEntry] = useState(null);
  const pageSize = 10;

  // Filtering
  const filtered = useMemo(() => {
    return entries.filter((entry) => {
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
  }, [entries, searchQuery, statusFilter]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Row selection
  const handleToggleSelectAll = () => {
    if (selectedKeys.size === paginated.length && paginated.length > 0) {
      setSelectedKeys(new Set());
    } else {
      const next = new Set();
      paginated.forEach((e) => next.add(e.key));
      setSelectedKeys(next);
    }
  };

  const handleToggleRow = (key) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedKeys.size} selected cache entries? This will log tombstones to WAL.`)) {
      selectedKeys.forEach((k) => onDeleteKey && onDeleteKey(k));
      setSelectedKeys(new Set());
    }
  };

  // Export JSON
  const handleExportJSON = (dataToExport = sorted, filename = 'spit_cache_entries') => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${filename}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCSV = (dataToExport = sorted, filename = 'spit_cache_entries') => {
    const headers = ['Key', 'Value', 'Version', 'Status', 'CreatedAt', 'LastAccessed', 'AccessCount', 'ExpiresAt'];
    const rows = dataToExport.map((e) => [
      `"${e.key}"`,
      `"${String(e.value).replace(/"/g, '""')}"`,
      e.version,
      e.status,
      new Date(e.createdAt).toISOString(),
      new Date(e.lastAccessed).toISOString(),
      e.accessCount,
      e.expiresAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `${filename}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Warm Up Sample Data
  const handleWarmUpData = () => {
    const sampleKeys = [
      { key: 'auth:jwt:u101', val: JSON.stringify({ uid: '101', role: 'admin' }), ttl: 120 },
      { key: 'inventory:sku:iphone15', val: JSON.stringify({ stock: 42, warehouse: 'BOM-1' }), ttl: 300 },
      { key: 'rate:ip:192.168.1.50', val: JSON.stringify({ tokens: 95, windowMs: 60000 }), ttl: 60 },
      { key: 'config:tax:gst_slabs', val: JSON.stringify({ standard: 18, reduced: 5 }), ttl: 0 },
      { key: 'session:cart:9942', val: JSON.stringify({ items: 3, totalINR: 4999 }), ttl: 180 },
    ];
    sampleKeys.forEach((s) => onSetKey && onSetKey(s.key, s.val, s.ttl, 'seconds'));
  };

  const selectedEntries = useMemo(() => {
    return entries.filter((e) => selectedKeys.has(e.key));
  }, [entries, selectedKeys]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search, Filters and Export Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              id="cache-search-input"
              type="text"
              className="input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search by key or value..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            {['ALL', 'ACTIVE', 'EXPIRED', 'EVICTED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.725rem', padding: '3px 8px' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleWarmUpData}
            title="Inject realistic enterprise sample datasets into cache"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'var(--accent-indigo)', color: 'var(--accent-indigo)' }}
          >
            <Sparkles size={13} />
            <span>Load Sample Data</span>
          </button>
          <button
            id="export-cache-json-btn"
            className="btn btn-outline btn-sm"
            onClick={() => handleExportJSON()}
            title="Export filtered cache entries as JSON"
          >
            <Download size={13} color="var(--accent-primary)" />
            <span>Export JSON</span>
          </button>
          <button
            id="export-cache-csv-btn"
            className="btn btn-outline btn-sm"
            onClick={() => handleExportCSV()}
            title="Export filtered cache entries as CSV spreadsheet"
          >
            <Download size={13} color="var(--status-green)" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedKeys.size > 0 && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>
            {selectedKeys.size} {selectedKeys.size === 1 ? 'entry' : 'entries'} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleExportJSON(selectedEntries, 'selected_cache_entries')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExportCSV(selectedEntries, 'selected_cache_entries')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            >
              Export CSV
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={12} /> Delete Selected
            </button>
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '38px', textAlign: 'center' }}>
                <button
                  onClick={handleToggleSelectAll}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  title="Select / Deselect all on current page"
                >
                  {selectedKeys.size === paginated.length && paginated.length > 0 ? (
                    <CheckSquare size={16} color="var(--accent-indigo)" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th onClick={() => handleSort('key')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Key</span>
                  <ArrowUpDown size={12} color="var(--text-muted)" />
                </div>
              </th>
              <th>Value</th>
              <th>TTL Status</th>
              <th>Status</th>
              <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Created</span>
                  <ArrowUpDown size={12} color="var(--text-muted)" />
                </div>
              </th>
              <th onClick={() => handleSort('lastAccessed')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Last Accessed</span>
                  <ArrowUpDown size={12} color="var(--text-muted)" />
                </div>
              </th>
              <th onClick={() => handleSort('accessCount')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Access Count</span>
                  <ArrowUpDown size={12} color="var(--text-muted)" />
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No cache entries found matching current criteria.
                </td>
              </tr>
            ) : (
              paginated.map((entry) => {
                let badgeClass = 'badge-green';
                if (entry.status === 'EXPIRED') badgeClass = 'badge-red';
                if (entry.status === 'EVICTED') badgeClass = 'badge-amber';
                const isSelected = selectedKeys.has(entry.key);

                return (
                  <tr
                    key={entry.key}
                    style={{ background: isSelected ? 'rgba(99, 102, 241, 0.05)' : undefined }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleRow(entry.key)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isSelected ? <CheckSquare size={16} color="var(--accent-indigo)" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          onClick={() => setInspectingEntry(entry)}
                          style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline dotted' }}
                          title="Click to inspect node metadata"
                        >
                          {entry.key}
                        </span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          v{entry.version}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem'
                      }}>
                        {typeof entry.value === 'object' ? JSON.stringify(entry.value) : String(entry.value)}
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
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(entry.lastAccessed)}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontFamily: 'var(--font-mono)' }}>
                        {entry.accessCount}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => setInspectingEntry(entry)}
                          className="btn-icon"
                          title="Inspect Key Details & JSON Metadata"
                          style={{ padding: '4px' }}
                        >
                          <Eye size={14} color="var(--accent-indigo)" />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onLookupKey && onLookupKey(entry.key)}
                          title="Query this key via GET operation"
                          style={{ padding: '4px' }}
                        >
                          <ExternalLink size={14} color="var(--accent-primary)" />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onDeleteKey && onDeleteKey(entry.key)}
                          title="Delete this key"
                          style={{ padding: '4px' }}
                        >
                          <Trash2 size={14} color="var(--status-red)" />
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

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing {sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} entries
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 8px' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Key Inspector Modal */}
      <KeyDetailModal
        entry={inspectingEntry}
        isOpen={Boolean(inspectingEntry)}
        onClose={() => setInspectingEntry(null)}
        onLookup={onLookupKey}
        onDelete={onDeleteKey}
      />
    </div>
  );
};
