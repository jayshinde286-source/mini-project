import React, { useState, useEffect } from 'react';
import { GitCommit, ArrowRight, Zap, RefreshCw, Layers, ShieldCheck, Flame, Trash2 } from 'lucide-react';
import { useCache } from '../context/CacheContext';

/**
 * Interactive O(1) Doubly-Linked List Physical Chain Visualizer
 * Renders the exact in-memory node order from HEAD sentinel (MRU) to TAIL sentinel (LRU).
 */
export const LruChainVisualizer = () => {
  const { isBackendConnected, getEntry, deleteEntry, addToast } = useCache();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  const BACKEND_URL = (typeof window !== 'undefined' && window.__SPIT_BACKEND_URL__) || 'http://localhost:8080';

  const fetchDllNodes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/engine/dll`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nodes)) {
          setNodes(data.nodes);
        }
      }
    } catch (e) {
      console.warn('Could not fetch DLL chain:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDllNodes();
    const interval = setInterval(fetchDllNodes, 4000);
    return () => clearInterval(interval);
  }, [isBackendConnected]);

  const handleTouchNode = async (key) => {
    setActiveKey(key);
    addToast('O(1) Access Triggered', `Key '${key}' spliced and moved to HEAD (MRU)`, 'info');
    await getEntry(key);
    setTimeout(async () => {
      await fetchDllNodes();
      setActiveKey(null);
    }, 350);
  };

  const handleEvictTail = async () => {
    if (nodes.length === 0) return;
    const lruNode = nodes[nodes.length - 1];
    addToast('LRU Tail Eviction', `Victim key '${lruNode.key}' unlinked from TAIL.prev`, 'warning');
    await deleteEntry(lruNode.key);
    await fetchDllNodes();
  };

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <GitCommit size={18} color="var(--accent-indigo)" />
            <span>O(1) LRU Doubly-Linked List Physical Memory Chain</span>
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
              LIVE POINTER VIEW
            </span>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Real-time physical node layout: Reads/writes splice to <strong>HEAD (MRU)</strong>; overflow purges at <strong>TAIL (LRU)</strong> in strict O(1) time.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchDllNodes}
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 10px', fontSize: '0.725rem' }}
            title="Refresh linked list pointers"
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            <span>Sync Pointers</span>
          </button>

          <button
            onClick={handleEvictTail}
            disabled={nodes.length === 0}
            className="btn btn-outline btn-sm"
            style={{
              padding: '4px 10px',
              fontSize: '0.725rem',
              color: 'var(--status-red)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)'
            }}
            title="Manually purge the oldest LRU node preceding TAIL"
          >
            <Trash2 size={12} />
            <span>Evict LRU Tail</span>
          </button>
        </div>
      </div>

      {/* Linked List Chain Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '16px 8px',
        backgroundColor: 'rgba(10, 15, 29, 0.7)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        scrollbarWidth: 'thin'
      }}>
        {/* HEAD Sentinel Node */}
        <div style={{
          flexShrink: 0,
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--status-green)', letterSpacing: '0.05em' }}>
            HEAD SENTINEL
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
            MRU End
          </div>
          <span className="badge badge-green" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
            head.next →
          </span>
        </div>

        <div style={{ color: 'var(--accent-indigo)', fontWeight: 800, flexShrink: 0 }}>⇄</div>

        {/* Dynamic In-Memory Nodes */}
        {nodes.length === 0 ? (
          <div style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Engine empty. Insert a key using "+ SET Entry" to attach node to HEAD.
          </div>
        ) : (
          nodes.map((node, index) => {
            const isMru = index === 0;
            const isLru = index === nodes.length - 1;
            const isFlashing = activeKey === node.key;

            return (
              <React.Fragment key={node.key}>
                <div
                  style={{
                    flexShrink: 0,
                    minWidth: '170px',
                    maxWidth: '210px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isFlashing ? 'rgba(99, 102, 241, 0.35)' : (isMru ? 'rgba(99, 102, 241, 0.12)' : (isLru ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)')),
                    border: `1px solid ${isFlashing ? 'var(--accent-primary)' : (isMru ? 'rgba(99, 102, 241, 0.4)' : (isLru ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-subtle)'))}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.25s ease',
                    boxShadow: isMru ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
                    transform: isFlashing ? 'scale(1.04)' : 'scale(1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: isMru ? 'var(--accent-cyan)' : (isLru ? 'var(--status-red)' : 'var(--text-muted)')
                    }}>
                      {isMru ? '★ MOST RECENT' : (isLru ? '⚠️ NEXT EVICTION' : `#${index + 1}`)}
                    </span>
                    <span className="badge badge-gray" style={{ fontSize: '0.625rem' }}>
                      {node.accessCount}x hits
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={node.key}>
                    {node.key}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                      {node.expiresAt > 0 ? (node.expired ? 'EXPIRED' : `${Math.max(1, Math.round((node.expiresAt - Date.now()) / 1000))}s TTL`) : 'PERSISTENT'}
                    </span>
                    <button
                      onClick={() => handleTouchNode(node.key)}
                      className="btn btn-outline btn-sm"
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.65rem',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="Simulate lookup to splice node back to HEAD"
                    >
                      <Zap size={10} color="var(--accent-indigo)" />
                      <span>Touch</span>
                    </button>
                  </div>
                </div>

                <div style={{ color: 'var(--border-default)', fontWeight: 800, flexShrink: 0 }}>⇄</div>
              </React.Fragment>
            );
          })
        )}

        {/* TAIL Sentinel Node */}
        <div style={{
          flexShrink: 0,
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--status-red)', letterSpacing: '0.05em' }}>
            TAIL SENTINEL
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
            LRU End
          </div>
          <span className="badge badge-red" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
            ← tail.prev
          </span>
        </div>
      </div>

      {/* Theoretical Mechanical Note */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.725rem',
        color: 'var(--text-secondary)',
        padding: '6px 10px',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        borderRadius: 'var(--radius-sm)',
        border: '1px dashed rgba(99, 102, 241, 0.2)'
      }}>
        <span>
          💡 <strong>Algorithm Design:</strong> O(1) DLL splicing requires 4 pointer updates: <code>node.prev.next = node.next; node.next.prev = node.prev; node.next = head.next; head.next = node;</code>
        </span>
        <span style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>
          Strict O(1) Guarantee
        </span>
      </div>
    </div>
  );
};
