import React from 'react';
import { PathfindResult, TraceStep } from '../types/graph';

export interface TelemetryPanelProps {
  result: PathfindResult | null;
  currentStep?: TraceStep;
  currentStepIndex: number;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = React.memo(({
  result,
  currentStep,
  currentStepIndex,
}) => {
  if (!result) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧭</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          No Execution Results
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
          Select source and destination nodes, choose an algorithm, and click "Run Pathfinding" to execute the native C++ engine.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Route Status Banner */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: result.found ? 'rgba(63, 185, 80, 0.12)' : 'rgba(229, 83, 75, 0.12)',
          border: `1px solid ${result.found ? 'rgba(63, 185, 80, 0.4)' : 'rgba(229, 83, 75, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: result.found ? 'var(--color-success)' : 'var(--color-error)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {result.found ? '✓ Optimal Route Found' : '✕ No Route Exists'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Algorithm: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{result.algorithm.toUpperCase()}</span>
          </div>
        </div>

        {result.found && result.cost !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Cost</div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {result.cost.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Algorithmic Metrics Cards Grid */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Performance Metrics (DSA Kernel)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Execution Time</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {result.metrics.executionTimeMs.toFixed(3)} <span style={{ fontSize: '11px', fontWeight: 400 }}>ms</span>
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nodes Visited</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-info)', marginTop: '2px' }}>
              {result.metrics.nodesVisited}
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Edges Examined</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
              {result.metrics.edgesExamined}
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Edge Relaxations</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-success)', marginTop: '2px' }}>
              {result.metrics.edgeRelaxations}
            </div>
          </div>
        </div>
      </div>

      {/* Path Sequence Breakdown */}
      {result.found && result.path.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Reconstructed Path Sequence ({result.path.length} nodes)
          </div>
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
        </div>
      )}

      {/* Current Playback Step Card */}
      {currentStep && currentStepIndex >= 0 && (
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--accent-muted)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Current Step {currentStepIndex + 1} of {result.steps.length}
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {currentStep.action}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {currentStep.description}
          </div>
        </div>
      )}
    </div>
  );
});
