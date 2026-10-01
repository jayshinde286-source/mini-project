import React, { useState } from 'react';
import { Database, Plus, Search, Trash2, RefreshCw, Layers } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { CacheTable } from '../components/CacheTable';
import { EvictionPanel } from '../components/EvictionPanel';

export const CachePage = ({ onOpenSetModal, onOpenGetModal, onOpenDeleteModal }) => {
  const { cacheEntries, addToast } = useCache();
  const [selectedKeyForLookup, setSelectedKeyForLookup] = useState('');

  const handleRefresh = () => {
    addToast('Cache Synchronized', `${cacheEntries.length} cache entries reloaded.`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Database size={22} color="var(--accent-blue)" />
            Cache Entries
          </h1>
          <p className="page-subtitle">
            Manage in-memory entries, inspect TTL expiration bars, and observe LRU eviction thresholds.
          </p>
        </div>

        <div className="actions-row">
          <button id="page-set-entry-btn" className="btn btn-primary" onClick={onOpenSetModal}>
            <Plus size={15} />
            <span>+ SET ENTRY</span>
          </button>
          <button id="page-get-entry-btn" className="btn btn-outline" onClick={() => onOpenGetModal()}>
            <Search size={14} />
            <span>GET</span>
          </button>
          <button className="btn btn-outline" onClick={handleRefresh}>
            <RefreshCw size={14} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Eviction Management Subpanel */}
      <EvictionPanel />

      {/* Main Cache Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              In-Memory Store ({cacheEntries.length} items)
            </div>
            <div className="card-description">
              Fast hash table with lock-striping and secondary expiration min-heap
            </div>
          </div>
        </div>

        <CacheTable
          entries={cacheEntries}
          onLookupKey={(key) => onOpenGetModal(key)}
          onDeleteKey={(key) => onOpenDeleteModal(key)}
        />
      </div>
    </div>
  );
};
