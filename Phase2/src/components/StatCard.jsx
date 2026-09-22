import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtext, badge }) => {
  const colorMap = {
    blue: {
      bg: 'var(--accent-blue-subtle)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: 'var(--accent-blue)'
    },
    green: {
      bg: 'var(--status-green-bg)',
      border: 'var(--status-green-border)',
      text: 'var(--status-green)'
    },
    amber: {
      bg: 'var(--status-amber-bg)',
      border: 'var(--status-amber-border)',
      text: 'var(--status-amber)'
    },
    red: {
      bg: 'var(--status-red-bg)',
      border: 'var(--status-red-border)',
      text: 'var(--status-red)'
    },
    purple: {
      bg: 'var(--accent-purple-subtle)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: 'var(--accent-purple)'
    },
    cyan: {
      bg: 'var(--accent-cyan-subtle)',
      border: 'rgba(6, 182, 212, 0.3)',
      text: 'var(--accent-cyan)'
    }
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.text
          }}>
            <Icon size={15} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '-0.02em'
        }}>
          {value}
        </div>
        {badge && (
          <span className={`badge badge-${color}`} style={{ fontSize: '0.7rem' }}>
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {subtext}
        </div>
      )}
    </div>
  );
};
