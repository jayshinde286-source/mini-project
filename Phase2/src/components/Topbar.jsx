import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Pause, GraduationCap, Users, Clock, ShieldCheck } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatUptime } from '../utils/formatters';

export const Topbar = ({ onOpenDemoGuide }) => {
  const { uptime, liveSimulation, setLiveSimulation, addToast } = useCache();
  const [uptimeStr, setUptimeStr] = useState('00:00:00');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeStr(formatUptime(uptime));
    }, 1000);
    return () => clearInterval(interval);
  }, [uptime]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('Data Refreshed', 'Cache tables, WAL log, and event metrics refreshed from engine.', 'info');
    }, 500);
  };

  return (
    <>
      <header style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        {/* Left Title Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Persistent Event-Driven Memory Cache
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                v3.0.0 (Phase II)
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Third-Year B.Tech CSE Mini Project • Sardar Patel Institute of Technology
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Uptime Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={13} color="var(--accent-cyan)" />
            <span>Uptime:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
              {uptimeStr}
            </span>
          </div>

          {/* Live Simulator Switch */}
          <button
            id="toggle-live-simulation-btn"
            onClick={() => {
              const nextState = !liveSimulation;
              setLiveSimulation(nextState);
              addToast(
                nextState ? 'Live Simulator Started' : 'Live Simulator Paused',
                nextState ? 'Generating realistic background operations every 4s' : 'No automatic events running',
                nextState ? 'info' : 'warning'
              );
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: liveSimulation ? 'var(--status-green-border)' : 'var(--border-default)',
              backgroundColor: liveSimulation ? 'var(--status-green-bg)' : 'var(--bg-tertiary)',
              color: liveSimulation ? 'var(--status-green)' : 'var(--text-secondary)',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {liveSimulation ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
            <span>Live Updates: {liveSimulation ? 'ON' : 'OFF'}</span>
          </button>

          {/* Professor Viva Demo Guide Button */}
          <button
            id="viva-demo-guide-btn"
            onClick={onOpenDemoGuide}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600
            }}
          >
            <GraduationCap size={15} />
            <span>Viva Demo Flow</span>
          </button>

          {/* Team Info Button */}
          <button
            id="team-info-btn"
            onClick={() => setShowTeamModal(true)}
            className="btn btn-outline btn-sm"
            title="Project Team & Guide Details"
          >
            <Users size={14} />
            <span>Team</span>
          </button>

          {/* Refresh Button */}
          <button
            id="refresh-dashboard-btn"
            onClick={handleManualRefresh}
            className="btn btn-outline btn-sm"
            title="Refresh Cache State"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Team Details Modal */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Users size={18} color="var(--accent-blue)" />
                Project Team & Faculty Guide
              </div>
              <button className="modal-close" onClick={() => setShowTeamModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Faculty Project Guide
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  Prof. Suhas Kakade
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Department of Computer Engineering, SPIT Mumbai
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                  Student Team Members (Third Year B.Tech CSE)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Jay Shinde', uid: '2024800115', role: 'Architecture, WAL, Persistence & Engine' },
                    { name: 'Nikhil Shelar', uid: '2024800113', role: 'EventBus, TTL Management & Indexing' },
                    { name: 'Sanchit Gaikwad', uid: '2024800029', role: 'Recovery Pipeline, Metrics & Audit Streams' }
                  ].map((member, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.role}</div>
                      </div>
                      <div className="badge badge-gray" style={{ fontFamily: 'var(--font-mono)' }}>
                        UID: {member.uid}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                fontSize: '0.775rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                background: 'var(--bg-primary)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-default)'
              }}>
                <strong>Project:</strong> Persistent Event-Driven Memory Cache Module. Zero external runtime dependencies in core engine. Java 17 + exclusive WAL writer lock + CRC32 verification + React Phase II UI demonstration.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowTeamModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
