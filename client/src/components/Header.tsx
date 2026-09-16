import React from 'react';

export interface HeaderProps {
  activeTab: 'telemetry' | 'comparison' | 'trace' | 'system';
  onTabChange: (tab: 'telemetry' | 'comparison' | 'trace' | 'system') => void;
  stepCount: number;
  onClearGraph: () => void;
  onImportClick: () => void;
  onExportGraph: () => void;
  onExportExperiment: () => void;
  hasResult: boolean;
  hasNodes: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeTab,
  onTabChange,
  stepCount,
  onClearGraph,
  onImportClick,
  onExportGraph,
  onExportExperiment,
  hasResult,
  hasNodes,
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
      {/* Left: Brand + Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Brand Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-subtle)',
              border: '1px solid var(--accent-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            PF
          </div>
          <div className="brand-text">
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              PathForge
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Interactive Graph Pathfinding &amp; Optimization Engine
            </div>
          </div>
        </div>

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border)' }} />

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '2px' }} aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => onTabChange('telemetry')}
            className={activeTab === 'telemetry' ? 'tab-active' : 'tab-inactive'}
            style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => onTabChange('trace')}
            className={activeTab === 'trace' ? 'tab-active' : 'tab-inactive'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '28px', padding: '0 10px', fontSize: '12px' }}
          >
            <span>Step Trace</span>
            {stepCount > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'trace' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: activeTab === 'trace' ? '#111315' : 'var(--accent-primary)',
                  fontWeight: 700,
                }}
              >
                {stepCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('comparison')}
            className={activeTab === 'comparison' ? 'tab-active' : 'tab-inactive'}
            style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
          >
            Comparison
          </button>
          <button
            type="button"
            onClick={() => onTabChange('system')}
            className={activeTab === 'system' ? 'tab-active' : 'tab-inactive'}
            style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
          >
            Complexity
          </button>
        </nav>
      </div>

      {/* Right: Canvas Actions & Portability Quick Buttons */}
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

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border)' }} />

        <button
          type="button"
          onClick={onImportClick}
          className="btn-secondary"
          style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
          title="Import graph JSON file"
        >
          Import
        </button>
        <button
          type="button"
          onClick={onExportGraph}
          disabled={!hasNodes}
          className="btn-secondary"
          style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
          title="Export graph to JSON"
        >
          Export
        </button>
        {hasResult && (
          <button
            type="button"
            onClick={onExportExperiment}
            className="btn-secondary"
            style={{ height: '26px', fontSize: '11px', padding: '0 8px', borderColor: 'var(--accent-muted)' }}
            title="Export complete experiment snapshot to JSON"
          >
            Snapshot
          </button>
        )}
      </div>
    </header>
  );
});
