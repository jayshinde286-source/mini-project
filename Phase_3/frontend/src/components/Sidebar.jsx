import React from 'react';
import {
  LayoutDashboard,
  Database,
  Radio,
  HardDrive,
  RotateCcw,
  BarChart3,
  FileText,
  ShieldCheck,
  Server
} from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { metrics, walRecords } = useCache();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cache', label: 'Cache Entries', icon: Database, badge: metrics.totalEntries },
    { id: 'events', label: 'Event Stream', icon: Radio, badge: metrics.activeEvents },
    { id: 'persistence', label: 'Persistence (WAL)', icon: HardDrive, badge: walRecords.length },
    { id: 'recovery', label: 'Recovery', icon: RotateCcw },
    { id: 'metrics', label: 'Metrics & Stats', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: FileText }
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-primary-subtle)',
          border: '1px solid var(--accent-primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.25)'
        }}>
          <Server size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            SPIT Cache Module
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Enterprise Architecture
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 10px 8px'
        }}>
          Core Navigation
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    background: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '1px 7px',
                      borderRadius: 'var(--radius-full)',
                      background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            System Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-dot green"></span>
            <span style={{ fontSize: '0.725rem', color: 'var(--status-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              Online
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          fontSize: '0.725rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Engine:</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Java 17 / InMemory</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>WAL State:</span>
            <span style={{ color: 'var(--status-green)', fontFamily: 'var(--font-mono)' }}>Exclusive Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
