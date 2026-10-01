import React from 'react';
import { formatTTLRemaining } from '../utils/formatters';

export const TTLVisualizer = ({ expiresAt }) => {
  const info = formatTTLRemaining(expiresAt);

  if (expiresAt === 0 || !expiresAt) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
          PERSISTENT (NO TTL)
        </span>
      </div>
    );
  }

  if (info.isExpired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
          EXPIRED
        </span>
      </div>
    );
  }

  let barColor = 'var(--text-primary)';
  if (info.percent < 25) {
    barColor = 'var(--text-muted)';
  } else if (info.percent < 55) {
    barColor = 'var(--text-secondary)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: barColor, fontWeight: 600 }}>{info.text}</span>
        <span style={{ color: 'var(--text-muted)' }}>{Math.round(info.percent)}%</span>
      </div>
      <div style={{
        height: '4px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          height: '100%',
          width: `${info.percent}%`,
          backgroundColor: barColor,
          transition: 'width 1s linear'
        }} />
      </div>
    </div>
  );
};
