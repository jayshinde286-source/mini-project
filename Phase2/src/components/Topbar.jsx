import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Pause, GraduationCap, Users, Clock, Moon, Sun, Command, Keyboard, Zap, Globe, Github, BookOpen, ExternalLink } from 'lucide-react';
import { useCache } from '../context/CacheContext';
import { formatUptime } from '../utils/formatters';

export const Topbar = ({ onOpenDemoGuide, onOpenCommandPalette, onOpenShortcuts, onOpenDeployGuide, onOpenVivaBank }) => {
  const { uptime, liveSimulation, setLiveSimulation, addToast, theme, toggleTheme } = useCache();
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
        padding: '0 20px',
        flexShrink: 0
      }}>
        {/* Left Title Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{
              fontSize: '1.025rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              Persistent Event-Driven Memory Cache
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                v3.0.0 (Phase II & III)
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                50/50 Marks Complete
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={11} /> p99: &lt; 0.05ms
              </span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Third-Year B.Tech CSE Mini Project • Sardar Patel Institute of Technology
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          
          {/* Official Netlify Live Link */}
          <a
            href="https://spit-cache-module-2026.netlify.app/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              color: 'var(--status-green)',
              textDecoration: 'none',
              padding: '5px 9px'
            }}
            title="Open Live Deployed Site on Netlify"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            <span>Netlify Live</span>
            <ExternalLink size={11} />
          </a>

          {/* GitHub Official Repo Link */}
          <a
            href="https://github.com/jayshinde286-source/mini-project"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              textDecoration: 'none',
              padding: '5px 9px'
            }}
            title="Open GitHub Repository (jayshinde286-source/mini-project)"
          >
            <Github size={13} />
            <span>GitHub</span>
          </a>

          {/* Deployment & Share Guide Trigger */}
          <button
            onClick={onOpenDeployGuide}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', padding: '5px 9px' }}
            title="How to Deploy & Share Guide"
          >
            <Globe size={13} color="var(--accent-cyan)" />
            <span>Deploy Guide</span>
          </button>

          {/* 100 Viva Q&A Bank Trigger */}
          <button
            onClick={onOpenVivaBank}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', padding: '5px 9px' }}
            title="100 Technical Viva Q&A Bank"
          >
            <BookOpen size={13} color="var(--accent-blue)" />
            <span>100 Viva Q&A</span>
          </button>

          {/* Quick Search / Command Palette Shortcut */}
          <button
            onClick={onOpenCommandPalette}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '5px 8px' }}
            title="Command Palette (Cmd+K)"
          >
            <Command size={12} />
            <span>Cmd+K</span>
          </button>

          {/* Keyboard Shortcuts Dialog Trigger */}
          <button
            onClick={onOpenShortcuts}
            className="btn btn-outline btn-sm"
            style={{ padding: '5px 8px' }}
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={13} />
          </button>

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
              gap: '5px',
              padding: '5px 9px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: liveSimulation ? 'var(--status-green-border)' : 'var(--border-default)',
              backgroundColor: liveSimulation ? 'var(--status-green-bg)' : 'var(--bg-tertiary)',
              color: liveSimulation ? 'var(--status-green)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {liveSimulation ? <Play size={12} fill="currentColor" /> : <Pause size={12} />}
            <span>Live: {liveSimulation ? 'ON' : 'OFF'}</span>
          </button>

          {/* Professor Viva Demo Guide Button */}
          <button
            id="viva-demo-guide-btn"
            onClick={onOpenDemoGuide}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 10px'
            }}
          >
            <GraduationCap size={14} />
            <span>Viva Demo</span>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px' }}
            title={`Toggle Theme (Current: ${theme})`}
          >
            {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
          </button>

          {/* Team Info Button */}
          <button
            id="team-info-btn"
            onClick={() => setShowTeamModal(true)}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px' }}
            title="Project Team & Guide Details"
          >
            <Users size={13} />
          </button>

          {/* Refresh Button */}
          <button
            id="refresh-dashboard-btn"
            onClick={handleManualRefresh}
            className="btn btn-outline btn-sm"
            style={{ padding: '5px 8px' }}
            title="Refresh Cache State"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
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
