import React from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Percent,
  Layers,
  Clock,
  HardDrive,
  Radio,
  Activity,
  ShieldCheck,
  Server,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { StatCard } from '../components/StatCard';
import { DemoControls } from '../components/DemoControls';
import { ActivityChart, HitRateDonut } from '../components/Charts';
import { MemoryProfilerCard } from '../components/MemoryProfilerCard';
import { HotKeysWidget } from '../components/HotKeysWidget';
import { LruChainVisualizer } from '../components/LruChainVisualizer';
import { LiveTrafficSurgeWidget } from '../components/LiveTrafficSurgeWidget';
import { LiveTerminalTicker } from '../components/LiveTerminalTicker';
import { formatNumber, formatPercent, formatRelativeTime } from '../utils/formatters';

export const Dashboard = ({ onNavigate, onOpenSetModal, onOpenGetModal }) => {
  const { metrics, healthStatus, events, activityHistory } = useCache();

  const healthList = [
    { name: 'Cache Engine', val: healthStatus.cacheEngine },
    { name: 'Persistence', val: healthStatus.persistence },
    { name: 'WAL', val: healthStatus.wal },
    { name: 'Snapshot', val: healthStatus.snapshot },
    { name: 'Event Bus', val: healthStatus.eventBus },
    { name: 'Recovery State', val: healthStatus.recoveryState },
    { name: 'TTL Manager', val: healthStatus.ttlManager },
    { name: 'Eviction Manager', val: healthStatus.evictionManager }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity size={22} color="var(--text-primary)" />
            Cache System Dashboard
          </h1>
          <p className="page-subtitle">
            Real-time overview of cache performance, persistence and events.
          </p>
        </div>

        <div className="actions-row">
          <button className="btn btn-primary" onClick={onOpenSetModal}>
            + SET Entry
          </button>
          <button className="btn btn-outline" onClick={onOpenGetModal}>
            GET Entry
          </button>
        </div>
      </div>

      {/* Interactive Demo Action Bar */}
      <DemoControls onOpenSetModal={onOpenSetModal} onOpenGetModal={onOpenGetModal} />

      {/* Interactive Live Traffic Surge Controller (Tatkal Load Demonstration) */}
      <LiveTrafficSurgeWidget />

      {/* 8 Metric KPI Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Entries"
          value={formatNumber(metrics.totalEntries)}
          icon={Database}
          color="blue"
          subtext="Active in-memory keys"
          badge="IN-MEMORY"
        />
        <StatCard
          title="Cache Hits"
          value={formatNumber(metrics.hits)}
          icon={CheckCircle2}
          color="green"
          subtext="Successful lookups"
          badge="+12% trend"
        />
        <StatCard
          title="Cache Misses"
          value={formatNumber(metrics.misses)}
          icon={XCircle}
          color="red"
          subtext="Key absent or expired"
        />
        <StatCard
          title="Hit Rate"
          value={formatPercent(metrics.hitRatePercent)}
          icon={Percent}
          color="green"
          subtext="Hits / Total lookups"
          badge="OPTIMAL"
        />
        <StatCard
          title="Evictions"
          value={formatNumber(metrics.evictions)}
          icon={Layers}
          color="amber"
          subtext="LRU capacity limit kicks"
          badge="LRU"
        />
        <StatCard
          title="Expired Entries"
          value={formatNumber(metrics.expirations)}
          icon={Clock}
          color="amber"
          subtext="Reaped after TTL expiration"
        />
        <StatCard
          title="WAL Records"
          value={formatNumber(metrics.walRecords)}
          icon={HardDrive}
          color="cyan"
          subtext="Committed append-only log"
          badge="V2 CRC32"
        />
        <StatCard
          title="Active Events"
          value={formatNumber(metrics.activeEvents)}
          icon={Radio}
          color="purple"
          subtext="Subscribers connected"
        />
      </div>

      {/* O(1) LRU Doubly-Linked List Physical Node Chain Visualizer */}
      <LruChainVisualizer />

      {/* Cache Health Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <ShieldCheck size={18} color="var(--text-primary)" />
              Cache Engine & Subsystem Health
            </div>
            <div className="card-description">
              Diagnostic status of runtime modules, background threads, and I/O channels
            </div>
          </div>
          <span className="badge badge-green">ALL SUBSYSTEMS HEALTHY</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px'
        }}>
          {healthList.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {item.val.desc}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot green"></span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--status-green)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {item.val.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Chart & Hit Rate Grid */}
      <div className="two-col-grid">
        {/* Activity Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <Activity size={18} color="var(--accent-primary)" />
                Cache Activity & Throughput
              </div>
              <div className="card-description">
                Real-time operational frequency: Hits, Misses, SETs, and GETs
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-blue">Live Stream</span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ActivityChart data={activityHistory} />
          </div>
        </div>

        {/* Hit vs Miss Distribution & Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <Percent size={18} color="var(--status-green)" />
                Efficiency & Hit Rate
              </div>
              <div className="card-description">
                Ratio of successful lookups against cold cache misses
              </div>
            </div>
            <span className="badge badge-green">OPTIMAL</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <HitRateDonut
              hitRate={metrics.hitRatePercent}
              hits={metrics.hits}
              misses={metrics.misses}
            />
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Average Engine Latency: <strong style={{ color: 'var(--accent-cyan)' }}>{metrics.avgResponseTimeMs > 0 ? `${metrics.avgResponseTimeMs} ms` : '< 0.05 ms'}</strong></span>
            <span>Total Requests: <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(metrics.totalRequests)}</strong></span>
          </div>
        </div>
      </div>

      {/* Advanced Telemetry: Hardware Profiler & Hot-Keys Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <MemoryProfilerCard />
        <HotKeysWidget onInspectKey={(key) => onNavigate('cache')} />
      </div>

      {/* Recent Events Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Radio size={18} color="var(--accent-purple)" />
              Recent Cache Events
            </div>
            <div className="card-description">
              Latest events dispatched by the decoupled asynchronous EventBus
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate('events')}
          >
            <span>View Full Stream</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Key</th>
                <th>Detail</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 6).map((ev) => {
                let badgeClass = 'badge-blue';
                if (ev.type === 'CACHE_HIT') badgeClass = 'badge-green';
                if (ev.type === 'CACHE_MISS') badgeClass = 'badge-red';
                if (ev.type === 'TTL_EXPIRED' || ev.type === 'CACHE_EVICTED') badgeClass = 'badge-amber';
                if (ev.type === 'CACHE_SET') badgeClass = 'badge-blue';

                return (
                  <tr key={ev.eventId}>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {ev.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ev.key}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {ev.detail}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(ev.timestamp)}
                    </td>
                    <td>
                      <span className={`badge ${ev.status === 'SUCCESS' ? 'badge-green' : ev.status === 'MISS' ? 'badge-red' : 'badge-amber'}`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Live Telemetry Terminal Strip */}
      <LiveTerminalTicker />
    </div>
  );
};
