import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle,
  Play,
  ArrowRight,
  Database,
  Radio,
  HardDrive,
  RotateCcw,
  BarChart3,
  X
} from 'lucide-react';
import { useCache } from '../context/CacheContext';

export const ProfessorDemoModal = ({ isOpen, onClose, setActiveTab, onOpenSetModal, onOpenGetModal }) => {
  const { setEntry, getEntry, deleteEntry, simulateTTLExpiry, startRecovery } = useCache();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  if (!isOpen) return null;

  const markStepDone = (stepNum) => {
    if (!completedSteps.includes(stepNum)) {
      setCompletedSteps((prev) => [...prev, stepNum]);
    }
  };

  const steps = [
    {
      step: 1,
      title: 'Step 1: Dashboard Overview',
      tab: 'dashboard',
      actionText: 'View Dashboard',
      description: 'Show health indicators, key metrics (Hits, Misses, WAL Records, Hit Rate), and recent events feed.',
      handler: () => {
        setActiveTab('dashboard');
        markStepDone(1);
      }
    },
    {
      step: 2,
      title: 'Step 2: SET Cache Entry',
      tab: 'cache',
      actionText: 'SET (student:jay = CSE_B3)',
      description: 'Insert key "student:jay" with value "CSE_B3" and TTL 60 seconds. Entry is written to exclusive WAL and memory store.',
      handler: async () => {
        setActiveTab('cache');
        await setEntry('student:jay', 'CSE_B3', 60, 'seconds');
        markStepDone(2);
      }
    },
    {
      step: 3,
      title: 'Step 3: GET Lookup (Cache Hit)',
      tab: 'cache',
      actionText: 'GET (student:jay) -> HIT',
      description: 'Query "student:jay". Returns CACHE HIT modal with value, TTL countdown, and incremented access count.',
      handler: async () => {
        setActiveTab('cache');
        await getEntry('student:jay');
        markStepDone(3);
      }
    },
    {
      step: 4,
      title: 'Step 4: GET Lookup (Cache Miss)',
      tab: 'cache',
      actionText: 'GET (student:unknown) -> MISS',
      description: 'Query an unregistered key "student:unknown". Returns CACHE MISS alert and increments miss counter.',
      handler: async () => {
        setActiveTab('cache');
        await getEntry('student:unknown');
        markStepDone(4);
      }
    },
    {
      step: 5,
      title: 'Step 5: DELETE Entry (Tombstone WAL)',
      tab: 'cache',
      actionText: 'DELETE (student:jay)',
      description: 'Deletes "student:jay". Emits CACHE_DELETE event, commits WAL tombstone record, and removes entry from index.',
      handler: async () => {
        setActiveTab('cache');
        await deleteEntry('student:jay');
        markStepDone(5);
      }
    },
    {
      step: 6,
      title: 'Step 6: Simulate TTL Expiry',
      tab: 'cache',
      actionText: 'Trigger TTL Expiry',
      description: 'Simulates active reaper thread purging an entry that reached its expiration epoch (TTL_EXPIRED event emitted).',
      handler: () => {
        setActiveTab('cache');
        simulateTTLExpiry();
        markStepDone(6);
      }
    },
    {
      step: 7,
      title: 'Step 7: Event Bus Stream',
      tab: 'events',
      actionText: 'Inspect Event Stream',
      description: 'Examine all published events (CACHE_SET, CACHE_HIT, CACHE_MISS, CACHE_DELETE, TTL_EXPIRED) with timestamps and transaction IDs.',
      handler: () => {
        setActiveTab('events');
        markStepDone(7);
      }
    },
    {
      step: 8,
      title: 'Step 8: Persistence & WAL Integrity',
      tab: 'persistence',
      actionText: 'Inspect WAL & Snapshots',
      description: 'Review V2 Write-Ahead Log records with sequence numbers, operations, and CRC32 hex checksum verification.',
      handler: () => {
        setActiveTab('persistence');
        markStepDone(8);
      }
    },
    {
      step: 9,
      title: 'Step 9: 7-Step Crash Recovery',
      tab: 'recovery',
      actionText: 'Start Crash Recovery',
      description: 'Run the complete 7-step recovery pipeline: Load Snapshot -> Validate CRC -> Read WAL -> Replay -> Restore Cache.',
      handler: async () => {
        setActiveTab('recovery');
        await startRecovery();
        markStepDone(9);
      }
    },
    {
      step: 10,
      title: 'Step 10: Metrics & Performance Audit',
      tab: 'metrics',
      actionText: 'Inspect Cache Metrics',
      description: 'Demonstrate calculated Hit Rate (85%), response times (~1.8ms), evictions, and operations history graphs.',
      handler: () => {
        setActiveTab('metrics');
        markStepDone(10);
      }
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <GraduationCap size={20} color="var(--accent-blue)" />
            Professor Evaluation Flow (10-Step Viva Guide)
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            This interactive guide automates the 10 demonstration steps recommended for your faculty viva with <strong>Prof. Suhas Kakade</strong>. You can click <em>"Execute Step"</em> on each item sequentially.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((st) => {
              const isDone = completedSteps.includes(st.step);
              return (
                <div
                  key={st.step}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: `1px solid ${isDone ? 'var(--status-green-border)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isDone ? 'var(--status-green-bg)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isDone ? 'var(--status-green)' : 'var(--border-default)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDone ? 'var(--status-green)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {isDone ? '✓' : st.step}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {st.description}
                      </div>
                    </div>
                  </div>

                  <button
                    id={`viva-exec-step-${st.step}`}
                    className={`btn btn-sm ${isDone ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => {
                      st.handler();
                      onClose();
                    }}
                    style={{ flexShrink: 0, minWidth: '150px' }}
                  >
                    <Play size={12} fill="currentColor" />
                    <span>{st.actionText}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 'auto' }}>
            Completed: {completedSteps.length} of 10 steps
          </div>
          <button className="btn btn-outline" onClick={() => setCompletedSteps([])}>
            Reset Progress
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
