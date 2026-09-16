import React from 'react';
import { CompareResult } from '../types/graph';

export interface ComparisonPanelProps {
  compareResult: CompareResult | null;
  onRunCompare: () => void;
  isLoading: boolean;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = React.memo(({
  compareResult,
  onRunCompare,
  isLoading,
}) => {
  if (!compareResult) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>⚖</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          No Comparative Analysis Run
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.4', marginBottom: '12px' }}>
          Compare Dijkstra, A*, BFS, and DFS on the current graph.
        </div>
        <button
          type="button"
          onClick={onRunCompare}
          disabled={isLoading}
          className="btn-primary"
          style={{ height: '28px', fontSize: '11px', margin: '0 auto' }}
        >
          {isLoading ? 'Running...' : '▶ Run Comparison'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Comparative Matrix Table: ONLY ALGO, COST, and VISITED */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '6px 8px' }}>ALGO</th>
              <th style={{ padding: '6px 8px' }}>COST</th>
              <th style={{ padding: '6px 8px' }}>VISITED</th>
            </tr>
          </thead>
          <tbody>
            {compareResult.results.map((r) => {
              return (
                <tr
                  key={r.algorithm}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.algorithm.toUpperCase()}
                  </td>
                  <td style={{ padding: '8px', color: r.found ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {r.found && r.cost !== null ? r.cost.toFixed(2) : 'No Path'}
                  </td>
                  <td style={{ padding: '8px', color: 'var(--color-info)' }}>
                    {r.metrics?.nodesVisited ?? '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
