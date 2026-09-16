import React from 'react';
import { PathfindResult, TraceStep } from '../types/graph';

export interface TelemetryPanelProps {
  result: PathfindResult | null;
  currentStep?: TraceStep;
  currentStepIndex: number;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = React.memo(({
  result,
}) => {
  if (!result) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>🧭</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          No Execution Results
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          Click "Run Pathfinding" to compute path and view telemetry.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Metrics Row: Total Cost & Nodes Visited */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Cost
          </div>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>
            {result.found && result.cost !== null ? result.cost.toFixed(2) : 'N/A'}
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Nodes Visited
          </div>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-info)', marginTop: '2px' }}>
            {result.metrics.nodesVisited}
          </div>
        </div>
      </div>

      {/* Reconstructed Path Sequence */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Reconstructed Path Sequence{result.found && result.path.length > 0 ? ` (${result.path.length} nodes)` : ''}
        </div>
        {result.found && result.path.length > 0 ? (
          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {result.path.map((nodeId, idx) => (
              <React.Fragment key={nodeId}>
                <span
                  style={{
                    backgroundColor: idx === 0 ? 'var(--node-source)' : idx === result.path.length - 1 ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: idx === 0 || idx === result.path.length - 1 ? '#111315' : 'var(--text-primary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: '1px solid var(--border)',
                  }}
                >
                  {nodeId}
                </span>
                {idx < result.path.length - 1 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No route exists between selected nodes.
          </div>
        )}
      </div>
    </div>
  );
});
