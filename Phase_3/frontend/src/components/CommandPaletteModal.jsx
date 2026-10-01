import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Database,
  Radio,
  HardDrive,
  RotateCcw,
  BarChart3,
  FileText,
  Plus,
  Play,
  Sun,
  Moon,
  Camera,
  X
} from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const CommandPaletteModal = ({ isOpen, onClose, onNavigate, onOpenSetModal, onOpenGetModal }) => {
  const [search, setSearch] = useState('');
  const { toggleTheme, theme, liveSimulation, setLiveSimulation, simulateSnapshot, startRecovery } = useCache();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // toggle trigger
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav-cache',
      label: 'Go to Cache Entries Table',
      category: 'Navigation',
      icon: Database,
      shortcut: 'G C',
      action: () => { onNavigate('cache'); onClose(); }
    },
    {
      id: 'nav-events',
      label: 'Go to Event Stream',
      category: 'Navigation',
      icon: Radio,
      shortcut: 'G E',
      action: () => { onNavigate('events'); onClose(); }
    },
    {
      id: 'nav-wal',
      label: 'Go to Persistence (WAL & Snapshots)',
      category: 'Navigation',
      icon: HardDrive,
      shortcut: 'G P',
      action: () => { onNavigate('persistence'); onClose(); }
    },
    {
      id: 'nav-recovery',
      label: 'Go to Recovery Diagnostics',
      category: 'Navigation',
      icon: RotateCcw,
      shortcut: 'G R',
      action: () => { onNavigate('recovery'); onClose(); }
    },
    {
      id: 'nav-metrics',
      label: 'Go to Performance Metrics & Stats',
      category: 'Navigation',
      icon: BarChart3,
      shortcut: 'G M',
      action: () => { onNavigate('metrics'); onClose(); }
    },
    {
      id: 'nav-audit',
      label: 'Go to Audit Logs',
      category: 'Navigation',
      icon: FileText,
      shortcut: 'G A',
      action: () => { onNavigate('audit'); onClose(); }
    },
    {
      id: 'op-set',
      label: 'Execute SET Cache Entry',
      category: 'Operations',
      icon: Plus,
      shortcut: 'Cmd S',
      action: () => { onClose(); onOpenSetModal(); }
    },
    {
      id: 'op-get',
      label: 'Lookup Cache Key (GET)',
      category: 'Operations',
      icon: Search,
      shortcut: 'Cmd L',
      action: () => { onClose(); onOpenGetModal(); }
    },
    {
      id: 'op-snapshot',
      label: 'Create Point-in-time Snapshot',
      category: 'Operations',
      icon: Camera,
      shortcut: 'Cmd B',
      action: () => { simulateSnapshot(); onClose(); }
    },
    {
      id: 'op-recovery',
      label: 'Trigger 7-Step Crash Recovery Pipeline',
      category: 'Operations',
      icon: RotateCcw,
      shortcut: 'Cmd R',
      action: () => { startRecovery(); onNavigate('recovery'); onClose(); }
    },
    {
      id: 'pref-theme',
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      shortcut: 'Cmd T',
      action: () => { toggleTheme(); onClose(); }
    },
    {
      id: 'pref-sim',
      label: `Toggle Live Simulator (${liveSimulation ? 'Turn OFF' : 'Turn ON'})`,
      category: 'Preferences',
      icon: Play,
      shortcut: 'Cmd U',
      action: () => { setLiveSimulation(!liveSimulation); onClose(); }
    }
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrapper">
          <Search size={18} color="var(--accent-primary)" />
          <input
            type="text"
            className="cmd-input"
            placeholder="Type a command or search (e.g., 'dashboard', 'set', 'snapshot')..."
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="cmd-list">
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No commands found matching "{search}"
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  className="cmd-item"
                  onClick={cmd.action}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={15} color="var(--accent-primary)" />
                    <span>{cmd.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: '4px' }}>
                      {cmd.category}
                    </span>
                  </div>
                  {cmd.shortcut && (
                    <span className="cmd-shortcut">{cmd.shortcut}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.725rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)'
        }}>
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span>Press <strong>ESC</strong> to close</span>
        </div>
      </div>
    </div>
  );
};
