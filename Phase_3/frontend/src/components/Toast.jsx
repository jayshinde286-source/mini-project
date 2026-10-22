import React from 'react';
import { useCache } from '../context/CacheContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toasts, removeToast } = useCache();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 10000,
      maxWidth: '380px',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => {
        let Icon = Info;
        let borderColor = 'var(--accent-blue)';
        let bg = 'var(--bg-elevated)';
        let iconColor = 'var(--accent-blue)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderColor = 'var(--status-green)';
          iconColor = 'var(--status-green)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          borderColor = 'var(--status-amber)';
          iconColor = 'var(--status-amber)';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderColor = 'var(--status-red)';
          iconColor = 'var(--status-red)';
        }

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              background: bg,
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <Icon size={18} color={iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
