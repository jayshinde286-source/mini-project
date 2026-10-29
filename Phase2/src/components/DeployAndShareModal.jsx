import React, { useState } from 'react';
import { Globe, Github, Copy, Check, ExternalLink, ShieldCheck, Terminal, Award, Server } from 'lucide-react';

export const DeployAndShareModal = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const NETLIFY_URL = 'https://spit-cache-module-2026.netlify.app/';
  const GITHUB_URL = 'https://github.com/jayshinde286-source/mini-project';
  const CLONE_CMD = 'git clone https://github.com/jayshinde286-source/mini-project.git';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '92%' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Globe size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Public Website & Deployment Guide
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                SPIT B.Tech CSE Mini Project • Live Worldwide Access
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* Primary Live Production URL Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                Official Production Website
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hosted on Netlify Edge</span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              wordBreak: 'break-all',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              {NETLIFY_URL}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={NETLIFY_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                <span>Open Live Website</span>
              </a>
              <button
                onClick={() => copyToClipboard(NETLIFY_URL, 'netlify')}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedField === 'netlify' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedField === 'netlify' ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* GitHub Repository Card */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Github size={12} />
                Official Source Code Repository
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GitHub • Public</span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              {GITHUB_URL}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Github size={14} />
                <span>View on GitHub</span>
              </a>
              <button
                onClick={() => copyToClipboard(CLONE_CMD, 'clone')}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedField === 'clone' ? <Check size={14} color="#10b981" /> : <Terminal size={14} />}
                <span>{copiedField === 'clone' ? 'Copied Clone Command!' : 'Copy Clone Command'}</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Deployment Instructions */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Server size={16} color="var(--accent-blue)" />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                How This Project Website is Deployed
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="badge badge-cyan" style={{ minWidth: '22px', textAlign: 'center', padding: '2px 6px' }}>1</span>
                <div>
                  <strong>Option A: Netlify Continuous Deployment (Git-Integrated)</strong>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    Netlify is linked to GitHub repository <code>jayshinde286-source/mini-project</code>. Every time a commit is pushed to <code>main</code>, Netlify automatically builds <code>Phase2</code> and deploys to the global edge network.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="badge badge-cyan" style={{ minWidth: '22px', textAlign: 'center', padding: '2px 6px' }}>2</span>
                <div>
                  <strong>Option B: Netlify Drop (Instant Drag-and-Drop)</strong>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    Open <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>app.netlify.com/drop</a> in your browser. Drag the <code>Phase2/dist</code> folder directly into the browser to deploy instantaneously without git.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="badge badge-cyan" style={{ minWidth: '22px', textAlign: 'center', padding: '2px 6px' }}>3</span>
                <div>
                  <strong>Option C: Local Enterprise Demonstration</strong>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                    Run <code>node Phase_3/backend/src/server.js</code> for backend REST/SSE gateway on port 8080, and run <code>python3 -m http.server 3000 --directory Phase2/dist</code> for frontend.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Rubric & Viva Certification */}
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} color="#f59e0b" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Academic Assessment & Evaluation (50/50 Marks)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Phase 2 (Architecture: 25M) + Phase 3 (Implementation: 25M)
                </div>
              </div>
            </div>
            <div className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              100% Complete
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sardar Patel Institute of Technology • Guide: Prof. Suhas Kakade
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
