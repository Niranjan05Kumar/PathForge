import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  CanvasNode,
  CanvasEdge,
  PathfindResult,
  CompareResult,
  PathfindRequest,
  CompareRequest,
} from './types/graph';
import { runPathfind, runCompare } from './services/api';
import { usePlayback } from './hooks/usePlayback';
import { generateRandomGraph } from './utils/graphGenerator';

// Decomposed Modular Components
import { Header } from './components/Header';
import { ControlSidebar, AlgorithmType, HeuristicType, CanvasTool } from './components/ControlSidebar';
import { GraphCanvas } from './components/GraphCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { TelemetryPanel } from './components/TelemetryPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { SystemConsolePanel } from './components/SystemConsolePanel';
import { EdgeWeightModal } from './components/EdgeWeightModal';

const INITIAL_NODES: CanvasNode[] = [
  { id: 'A', label: 'A', x: 120, y: 220 },
  { id: 'B', label: 'B', x: 280, y: 120 },
  { id: 'C', label: 'C', x: 280, y: 320 },
  { id: 'D', label: 'D', x: 460, y: 120 },
  { id: 'E', label: 'E', x: 460, y: 320 },
  { id: 'F', label: 'F', x: 620, y: 220 },
];

const INITIAL_EDGES: CanvasEdge[] = [
  { id: 'e1', source: 'A', target: 'B', weight: 4.0 },
  { id: 'e2', source: 'A', target: 'C', weight: 2.0 },
  { id: 'e3', source: 'B', target: 'C', weight: 1.5 },
  { id: 'e4', source: 'B', target: 'D', weight: 5.0 },
  { id: 'e5', source: 'C', target: 'E', weight: 3.0 },
  { id: 'e6', source: 'D', target: 'E', weight: 2.5 },
  { id: 'e7', source: 'D', target: 'F', weight: 2.0 },
  { id: 'e8', source: 'E', target: 'F', weight: 4.0 },
];

