import React from 'react';

export const SystemConsolePanel: React.FC = React.memo(() => {
  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Algorithmic Complexity Table */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Asymptotic Complexity Matrix
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            <span>ALGORITHM</span>
            <span>TIME COMPLEXITY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-primary)' }}>Dijkstra</span>
            <span style={{ color: 'var(--accent-primary)' }}>O((V + E) log V)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-primary)' }}>A* Search</span>
            <span style={{ color: 'var(--accent-primary)' }}>O(b^d) / O((V+E) log V)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-primary)' }}>BFS</span>
            <span style={{ color: 'var(--color-info)' }}>O(V + E)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 10px' }}>
            <span style={{ color: 'var(--text-primary)' }}>DFS</span>
            <span style={{ color: 'var(--color-info)' }}>O(V + E)</span>
          </div>
        </div>
      </div>
    </div>
  );
});
