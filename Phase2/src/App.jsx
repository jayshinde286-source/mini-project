import React, { useState, useEffect } from 'react';
import { CacheProvider } from './context/CacheContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import { CacheOperationModal } from './components/CacheOperationModal';
import { GetKeyModal } from './components/GetKeyModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { BenchmarkRunnerModal } from './components/BenchmarkRunnerModal';

import { Dashboard } from './pages/Dashboard';
import { CachePage } from './pages/CachePage';
import { EventsPage } from './pages/EventsPage';
import { PersistencePage } from './pages/PersistencePage';
import { RecoveryPage } from './pages/RecoveryPage';
import { MetricsPage } from './pages/MetricsPage';
import { AuditPage } from './pages/AuditPage';
import { ClusterPage } from './pages/ClusterPage';

export const MainDashboardApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [isGetModalOpen, setIsGetModalOpen] = useState(false);
  const [selectedKeyForGet, setSelectedKeyForGet] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedKeyForDelete, setSelectedKeyForDelete] = useState('');
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  const handleOpenGetModal = (key = '') => {
    setSelectedKeyForGet(key);
    setIsGetModalOpen(true);
  };

  const handleOpenDeleteModal = (key = '') => {
    setSelectedKeyForDelete(key);
    setIsDeleteModalOpen(true);
  };

  // Global Keyboard Shortcuts (1-7, ?, Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is actively typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '1') {
        setActiveTab('dashboard');
      } else if (e.key === '2') {
        setActiveTab('cache');
      } else if (e.key === '3') {
        setActiveTab('events');
      } else if (e.key === '4') {
        setActiveTab('persistence');
      } else if (e.key === '5') {
        setActiveTab('recovery');
      } else if (e.key === '6') {
        setActiveTab('metrics');
      } else if (e.key === '7') {
        setActiveTab('audit');
      } else if (e.key === '8') {
        setActiveTab('cluster');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Shell */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Topbar
          onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        />

        {/* Scrollable Main Content Area */}
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenSetModal={() => setIsSetModalOpen(true)}
              onOpenGetModal={() => handleOpenGetModal()}
            />
          )}

          {activeTab === 'cache' && (
            <CachePage
              onOpenSetModal={() => setIsSetModalOpen(true)}
              onOpenGetModal={(k) => handleOpenGetModal(k)}
              onOpenDeleteModal={(k) => handleOpenDeleteModal(k)}
            />
          )}

          {activeTab === 'events' && <EventsPage />}

          {activeTab === 'persistence' && <PersistencePage />}

          {activeTab === 'recovery' && <RecoveryPage />}

          {activeTab === 'cluster' && <ClusterPage />}

          {activeTab === 'metrics' && <MetricsPage />}

          {activeTab === 'audit' && <AuditPage />}
        </main>
      </div>

      {/* Interactive Global Modals */}
      <CacheOperationModal
        isOpen={isSetModalOpen}
        onClose={() => setIsSetModalOpen(false)}
      />

      <GetKeyModal
        isOpen={isGetModalOpen}
        onClose={() => setIsGetModalOpen(false)}
        initialKey={selectedKeyForGet}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entryKey={selectedKeyForDelete}
      />

      {/* Quick Command Palette (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenSetModal={() => setIsSetModalOpen(true)}
        onOpenGetModal={() => handleOpenGetModal()}
      />

      {/* Keyboard Shortcuts Cheat Sheet (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Live Concurrency & Latency Benchmark Runner */}
      <BenchmarkRunnerModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      {/* Global Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <CacheProvider>
      <MainDashboardApp />
    </CacheProvider>
  );
}
