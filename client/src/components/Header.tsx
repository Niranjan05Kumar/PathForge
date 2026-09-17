import React from 'react';
import brandLogo from '../assets/brand-logo.svg';

export interface HeaderProps {
  onClearGraph: () => void;
  onGenerateRandomGraph: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  onClearGraph,
  onGenerateRandomGraph,
}) => {
  return (
    <header
      className="workbench-header"
      style={{
        height: '48px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-surface)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        zIndex: 20,
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img
          src={brandLogo}
          alt="PathForge Brand Logo"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-sm)',
            display: 'block',
            flexShrink: 0,
          }}
        />
        <div className="brand-text">
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            PathForge
          </div>
        </div>
      </div>

      {/* Right: Canvas Actions (Clear Canvas & Generate Random Graph) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onClearGraph}
          className="btn-ghost"
          style={{ height: '26px', fontSize: '11px', padding: '0 8px', border: '1px solid var(--border)' }}
          title="Clear canvas nodes and edges"
        >
          Clear Canvas
        </button>

        <button
          type="button"
          onClick={onGenerateRandomGraph}
          className="btn-secondary"
          style={{
            height: '26px',
            fontSize: '11px',
            padding: '0 10px',
            color: 'var(--accent-primary)',
            borderColor: 'var(--accent-muted)',
          }}
          title="generate a new valid random graph"
        >
          Generate Graph
        </button>
      </div>
    </header>
  );
});