export const App: React.FC = () => {
  // --- 1. Graph State ---
  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<CanvasEdge[]>(INITIAL_EDGES);
  const [isDirected, setIsDirected] = useState<boolean>(false);
  const [isWeighted, setIsWeighted] = useState<boolean>(true);

  // --- 2. Algorithm Configuration ---
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [selectedHeuristic, setSelectedHeuristic] = useState<HeuristicType>('euclidean');
  const [sourceNode, setSourceNode] = useState<string>('A');
  const [destinationNode, setDestinationNode] = useState<string>('F');

  // --- 4. UI Modes & Selection ---
  const [activeTab, setActiveTab] = useState<'telemetry' | 'comparison' | 'system'>('telemetry');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [edgeStartNode, setEdgeStartNode] = useState<string | null>(null);

  // Modal State (replaces window.prompt/alert)
  const [editingEdge, setEditingEdge] = useState<CanvasEdge | null>(null);

  // --- 5. Execution & Results State ---
  const [result, setResult] = useState<PathfindResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- 6. Stepped Playback Engine Hook ---
  const {
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    seek,
    reset: resetPlayback,
    setSpeed,
  } = usePlayback({
    totalSteps: result?.steps ? result.steps.length : 0,
    initialSpeed: 250,
  });

  // --- 7. Reset Handlers ---
  const handleResetExecution = useCallback(() => {
    resetPlayback();
    setResult(null);
    setCompareResult(null);
    setErrorMessage(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEdgeStartNode(null);
  }, [resetPlayback]);

  const handleClearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    handleResetExecution();
  }, [handleResetExecution]);

  // --- 9. Node & Edge CRUD Operations ---
  const handleAddNode = useCallback((x: number, y: number) => {
    let index = nodes.length + 1;
    while (nodes.some((n) => n.id === `N${index}`)) {
      index++;
    }
    const nextId = `N${index}`;
    const newNode: CanvasNode = {
      id: nextId,
      label: nextId,
      x,
      y,
    };
    setNodes((prev) => [...prev, newNode]);
    setActiveTool('select');
    handleResetExecution();
  }, [nodes, handleResetExecution]);

  const handleAddEdge = useCallback((source: string, target: string) => {
    if (source === target) {
      setErrorMessage("Self-loops are not allowed in PathForge graphs.");
      return;
    }

    const alreadyExists = edges.some(
      (e) =>
        (e.source === source && e.target === target) ||
        (!isDirected && e.source === target && e.target === source)
    );

    if (alreadyExists) {
      setErrorMessage(`Edge between '${source}' and '${target}' already exists.`);
      return;
    }

    const newEdge: CanvasEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      source,
      target,
      weight: 1.0,
    };

    setEdges((prev) => [...prev, newEdge]);
    setActiveTool('select');
    handleResetExecution();
  }, [edges, isDirected, handleResetExecution]);

  const handleMoveNode = useCallback((nodeId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x: Math.max(20, x), y: Math.max(20, y) } : n))
    );
  }, []);

  const handleDeleteSelection = useCallback(() => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
      handleResetExecution();
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      handleResetExecution();
    }
  }, [selectedNodeId, selectedEdgeId, handleResetExecution]);

  const handleSaveEdgeWeight = useCallback((edgeId: string, newWeight: number) => {
    setEdges((prev) =>
      prev.map((edge) => (edge.id === edgeId ? { ...edge, weight: newWeight } : edge))
    );
    handleResetExecution();
  }, [handleResetExecution]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
    handleResetExecution();
  }, [selectedEdgeId, handleResetExecution]);

  // --- 10. Random Graph Generator ---
  const handleGenerateRandomGraph = useCallback(() => {
    handleResetExecution();
    const generated = generateRandomGraph({
      isDirected,
      isWeighted,
    });
    setNodes(generated.nodes);
    setEdges(generated.edges);
    setSourceNode(generated.sourceNode);
    setDestinationNode(generated.destinationNode);
  }, [handleResetExecution, isDirected, isWeighted]);

  // --- 11. Execute Native C++ Algorithm (/api/pathfind) ---
  const handleRunAlgorithm = useCallback(async () => {
    if (nodes.length === 0) {
      setErrorMessage('Cannot run pathfinding on an empty graph.');
      return;
    }
    if (!sourceNode || !destinationNode) {
      setErrorMessage('Please select both a source and destination node.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    handleResetExecution();

    const payload: PathfindRequest = {
      algorithm: selectedAlgorithm,
      heuristic: selectedAlgorithm === 'astar' ? selectedHeuristic : undefined,
      source: sourceNode,
      target: destinationNode,
      recordTrace: true,
      graph: {
        directed: isDirected,
        weighted: isWeighted,
        nodes: nodes.map((n) => ({
          id: n.id,
          label: n.label,
          x: n.x,
          y: n.y,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          weight: isWeighted ? e.weight : 1.0,
        })),
      },
    };

    const response = await runPathfind(payload);
    setIsLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      setActiveTab('telemetry');
    } else {
      setErrorMessage(response.error?.message || 'Algorithm execution failed.');
    }
  }, [nodes, edges, isDirected, isWeighted, sourceNode, destinationNode, selectedAlgorithm, selectedHeuristic, handleResetExecution]);

  // --- 12. Execute Multi-Algorithm Comparison (/api/compare) ---
  const handleCompareAlgorithms = useCallback(async () => {
    if (nodes.length === 0) {
      setErrorMessage('Cannot compare algorithms on an empty graph.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    handleResetExecution();

    const payload: CompareRequest = {
      algorithms: [
        { algorithm: 'dijkstra' },
        { algorithm: 'astar', heuristic: selectedHeuristic },
        { algorithm: 'bfs' },
        { algorithm: 'dfs' },
      ],
      source: sourceNode,
      target: destinationNode,
      graph: {
        directed: isDirected,
        weighted: isWeighted,
        nodes: nodes.map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y })),
        edges: edges.map((e) => ({ source: e.source, target: e.target, weight: isWeighted ? e.weight : 1.0 })),
      },
    };

    const response = await runCompare(payload);
    setIsLoading(false);

    if (response.success && response.data) {
      setCompareResult(response.data);
      setActiveTab('comparison');
    } else {
      setErrorMessage(response.error?.message || 'Algorithm comparison failed.');
    }
  }, [nodes, edges, isDirected, isWeighted, sourceNode, destinationNode, selectedHeuristic, handleResetExecution]);

  // --- 13. Derived Visualization State (Memoized for high performance) ---
  const currentStep = useMemo(() => {
    if (!result?.steps || currentStepIndex < 0 || currentStepIndex >= result.steps.length) {
      return undefined;
    }
    return result.steps[currentStepIndex];
  }, [result, currentStepIndex]);

  const activeFrontierSet = useMemo(() => new Set(currentStep?.frontier || []), [currentStep]);
  const activeVisitedSet = useMemo(() => new Set(currentStep?.visited || []), [currentStep]);

  const finalPathSet = useMemo(() => {
    if (!result || !result.found) return new Set<string>();
    if (currentStepIndex === -1 || currentStepIndex >= result.steps.length - 1) {
      return new Set(result.path);
    }
    return new Set<string>();
  }, [result, currentStepIndex]);

  const finalPathEdgesSet = useMemo(() => {
    const set = new Set<string>();
    if (result && result.found && (currentStepIndex === -1 || currentStepIndex >= result.steps.length - 1)) {
      for (let i = 0; i < result.path.length - 1; i++) {
        const u = result.path[i];
        const v = result.path[i + 1];
        set.add(`${u}->${v}`);
        if (!isDirected) {
          set.add(`${v}->${u}`);
        }
      }
    }
    return set;
  }, [result, currentStepIndex, isDirected]);

  // --- 14. Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut triggers if inside an active form input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'n' || e.key === 'N') {
        setActiveTool('add_node');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('add_edge');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelection();
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setEdgeStartNode(null);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, stepBackward, handleDeleteSelection]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      {/* 1. Header Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClearGraph={handleClearGraph}
        onGenerateRandomGraph={handleGenerateRandomGraph}
      />

      {/* Error Notification Banner */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(229, 83, 75, 0.15)',
            borderBottom: '1px solid var(--color-error)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-error)',
            zIndex: 30,
          }}
        >
          <span>⚠ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 600 }}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main 3-Column Workbench */}
      <div className="workbench-layout">
        {/* Left Column: Controls Sidebar */}
        <ControlSidebar
          algorithm={selectedAlgorithm}
          onAlgorithmChange={setSelectedAlgorithm}
          heuristic={selectedHeuristic}
          onHeuristicChange={setSelectedHeuristic}
          sourceNode={sourceNode}
          onSourceNodeChange={setSourceNode}
          destinationNode={destinationNode}
          onDestinationNodeChange={setDestinationNode}
          nodes={nodes}
          isDirected={isDirected}
          onToggleDirected={() => {
            setIsDirected((prev) => !prev);
            handleResetExecution();
          }}
          isWeighted={isWeighted}
          onToggleWeighted={() => {
            setIsWeighted((prev) => !prev);
            handleResetExecution();
          }}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
          onDeleteSelection={handleDeleteSelection}
          isLoading={isLoading}
          onRunAlgorithm={handleRunAlgorithm}
          onCompareAlgorithms={handleCompareAlgorithms}
          onReset={handleResetExecution}
        />

        {/* Center Column: Interactive Graph Canvas with Pan/Zoom & Playback */}
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          sourceNode={sourceNode}
          destinationNode={destinationNode}
          isDirected={isDirected}
          isWeighted={isWeighted}
          activeTool={activeTool}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          edgeStartNode={edgeStartNode}
          finalPathSet={finalPathSet}
          finalPathEdgesSet={finalPathEdgesSet}
          activeFrontierSet={activeFrontierSet}
          activeVisitedSet={activeVisitedSet}
          currentStep={currentStep}
          onSelectNode={setSelectedNodeId}
          onSelectEdge={setSelectedEdgeId}
          onAddNode={handleAddNode}
          onAddEdge={handleAddEdge}
          onMoveNode={handleMoveNode}
          onEditEdgeWeight={setEditingEdge}
          onSetEdgeStartNode={setEdgeStartNode}
        >
          {/* Floating Playback Controls Overlay */}
          <PlaybackControls
            currentStepIndex={currentStepIndex}
            totalSteps={result?.steps ? result.steps.length : 0}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            currentStep={currentStep}
            onTogglePlay={togglePlay}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onJumpToStart={jumpToStart}
            onJumpToEnd={jumpToEnd}
            onSeek={seek}
            onSetSpeed={setSpeed}
            onReset={handleResetExecution}
          />
        </GraphCanvas>

        {/* Right Column: Telemetry, Comparison, Trace & Console Panel */}
        <aside className="workbench-results-panel" aria-label="Analytical Results and Telemetry">
          {activeTab === 'telemetry' && (
            <TelemetryPanel
              result={result}
              currentStep={currentStep}
              currentStepIndex={currentStepIndex}
            />
          )}

          {activeTab === 'comparison' && (
            <ComparisonPanel
              compareResult={compareResult}
              onRunCompare={handleCompareAlgorithms}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'system' && <SystemConsolePanel />}
        </aside>
      </div>

      {/* 3. Custom Accessible Modal: Edge Weight Editor (Replaces window.prompt/alert) */}
      <EdgeWeightModal
        edge={editingEdge}
        isOpen={Boolean(editingEdge)}
        onSave={handleSaveEdgeWeight}
        onDelete={handleDeleteEdge}
        onClose={() => setEditingEdge(null)}
      />
    </div>
  );
};
