import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const DeleteConfirmModal = ({ isOpen, onClose, entryKey }) => {
  const { deleteEntry } = useCache();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !entryKey) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry(entryKey);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--status-red)' }}>
            <AlertTriangle size={18} />
            Confirm Cache Key Deletion
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Are you sure you want to delete the cache entry:
          </p>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: 'var(--bg-tertiary)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            {entryKey}
          </div>

          <div style={{
            fontSize: '0.775rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            padding: '10px',
            backgroundColor: 'var(--status-amber-bg)',
            border: '1px solid var(--status-amber-border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <strong style={{ color: 'var(--status-amber)' }}>Persistence Action:</strong> This operation writes an append-only tombstone record with CRC32 checksum to the Write-Ahead Log (WAL) and purges the key from memory and the TTL min-heap.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-entry-btn"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Deleting...' : 'DELETE ENTRY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
