import React from 'react';

/**
 * Cache Activity Line/Area Trend Chart
 * Visualizes Hits, Misses, and Operations over the last 60 minutes
 */
export const ActivityChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const width = 680;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.hits, d.gets, d.sets, d.misses))) * 1.15 || 200;

  const getX = (index) => padding.left + (index / (data.length - 1)) * chartW;
  const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

  const generatePath = (key) => {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`)
      .join(' ');
  };

  const generateArea = (key) => {
    const linePath = generatePath(key);
    const bottomY = padding.top + chartH;
    return `${linePath} L ${getX(data.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
      >
        <defs>
          <linearGradient id="hitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--status-green)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--status-green)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="missGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--status-red)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--status-red)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartH * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartW}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={generateArea('hits')} fill="url(#hitGradient)" />
        <path d={generateArea('misses')} fill="url(#missGradient)" />

        {/* Lines */}
        {/* Hits Line */}
        <path
          d={generatePath('hits')}
          fill="none"
          stroke="var(--status-green)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Gets Line */}
        <path
          d={generatePath('gets')}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />

        {/* Sets Line */}
        <path
          d={generatePath('sets')}
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="1.8"
        />

        {/* Misses Line */}
        <path
          d={generatePath('misses')}
          fill="none"
          stroke="var(--status-red)"
          strokeWidth="2"
          strokeDasharray="4 2"
        />

        {/* Data points for hits */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.hits)}
            r="3.5"
            fill="var(--status-green)"
            stroke="var(--bg-secondary)"
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % 2 === 0 || i === data.length - 1) {
            return (
              <text
                key={i}
                x={getX(i)}
                y={padding.top + chartH + 18}
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {d.time}
              </text>
            );
          }
          return null;
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: '8px',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-green)', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }}></span>
          <span>Hits (Solid Green)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 6px rgba(99, 102, 241, 0.4)' }}></span>
          <span>GETs (Dashed Indigo)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }}></span>
          <span>SETs (Solid Cyan)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-red)' }}></span>
          <span>Misses (Dashed Red)</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Donut chart visualizing Hit Rate % vs Miss Rate %
 */
export const HitRateDonut = ({ hitRate = 85.0, hits = 1842, misses = 326 }) => {
  const size = 150;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const validRate = Math.min(100, Math.max(0, hitRate));
  const strokeDashoffset = circumference - (validRate / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle (Misses / Capacity) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          {/* Foreground circle (Hits) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--status-green)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }}
          />
        </svg>

        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {validRate.toFixed(1)}%
          </span>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hit Ratio
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-green)', boxShadow: '0 0 6px var(--status-green)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Cache Hits:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-green)' }}>
              {hits.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-red)', boxShadow: '0 0 6px var(--status-red)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Cache Misses:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-red)' }}>
              {misses.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
          Total Access: {(hits + misses).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
