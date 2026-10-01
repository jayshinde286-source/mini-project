import React from 'react';
import { X, Keyboard, Command, Hash, Layers } from 'lucide-react';

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd + K / Ctrl + K', description: 'Open Global Command Palette (Search, Commands & Navigation)' },
    { key: '?', description: 'Open this Keyboard Shortcuts cheat sheet' },
    { key: 'Esc', description: 'Close any active modal or command palette' },
    { key: '1', description: 'Jump to Dashboard' },
    { key: '2', description: 'Jump to Cache Entries table' },
    { key: '3', description: 'Jump to Live Event Stream' },
    { key: '4', description: 'Jump to Persistence (WAL Explorer)' },
    { key: '5', description: 'Jump to Two-Phase Recovery' },
    { key: '6', description: 'Jump to Metrics & Analytics' },
    { key: '7', description: 'Jump to Audit Logs' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%', borderRadius: '14px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
              <Keyboard size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Keyboard Shortcuts Cheat Sheet</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Power-user productivity navigation</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--surface-hover)',
                fontSize: '0.85rem'
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{s.description}</span>
              <kbd
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: 'var(--accent-indigo)',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '18px', textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
