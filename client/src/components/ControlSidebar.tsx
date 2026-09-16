import React from 'react';
import { CanvasNode } from '../types/graph';

export type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs';
export type HeuristicType = 'euclidean' | 'manhattan' | 'zero';
export type CanvasTool = 'select' | 'add_node' | 'add_edge';

export interface ControlSidebarProps {
  algorithm: AlgorithmType;
  onAlgorithmChange: (algo: AlgorithmType) => void;
  heuristic: HeuristicType;
  onHeuristicChange: (h: HeuristicType) => void;
  sourceNode: string;
  onSourceNodeChange: (s: string) => void;
  destinationNode: string;
  onDestinationNodeChange: (d: string) => void;
  nodes: CanvasNode[];
  isDirected: boolean;
  onToggleDirected: () => void;
  isWeighted: boolean;
  onToggleWeighted: () => void;
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  hasSelection: boolean;
  onDeleteSelection: () => void;
  isLoading: boolean;
  onRunAlgorithm: () => void;
  onCompareAlgorithms: () => void;
  onReset: () => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = React.memo(({
  algorithm,
  onAlgorithmChange,
  heuristic,
  onHeuristicChange,
  sourceNode,
  onSourceNodeChange,
  destinationNode,
  onDestinationNodeChange,
  nodes,
  isDirected,
  onToggleDirected,
  isWeighted,
  onToggleWeighted,
  activeTool,
  onToolChange,
  hasSelection,
  onDeleteSelection,
  isLoading,
  onRunAlgorithm,
  onCompareAlgorithms,
  onReset,
}) => {
  const handleSwapEndpoints = () => {
    const prevSource = sourceNode;
    onSourceNodeChange(destinationNode);
    onDestinationNodeChange(prevSource);
  };

  return (
    <aside className="workbench-controls-panel" aria-label="Algorithm and Graph Controls">
      {/* 1. Algorithm Selection */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Algorithm
        </div>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmType)}
          className="select-field"
          style={{ width: '100%' }}
          aria-label="Select Pathfinding Algorithm"
        >
          <option value="dijkstra">Dijkstra's Algorithm (Priority Queue)</option>
          <option value="astar">A* Search (Heuristic Guided)</option>
          <option value="bfs">Breadth-First Search (BFS)</option>
          <option value="dfs">Depth-First Search (DFS)</option>
        </select>
      </div>

      {/* 2. Heuristic Function (Only for A*) */}
      {algorithm === 'astar' && (
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--accent-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Heuristic Function
          </div>
          <select
            value={heuristic}
            onChange={(e) => onHeuristicChange(e.target.value as HeuristicType)}
            className="select-field"
            style={{ width: '100%', borderColor: 'var(--accent-muted)' }}
            aria-label="Select A* Heuristic"
          >
            <option value="euclidean">Euclidean Distance (Straight Line)</option>
            <option value="manhattan">Manhattan Distance (Grid L1)</option>
            <option value="zero">Zero Heuristic (Dijkstra Parity)</option>
          </select>
        </div>
      )}

      {/* 3. Source & Destination Endpoints */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Endpoints
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label htmlFor="select-source-node" style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Source Node (S):
            </label>
            <select
              id="select-source-node"
              value={sourceNode}
              onChange={(e) => onSourceNodeChange(e.target.value)}
              className="select-field"
              style={{ width: '100%' }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label ? `${n.id} (${n.label})` : n.id}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSwapEndpoints}
              className="btn-ghost"
              style={{ height: '24px', fontSize: '11px', padding: '0 8px', gap: '4px' }}
              title="Swap source and destination nodes"
            >
              ⇅ Swap S ↔ D
            </button>
          </div>

          <div>
            <label htmlFor="select-destination-node" style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Destination Node (D):
            </label>
            <select
              id="select-destination-node"
              value={destinationNode}
              onChange={(e) => onDestinationNodeChange(e.target.value)}
              className="select-field"
              style={{ width: '100%' }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label ? `${n.id} (${n.label})` : n.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Graph Properties Toggles */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Graph Configuration
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onToggleDirected}
            className={isDirected ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, height: '28px', fontSize: '11px' }}
          >
            {isDirected ? 'Directed →' : 'Undirected ↔'}
          </button>
          <button
            type="button"
            onClick={onToggleWeighted}
            className={isWeighted ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, height: '28px', fontSize: '11px' }}
          >
            {isWeighted ? 'Weighted [w]' : 'Unweighted [1]'}
          </button>
        </div>
      </div>

      {/* 5. Canvas Interaction Tools */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Canvas Tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => onToolChange('select')}
            className={activeTool === 'select' ? 'btn-primary' : 'btn-secondary'}
            style={{ height: '28px', fontSize: '11px' }}
            title="Select and drag nodes (Shortcut: V)"
          >
            ↖ Select (V)
          </button>
          <button
            type="button"
            onClick={() => onToolChange('add_node')}
            className={activeTool === 'add_node' ? 'btn-primary' : 'btn-secondary'}
            style={{ height: '28px', fontSize: '11px' }}
            title="Click canvas to add nodes (Shortcut: N)"
          >
            + Node (N)
          </button>
          <button
            type="button"
            onClick={() => onToolChange('add_edge')}
            className={activeTool === 'add_edge' ? 'btn-primary' : 'btn-secondary'}
            style={{ height: '28px', fontSize: '11px' }}
            title="Click two nodes to create an edge (Shortcut: E)"
          >
            → Edge (E)
          </button>
          <button
            type="button"
            onClick={onDeleteSelection}
            disabled={!hasSelection}
            className="btn-destructive"
            style={{ height: '28px', fontSize: '11px' }}
            title="Delete selected node or edge (Shortcut: Delete / Backspace)"
          >
            ✕ Delete
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Wheel: Zoom • Drag BG: Pan • Click Weight: Edit
        </div>
      </div>

      {/* 6. Execution Action Buttons */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={onRunAlgorithm}
          disabled={isLoading || nodes.length === 0}
          className="btn-primary"
          style={{ height: '34px', fontSize: '12px', fontWeight: 600, width: '100%' }}
        >
          {isLoading ? '⏳ Computing Path...' : '▶ Run Pathfinding'}
        </button>

        <button
          type="button"
          onClick={onCompareAlgorithms}
          disabled={isLoading || nodes.length === 0}
          className="btn-secondary"
          style={{ height: '30px', fontSize: '11px', width: '100%' }}
        >
          ⚖ Compare All Algorithms
        </button>

        <button
          type="button"
          onClick={onReset}
          className="btn-ghost"
          style={{ height: '28px', fontSize: '11px', width: '100%', border: '1px solid var(--border)' }}
        >
          ↺ Reset Visualization
        </button>
      </div>
    </aside>
  );
});
