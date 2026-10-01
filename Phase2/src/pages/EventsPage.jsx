import React, { useState } from 'react';
import { Radio, Search, Filter, Play, Pause, Download, Trash2, ArrowUpRight } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const EventsPage = () => {
  const { events, liveSimulation, setLiveSimulation, addToast } = useCache();
  const [filterType, setFilterType] = useState('ALL');
  const [searchKey, setSearchKey] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const eventTypes = [
    'ALL',
    'CACHE_SET',
    'CACHE_HIT',
    'CACHE_MISS',
    'CACHE_DELETE',
    'TTL_EXPIRED',
    'CACHE_EVICTED'
  ];

  const filteredEvents = events.filter((ev) => {
    const matchesFilter = filterType === 'ALL' || ev.type === filterType;
    const matchesSearch =
      String(ev.key || '').toLowerCase().includes(searchKey.toLowerCase()) ||
      String(ev.type || '').toLowerCase().includes(searchKey.toLowerCase()) ||
      String(ev.transactionId || '').toLowerCase().includes(searchKey.toLowerCase()) ||
      String(ev.detail || '').toLowerCase().includes(searchKey.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleExportEvents = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cache_events_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Events Exported', 'Downloaded full event stream as JSON.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Radio size={22} color="var(--accent-purple)" />
            Event Stream
          </h1>
          <p className="page-subtitle">
            Asynchronous EventBus dispatcher journal monitoring cache state changes and operational events.
          </p>
        </div>

        <div className="actions-row">
          <button
            className={`btn btn-sm ${liveSimulation ? 'btn-success' : 'btn-outline'}`}
            onClick={() => setLiveSimulation(!liveSimulation)}
          >
            {liveSimulation ? <Pause size={13} /> : <Play size={13} />}
            <span>Live Stream: {liveSimulation ? 'Active' : 'Paused'}</span>
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportEvents}>
            <Download size={13} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              id="event-search-input"
              type="text"
              className="input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search by key, transaction..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filter:</span>
            {eventTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.725rem', padding: '3px 8px' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Events Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Event</th>
                <th>Key</th>
                <th>Source</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No events matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  let badgeClass = 'badge-blue';
                  if (ev.type === 'CACHE_HIT') badgeClass = 'badge-green';
                  if (ev.type === 'CACHE_MISS') badgeClass = 'badge-red';
                  if (ev.type === 'TTL_EXPIRED' || ev.type === 'CACHE_EVICTED') badgeClass = 'badge-amber';
                  if (ev.type === 'SNAPSHOT_CREATED' || ev.type === 'RECOVERY_COMPLETED') badgeClass = 'badge-purple';

                  return (
                    <tr
                      key={ev.eventId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        #{ev.eventId}
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatTimestamp(ev.timestamp)}
                        <span style={{ display: 'block', fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(ev.timestamp)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {ev.type}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {ev.key}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ev.source}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: ev.transactionId ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                          {ev.transactionId || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${ev.status === 'SUCCESS' ? 'badge-green' : ev.status === 'MISS' ? 'badge-red' : 'badge-amber'}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                        {ev.detail}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Inspection Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Radio size={18} color="var(--accent-purple)" />
                Event Envelope Inspection: #{selectedEvent.eventId}
              </div>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type:</span>
                <span className="badge badge-purple">{selectedEvent.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Key:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedEvent.key}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transaction ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedEvent.transactionId || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Timestamp:</span>
                <span>{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Detail Description:</span>
                <div style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  color: 'var(--text-primary)'
                }}>
                  {selectedEvent.detail}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
