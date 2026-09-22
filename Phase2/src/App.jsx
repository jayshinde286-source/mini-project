import React, { useState } from 'react';
import { CacheProvider } from './context/CacheContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import { CacheOperationModal } from './components/CacheOperationModal';
import { GetKeyModal } from './components/GetKeyModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProfessorDemoModal } from './components/ProfessorDemoModal';

import { Dashboard } from './pages/Dashboard';
import { CachePage } from './pages/CachePage';
import { EventsPage } from './pages/EventsPage';
import { PersistencePage } from './pages/PersistencePage';
import { RecoveryPage } from './pages/RecoveryPage';
import { MetricsPage } from './pages/MetricsPage';
import { AuditPage } from './pages/AuditPage';

export const MainDashboardApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [isGetModalOpen, setIsGetModalOpen] = useState(false);
  const [selectedKeyForGet, setSelectedKeyForGet] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedKeyForDelete, setSelectedKeyForDelete] = useState('');
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  const handleOpenGetModal = (key = '') => {
    setSelectedKeyForGet(key);
    setIsGetModalOpen(true);
  };

  const handleOpenDeleteModal = (key = '') => {
    setSelectedKeyForDelete(key);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Shell */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Topbar onOpenDemoGuide={() => setIsDemoGuideOpen(true)} />

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

      <ProfessorDemoModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        setActiveTab={setActiveTab}
        onOpenSetModal={() => setIsSetModalOpen(true)}
        onOpenGetModal={() => handleOpenGetModal()}
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
