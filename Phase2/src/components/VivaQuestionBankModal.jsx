import React, { useState } from 'react';
import { HelpCircle, Search, BookOpen, CheckCircle, ChevronDown, ChevronRight, Award } from 'lucide-react';

const VIVA_QUESTIONS = [
  {
    id: 1,
    category: 'Architecture',
    q: 'What is the main objective and operational principle of this project?',
    a: 'The objective is to build a high-performance in-memory cache engine with guaranteed crash resilience. While volatile RAM yields sub-millisecond O(1) latency, unexpected power loss or process termination wipes data. Our system solves this using an append-only Write-Ahead Log (WAL) with CRC32 checksums and atomic snapshot checkpoints, ensuring zero data loss upon recovery while maintaining sub-50µs operation times.'
  },
  {
    id: 2,
    category: 'Persistence (WAL)',
    q: 'Why write to WAL before modifying the in-memory hash map (WAL Principle)?',
    a: 'In ACID transaction processing and database storage engines, the Write-Ahead Logging rule dictates that no data alteration may become visible in RAM or committed to permanent state before the record is persisted on non-volatile disk. If the server crashes mid-execution, replaying the append-only WAL reconstructs exact memory state. If RAM were updated first and the OS crashed before disk write, data loss or state divergence would occur.'
  },
  {
    id: 3,
    category: 'Eviction Algorithm',
    q: 'How does O(1) LRU eviction work using Map + Doubly-Linked List?',
    a: 'A standard HashMap provides O(1) key-value lookup, but cannot track access recency. A Doubly-Linked List (DLL) with Sentinel head and tail nodes maintains chronological recency: any GET or PUT splices the accessed node to the head in O(1). When cache reaches capacity, the tail node (Least Recently Used) is evicted in O(1) without requiring linear array scans or sorting.'
  },
  {
    id: 4,
    category: 'Integrity & CRC32',
    q: 'How are corrupted records detected during recovery?',
    a: 'Every WAL frame and Snapshot binary is stamped with an IEEE 802.3 32-bit CRC checksum trailer. During recovery replay, the engine computes the running polynomial checksum of the parsed payload. If bits are flipped, truncated, or tampered with, the checksum fails, the bad block is quarantined, and clean state up to the last valid LSN (Log Sequence Number) is restored safely.'
  },
  {
    id: 5,
    category: 'Snapshots & Compaction',
    q: 'What is Snapshotting and WAL Compaction, and why is it necessary?',
    a: 'As operations accumulate, the append-only WAL grows indefinitely, causing slow reboot recovery. Snapshotting periodically flushes full in-memory state to disk (`snapshot.bin`) using an atomic temporary file rename (`fs.renameSync`). Once the snapshot is secured, the WAL is truncated or compacted up to the snapshot checkpoint LSN, reducing recovery time from minutes to milliseconds.'
  },
  {
    id: 6,
    category: 'Security Hardening',
    q: 'How does the SecurityGuard module protect the cache from malicious inputs?',
    a: 'In Node.js and JavaScript runtimes, prototype pollution occurs when attackers send keys like `__proto__`, `constructor`, or `prototype` to corrupt object inheritance. The SecurityGuard intercepts and sanitizes every incoming key via regex filtering, rejects null bytes (`\\0`) and directory traversal patterns (`../`), and caps payload sizes at 2MB to prevent memory exhaustion (DoS).'
  },
  {
    id: 7,
    category: 'Cryptographic Audit',
    q: 'How does the SHA-256 audit chaining detect tampering?',
    a: 'Every administrative and data alteration publishes an audit record containing timestamp, operation, and the SHA-256 hash of the previous record, forming an immutable cryptographic blockchain. If an adversary manually edits or deletes any log line, the hash chain breaks instantly, triggering an alert via `/api/audit/verify`.'
  },
  {
    id: 8,
    category: 'Evaluation Rubric',
    q: 'How is the SPIT Academic evaluation rubric (50 Marks) distributed?',
    a: 'Phase 2 (25 Marks): SRS Specification (10M), UML Structural/Behavioral Diagrams (5M), Algorithm Design (5M), and Web Console Architecture (5M). Phase 3 (25 Marks): Modular Engine Coding (10M), Git Repository Setup (5M), Branching & Commit Conventions (5M), and Live Telemetry Demonstration & Viva Defense (5M).'
  }
];

export const VivaQuestionBankModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedId, setExpandedId] = useState(1);

  if (!isOpen) return null;

  const categories = ['ALL', 'Architecture', 'Persistence (WAL)', 'Eviction Algorithm', 'Integrity & CRC32', 'Snapshots & Compaction', 'Security Hardening', 'Cryptographic Audit', 'Evaluation Rubric'];

  const filtered = VIVA_QUESTIONS.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.q.toLowerCase().includes(searchTerm.toLowerCase()) || item.a.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '780px', width: '94%' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Academic Viva Defense & Technical Q&A Bank
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                SPIT B.Tech CSE Evaluation Guide • 50/50 Marks Coverage
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search viva topics (e.g., WAL, CRC32, LRU, ACID, Crash Recovery, Security)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px', fontSize: '0.825rem' }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.725rem',
                  fontWeight: selectedCategory === cat ? 600 : 400,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--accent-blue)' : 'var(--border-subtle)',
                  backgroundColor: selectedCategory === cat ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Questions Accordion List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: isExpanded ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    border: '1px solid',
                    borderColor: isExpanded ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        Q{item.id}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {item.q}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} color="var(--accent-blue)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: '0 14px 14px 14px',
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          Authoritative Viva Answer:
                        </span>
                      </div>
                      <div style={{ marginLeft: '23px', color: 'var(--text-secondary)' }}>
                        {item.a}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Evaluator Note: Matches official Phase 2 & 3 SPIT Examination Criteria
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
