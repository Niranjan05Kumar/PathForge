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
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚖</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          No Comparative Analysis Run
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', marginBottom: '16px' }}>
          Execute multi-algorithm analysis to evaluate Dijkstra, A*, BFS, and DFS side-by-side with cost parity checks.
        </div>
        <button
          type="button"
          onClick={onRunCompare}
          disabled={isLoading}
          className="btn-primary"
          style={{ height: '30px', fontSize: '11px', margin: '0 auto' }}
        >
          {isLoading ? 'Running Analysis...' : '▶ Run Comparison'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Comparative Highlights */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <div
          style={{
            flex: 1,
            minWidth: '130px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: compareResult.costParity ? 'rgba(63, 185, 80, 0.1)' : 'rgba(209, 153, 34, 0.1)',
            border: `1px solid ${compareResult.costParity ? 'rgba(63, 185, 80, 0.3)' : 'rgba(209, 153, 34, 0.3)'}`,
          }}
        >
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Optimality Parity</div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: compareResult.costParity ? 'var(--color-success)' : 'var(--color-warning)',
              marginTop: '2px',
            }}
          >
            {compareResult.costParity ? '✓ Parity Verified' : '⚠ Discrepancy'}
          </div>
        </div>

        {compareResult.fastest && (
          <div
            style={{
              flex: 1,
              minWidth: '130px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fastest Search</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
              {compareResult.fastest.toUpperCase()}
            </div>
          </div>
        )}

        {compareResult.fewestVisited && (
          <div
            style={{
              flex: 1,
              minWidth: '130px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fewest Visited</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-info)', marginTop: '2px' }}>
              {compareResult.fewestVisited.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Comparative Matrix Table */}
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
              <th style={{ padding: '6px 8px' }}>EXAMINED</th>
              <th style={{ padding: '6px 8px' }}>TIME (MS)</th>
            </tr>
          </thead>
          <tbody>
            {compareResult.results.map((r) => {
              const isFastest = r.algorithm === compareResult.fastest;
              const isFewest = r.algorithm === compareResult.fewestVisited;

              return (
                <tr
                  key={r.algorithm}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isFastest ? 'var(--accent-subtle)' : undefined,
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.algorithm.toUpperCase()}
                  </td>
                  <td style={{ padding: '8px', color: r.found ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {r.found && r.cost !== null ? r.cost.toFixed(2) : 'No Path'}
                  </td>
                  <td style={{ padding: '8px', color: isFewest ? 'var(--color-info)' : 'var(--text-secondary)' }}>
                    {r.metrics?.nodesVisited ?? '-'}
                  </td>
                  <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                    {r.metrics?.edgesExamined ?? '-'}
                  </td>
                  <td style={{ padding: '8px', color: isFastest ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                    {r.metrics?.executionTimeMs !== undefined ? r.metrics.executionTimeMs.toFixed(3) : '-'}
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
