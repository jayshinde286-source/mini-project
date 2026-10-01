import React from 'react';
import { useCache } from '../context/CacheContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toasts, removeToast, theme } = useCache();

  if (!toasts || toasts.length === 0) return null;

  const isDark = theme === 'dark';

  return (
    <div style={{
      position: 'fixed',
      top: '76px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 100000,
      maxWidth: '400px',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => {
        let Icon = Info;
        let accentColor = '#3b82f6';
        let bgTint = isDark ? 'rgba(59, 130, 246, 0.08)' : '#ffffff';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          accentColor = '#10b981';
          bgTint = isDark ? 'rgba(16, 185, 129, 0.08)' : '#ffffff';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          accentColor = '#f59e0b';
          bgTint = isDark ? 'rgba(245, 158, 11, 0.08)' : '#ffffff';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          accentColor = '#ef4444';
          bgTint = isDark ? 'rgba(239, 68, 68, 0.08)' : '#ffffff';
        }

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderLeft: `4px solid ${accentColor}`,
              borderRadius: '8px',
              boxShadow: isDark
                ? '0 12px 28px -4px rgba(0, 0, 0, 0.65), 0 4px 10px rgba(0, 0, 0, 0.4)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 6px 12px -3px rgba(0, 0, 0, 0.06)',
              animation: 'fadeIn 0.2s ease-out',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: `${accentColor}18`,
              flexShrink: 0,
              marginTop: '1px'
            }}>
              <Icon size={16} color={accentColor} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isDark ? '#f8fafc' : '#0f172a',
                lineHeight: 1.3
              }}>
                {toast.title}
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: isDark ? '#cbd5e1' : '#475569',
                marginTop: '3px',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isDark ? '#94a3b8' : '#64748b',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.15s',
                marginTop: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
