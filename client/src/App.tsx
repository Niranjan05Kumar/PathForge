import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  CanvasNode,
  CanvasEdge,
  PathfindResult,
  CompareResult,
  PathfindRequest,
  CompareRequest,
  TraceStep
} from './types/graph';
import { runPathfind, runCompare, checkHealth, generateGraph } from './services/api';
import { GRAPH_PRESETS } from './utils/presets';
import { usePlayback } from './hooks/usePlayback';
import { TraceLogPanel } from './components/TraceLogPanel';
import { BenchmarkDashboard } from './components/BenchmarkDashboard';

type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs';
type HeuristicType = 'euclidean' | 'manhattan' | 'zero';
type CanvasTool = 'select' | 'add_node' | 'add_edge';

export const App: React.FC = () => {
  // --- Backend Health Status ---
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then((data) => {
        if (data.status === 'ok') {
          setHealth(data);
        } else {
          setHealthError(data.message || 'API health probe failed.');
        }
        setHealthLoading(false);
      })
      .catch((err) => {
        setHealthError(err.message);
        setHealthLoading(false);
      });
  }, []);

  // --- Graph State (Default to Sample Network) ---
  const defaultPreset = GRAPH_PRESETS[0];
  const [nodes, setNodes] = useState<CanvasNode[]>(defaultPreset.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(defaultPreset.edges);
  const [isDirected, setIsDirected] = useState<boolean>(defaultPreset.directed);
  const [isWeighted, setIsWeighted] = useState<boolean>(defaultPreset.weighted);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);

  // --- Algorithm Configuration ---
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [selectedHeuristic, setSelectedHeuristic] = useState<HeuristicType>('euclidean');
  const [sourceNode, setSourceNode] = useState<string>(defaultPreset.defaultSource);
  const [destinationNode, setDestinationNode] = useState<string>(defaultPreset.defaultTarget);

  // --- UI Modes & Selection ---
  const [viewMode, setViewMode] = useState<'workbench' | 'benchmark'>('workbench');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'comparison' | 'trace' | 'system'>('telemetry');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [edgeStartNode, setEdgeStartNode] = useState<string | null>(null);

  // --- Synthetic Graph Generator Panel (Canvas Quick-Gen) ---
  const [showGenModal, setShowGenModal] = useState<boolean>(false);
  const [genTopology, setGenTopology] = useState<'sparse' | 'grid' | 'tree' | 'random' | 'dense'>('grid');
  const [genNodes, setGenNodes] = useState<number>(25);
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState<boolean>(false);

  // --- Node Dragging ---
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // --- Execution & Results State ---
  const [result, setResult] = useState<PathfindResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Phase 8: Stepped Playback Engine Hook ---
  const {
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    seek,
    reset: resetPlayback,
    setSpeed,
    initializeTrace,
  } = usePlayback({
    totalSteps: result?.steps ? result.steps.length : 0,
    initialSpeed: 250,
  });

  // --- Preset Switching ---
  const handleLoadPreset = (presetId: string) => {
    const preset = GRAPH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setIsDirected(preset.directed);
    setIsWeighted(preset.weighted);
    setSourceNode(preset.defaultSource);
    setDestinationNode(preset.defaultTarget);

    handleResetExecution();
  };

  const handleResetExecution = () => {
    resetPlayback();
    setResult(null);
    setCompareResult(null);
    setErrorMessage(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEdgeStartNode(null);
  };

  // --- Load Synthetic Graph into Canvas ---
  const handleLoadSyntheticGraph = (
    newNodes: CanvasNode[],
    newEdges: CanvasEdge[],
    directed: boolean,
    weighted: boolean
  ) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setIsDirected(directed);
    setIsWeighted(weighted);
    if (newNodes.length > 0) {
      setSourceNode(newNodes[0].id);
      setDestinationNode(newNodes[newNodes.length - 1].id);
    }
    handleResetExecution();
  };

  const handleGenerateSyntheticCanvas = async () => {
    setIsGeneratingCanvas(true);
    setErrorMessage(null);
    try {
      const resp = await generateGraph({
        nodes: genNodes,
        topology: genTopology,
        seed: Math.floor(Math.random() * 999999) + 1,
        directed: isDirected,
        weighted: isWeighted
      });

      if (resp.success && resp.data) {
        const generatedNodes: CanvasNode[] = resp.data.nodes.map((n: { id: string; label?: string; x?: number; y?: number }) => ({
          id: n.id,
          label: n.label || n.id,
          x: n.x ?? 100,
          y: n.y ?? 100
        }));

        const generatedEdges: CanvasEdge[] = resp.data.edges.map((e: { source: string; target: string; weight: number }, idx: number) => ({
          id: `edge_${idx}`,
          source: e.source,
          target: e.target,
          weight: e.weight
        }));

        handleLoadSyntheticGraph(generatedNodes, generatedEdges, isDirected, isWeighted);
        setShowGenModal(false);
      } else {
        setErrorMessage(resp.error?.message || 'Failed generating synthetic graph.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with graph generator.');
    } finally {
      setIsGeneratingCanvas(false);
    }
  };

  // --- Execute Native C++ Algorithm (/api/pathfind) ---
  const handleRunAlgorithm = async (autoPlay: boolean = true) => {
    setIsLoading(true);
    setErrorMessage(null);
    resetPlayback();

    const payload: PathfindRequest = {
      algorithm: selectedAlgorithm,
      heuristic: selectedAlgorithm === 'astar' ? selectedHeuristic : undefined,
      source: sourceNode,
      target: destinationNode,
      mode: 'visualize',
      graph: {
        directed: isDirected,
        weighted: isWeighted,
        nodes: nodes.map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          weight: isWeighted ? Math.max(0, e.weight) : 1.0
        }))
      }
    };

    const res = await runPathfind(payload);
    setIsLoading(false);

    if (res.success && res.data) {
      setResult(res.data);
      setActiveTab('telemetry');
      initializeTrace(res.data.steps.length, autoPlay);
    } else {
      setErrorMessage(res.error?.message || 'Algorithm execution failed.');
      setResult(null);
    }
  };

  // --- Execute Side-by-Side Comparison (/api/compare) ---
  const handleRunComparison = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    resetPlayback();

    const payload: CompareRequest = {
      algorithms: [
        { algorithm: 'dijkstra' },
        { algorithm: 'astar', heuristic: selectedHeuristic },
        { algorithm: 'bfs' },
        { algorithm: 'dfs' }
      ],
      source: sourceNode,
      target: destinationNode,
      graph: {
        directed: isDirected,
        weighted: isWeighted,
        nodes: nodes.map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          weight: isWeighted ? Math.max(0, e.weight) : 1.0
        }))
      }
    };

    const res = await runCompare(payload);
    setIsLoading(false);

    if (res.success && res.data) {
      setCompareResult(res.data);
      setActiveTab('comparison');
    } else {
      setErrorMessage(res.error?.message || 'Comparison failed.');
    }
  };

  const handlePlayClick = useCallback(() => {
    if (!result) {
      handleRunAlgorithm(true);
    } else {
      togglePlay();
    }
  }, [result, togglePlay, handleRunAlgorithm]);

  // --- Keyboard Shortcuts Navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayClick();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.code === 'Home') {
        e.preventDefault();
        jumpToStart();
      } else if (e.code === 'End') {
        e.preventDefault();
        jumpToEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayClick, stepForward, stepBackward, jumpToStart, jumpToEnd]);

  // --- Derived Step & Path States ---
  const currentStep: TraceStep | null = useMemo(() => {
    if (!result || currentStepIndex < 0 || currentStepIndex >= result.steps.length) return null;
    return result.steps[currentStepIndex];
  }, [result, currentStepIndex]);

  const activeFrontierSet = useMemo(() => new Set(currentStep?.frontier || []), [currentStep]);
  const activeVisitedSet = useMemo(() => new Set(currentStep?.visited || []), [currentStep]);

  const finalPathSet = useMemo(() => {
    if (!result || !result.found) return new Set<string>();
    // Highlight full path when finished or at final step
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

  // --- Canvas Interaction Handlers ---
  const handleMouseDownNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      setDraggingNodeId(id);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
    } else if (activeTool === 'add_edge') {
      if (!edgeStartNode) {
        setEdgeStartNode(id);
      } else if (edgeStartNode !== id) {
        // Connect nodes
        const existing = edges.find(
          (e) => (e.source === edgeStartNode && e.target === id) || (!isDirected && e.source === id && e.target === edgeStartNode)
        );

        if (!existing) {
          const newEdge: CanvasEdge = {
            id: `edge_${Date.now()}`,
            source: edgeStartNode,
            target: id,
            weight: 1.0
          };
          setEdges((prev) => [...prev, newEdge]);
        }
        setEdgeStartNode(null);
        setActiveTool('select');
      }
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggingNodeId
          ? { ...n, x: Math.max(30, Math.min(rect.width - 30, x)), y: Math.max(30, Math.min(rect.height - 30, y)) }
          : n
      )
    );
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'add_node' && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      let nextChar = 'N1';
      let index = nodes.length + 1;
      while (nodes.some((n) => n.id === `N${index}`)) {
        index++;
      }
      nextChar = `N${index}`;

      const newNode: CanvasNode = {
        id: nextChar,
        label: nextChar,
        x,
        y
      };

      setNodes((prev) => [...prev, newNode]);
      setActiveTool('select');
    } else {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setEdgeStartNode(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      // Cascade delete incident edges
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      if (sourceNode === selectedNodeId) {
        setSourceNode(nodes.find((n) => n.id !== selectedNodeId)?.id || '');
      }
      if (destinationNode === selectedNodeId) {
        setDestinationNode(nodes.find((n) => n.id !== selectedNodeId)?.id || '');
      }
      setSelectedNodeId(null);
      handleResetExecution();
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      handleResetExecution();
    }
  };

  const handleEditEdgeWeight = (edgeId: string, currentWeight: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = window.prompt(`Enter new non-negative weight for edge:`, currentWeight.toString());
    if (input !== null) {
      const parsed = parseFloat(input);
      if (!isNaN(parsed) && parsed >= 0) {
        setEdges((prev) =>
          prev.map((edge) => (edge.id === edgeId ? { ...edge, weight: +parsed.toFixed(2) } : edge))
        );
        handleResetExecution();
      } else {
        alert('Invalid weight. Edge weights must be non-negative numbers.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      {/* --- Top Header Bar --- */}
      <header
        style={{
          height: '48px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--accent-primary)',
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
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                PathForge
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Interactive Graph Pathfinding &amp; Optimization Engine
              </div>
            </div>
          </div>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border)' }} />

          {/* Top-Level Mode Selector */}
          <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setViewMode('workbench')}
              className={viewMode === 'workbench' ? 'tab-active' : 'tab-inactive'}
            >
              Workbench Canvas
            </button>
            <button
              onClick={() => setViewMode('benchmark')}
              className={viewMode === 'benchmark' ? 'tab-active' : 'tab-inactive'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>⚡ Benchmark Dashboard</span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: viewMode === 'benchmark' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: viewMode === 'benchmark' ? '#111315' : 'var(--accent-primary)',
                  fontWeight: 700,
                }}
              >
                100K
              </span>
            </button>
          </nav>

          {viewMode === 'workbench' && (
            <>
              <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border)' }} />

              {/* Workbench Sub-Tabs */}
              <nav style={{ display: 'flex', gap: '2px' }}>
                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={activeTab === 'telemetry' ? 'tab-active' : 'tab-inactive'}
                >
                  Workspace
                </button>
                <button
                  onClick={() => setActiveTab('trace')}
                  className={activeTab === 'trace' ? 'tab-active' : 'tab-inactive'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Step Trace</span>
                  {result?.steps && result.steps.length > 0 && (
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
                      {result.steps.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={activeTab === 'comparison' ? 'tab-active' : 'tab-inactive'}
                >
                  Comparison
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={activeTab === 'system' ? 'tab-active' : 'tab-inactive'}
                >
                  Console
                </button>
              </nav>
            </>
          )}
        </div>

        {/* Live Status Telemetry Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: healthLoading ? 'var(--color-warning)' : health ? 'var(--color-success)' : 'var(--color-error)',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>C++ Engine:</span>
            <span style={{ color: health?.cppEngine?.discovered ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: 600 }}>
              {healthLoading ? 'PROBING...' : health?.cppEngine?.discovered ? 'READY' : 'OFFLINE'}
            </span>
          </div>

          <div
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            MEM: IN-MEMORY (DB-FREE)
          </div>
        </div>
      </header>

      {/* Optional Error Banner */}
      {errorMessage && (
        <div
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
            zIndex: 9
          }}
        >
          <span>⚠ ERROR: {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* --- Main Content Area: Conditional on viewMode --- */}
      {viewMode === 'benchmark' ? (
        <BenchmarkDashboard
          onLoadGraphToCanvas={handleLoadSyntheticGraph}
          onSwitchToEditor={() => setViewMode('workbench')}
        />
      ) : (
        <>
          {/* --- Main 3-Column Workbench --- */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* --- Left Column: Algorithm & Graph Controls (280px) --- */}
        <aside
          style={{
            width: '280px',
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 5,
          }}
        >
          {/* Section: Algorithm Selector */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Algorithm
            </div>
            <select
              value={selectedAlgorithm}
              onChange={(e) => {
                setSelectedAlgorithm(e.target.value as AlgorithmType);
                handleResetExecution();
              }}
              className="select-field"
              style={{ width: '100%' }}
            >
              <option value="dijkstra">Dijkstra's Algorithm (Priority Queue)</option>
              <option value="astar">A* Search (Heuristic Guided)</option>
              <option value="bfs">Breadth-First Search (BFS)</option>
              <option value="dfs">Depth-First Search (DFS)</option>
            </select>
          </div>

          {/* Section: Heuristic Function (conditional for A*) */}
          {selectedAlgorithm === 'astar' && (
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--accent-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Heuristic Function
              </div>
              <select
                value={selectedHeuristic}
                onChange={(e) => {
                  setSelectedHeuristic(e.target.value as HeuristicType);
                  handleResetExecution();
                }}
                className="select-field"
                style={{ width: '100%', borderColor: 'var(--accent-muted)' }}
              >
                <option value="euclidean">Euclidean Distance (Straight Line)</option>
                <option value="manhattan">Manhattan Distance (Grid L1)</option>
                <option value="zero">Zero Heuristic (Dijkstra Baseline)</option>
              </select>
            </div>
          )}

          {/* Section: Source & Target Nodes */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Endpoints
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  SOURCE (S)
                </label>
                <select
                  value={sourceNode}
                  onChange={(e) => { setSourceNode(e.target.value); handleResetExecution(); }}
                  className="select-field"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  TARGET (D)
                </label>
                <select
                  value={destinationNode}
                  onChange={(e) => { setDestinationNode(e.target.value); handleResetExecution(); }}
                  className="select-field"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Action Buttons */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleRunAlgorithm(true)}
              disabled={isLoading || nodes.length === 0}
              className="btn-primary"
              style={{ width: '100%', height: '32px' }}
            >
              {isLoading ? 'Executing C++ Engine...' : 'Run Algorithm'}
            </button>
            <button
              onClick={handleRunComparison}
              disabled={isLoading || nodes.length === 0}
              className="btn-secondary"
              style={{ width: '100%', height: '28px' }}
            >
              Compare All Algorithms
            </button>
          </div>

          {/* Section: Graph Configuration */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Graph Topology
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDirected}
                  onChange={(e) => { setIsDirected(e.target.checked); handleResetExecution(); }}
                />
                Directed Edges (Arrows)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isWeighted}
                  onChange={(e) => { setIsWeighted(e.target.checked); handleResetExecution(); }}
                />
                Weighted Edges
              </label>
            </div>
          </div>

          {/* Section: Interactive Canvas Tools */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Editor Tools
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => { setActiveTool('select'); setEdgeStartNode(null); }}
                className={activeTool === 'select' ? 'btn-primary' : 'btn-secondary'}
                style={{ height: '28px' }}
              >
                Select &amp; Drag
              </button>
              <button
                onClick={() => { setActiveTool('add_node'); setEdgeStartNode(null); }}
                className={activeTool === 'add_node' ? 'btn-primary' : 'btn-secondary'}
                style={{ height: '28px' }}
              >
                + Add Node
              </button>
              <button
                onClick={() => { setActiveTool('add_edge'); setEdgeStartNode(null); }}
                className={activeTool === 'add_edge' ? 'btn-primary' : 'btn-secondary'}
                style={{ height: '28px' }}
              >
                + Connect Edges
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={!selectedNodeId && !selectedEdgeId}
                className="btn-destructive"
                style={{ height: '28px' }}
              >
                Delete Selected
              </button>
            </div>

            {activeTool === 'add_node' && (
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                * Click canvas to place a new vertex.
              </div>
            )}
            {activeTool === 'add_edge' && (
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {edgeStartNode ? `* Start: ${edgeStartNode}. Click target node.` : '* Click origin node to begin edge.'}
              </div>
            )}
          </div>

          {/* Section: Presets & Synthetic Generator */}
          <div style={{ padding: '14px', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Load Presets
              </div>
              <button
                onClick={() => setShowGenModal(!showGenModal)}
                className="btn-ghost"
                style={{ fontSize: '10px', color: 'var(--accent-primary)', height: '20px', padding: '0 6px', border: '1px solid var(--accent-muted)' }}
              >
                {showGenModal ? 'Hide Generator' : '⚡ Synthetic'}
              </button>
            </div>

            {showGenModal && (
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  SYNTHETIC GENERATOR
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    value={genTopology}
                    onChange={(e) => setGenTopology(e.target.value as any)}
                    className="select-field"
                    style={{ flex: 1, height: '24px', fontSize: '10px' }}
                  >
                    <option value="grid">Grid (Square)</option>
                    <option value="tree">Tree</option>
                    <option value="sparse">Sparse</option>
                    <option value="random">Random</option>
                    <option value="dense">Dense</option>
                  </select>
                  <input
                    type="number"
                    min={4}
                    max={500}
                    value={genNodes}
                    onChange={(e) => setGenNodes(Math.max(4, Math.min(500, parseInt(e.target.value) || 4)))}
                    className="select-field"
                    style={{ width: '50px', height: '24px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}
                    title="Number of vertices (4 - 500)"
                  />
                </div>
                <button
                  onClick={handleGenerateSyntheticCanvas}
                  disabled={isGeneratingCanvas}
                  className="btn-primary"
                  style={{ height: '24px', fontSize: '10px' }}
                >
                  {isGeneratingCanvas ? 'Generating...' : 'Synthesize to Canvas'}
                </button>
              </div>
            )}

            <select
              value={selectedPresetId}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="select-field"
              style={{ width: '100%', marginBottom: '8px', fontSize: '11px' }}
            >
              {GRAPH_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleLoadPreset(selectedPresetId)}
                className="btn-ghost"
                style={{ flex: 1, height: '26px', fontSize: '11px', border: '1px solid var(--border)' }}
              >
                Reset Preset
              </button>
              <button
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                  handleResetExecution();
                }}
                className="btn-ghost"
                style={{ height: '26px', fontSize: '11px', border: '1px solid var(--border)' }}
              >
                Clear
              </button>
            </div>
          </div>
        </aside>

        {/* --- Center Column: Interactive Graph Canvas --- */}
        <main
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {/* Sub-Header: Node counts & State Legend */}
          <div
            style={{
              height: '32px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'rgba(26, 29, 32, 0.6)',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              zIndex: 2,
            }}
          >
            <div>
              V: <span style={{ color: 'var(--text-primary)' }}>{nodes.length}</span> | E:{' '}
              <span style={{ color: 'var(--text-primary)' }}>{edges.length}</span>
              {selectedNodeId && (
                <span style={{ marginLeft: '12px', color: 'var(--accent-primary)' }}>
                  Selected Node: {selectedNodeId}
                </span>
              )}
              {selectedEdgeId && (
                <span style={{ marginLeft: '12px', color: 'var(--accent-primary)' }}>
                  Selected Edge: {selectedEdgeId}
                </span>
              )}
            </div>

            {/* Semantic State Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--node-source)' }} />
                <span>Source (S)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--node-destination)', border: '1px solid var(--accent-primary)' }} />
                <span>Dest (D)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--node-frontier)' }} />
                <span>Frontier</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--node-visited)' }} />
                <span>Visited</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--node-path)' }} />
                <span>Optimal Path</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <svg
              ref={svgRef}
              className="workbench-grid"
              style={{ width: '100%', height: '100%', cursor: activeTool === 'add_node' ? 'crosshair' : 'default' }}
              onMouseMove={handleMouseMoveCanvas}
              onMouseUp={handleMouseUpCanvas}
              onClick={handleCanvasClick}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-active)" />
                </marker>
                <marker
                  id="arrow-path"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-primary)" />
                </marker>
              </defs>

              {/* Render Edges */}
              {edges.map((edge) => {
                const sNode = nodes.find((n) => n.id === edge.source);
                const tNode = nodes.find((n) => n.id === edge.target);
                if (!sNode || !tNode) return null;

                const isPathEdge =
                  finalPathEdgesSet.has(`${edge.source}->${edge.target}`) ||
                  finalPathEdgesSet.has(`${edge.target}->${edge.source}`);

                const isExamined =
                  currentStep?.action === 'examine_edge' &&
                  ((currentStep.nodeId === edge.source && currentStep.targetId === edge.target) ||
                    (!isDirected && currentStep.nodeId === edge.target && currentStep.targetId === edge.source));

                const isRelaxed =
                  currentStep?.action === 'relax_edge' &&
                  ((currentStep.nodeId === edge.source && currentStep.targetId === edge.target) ||
                    (!isDirected && currentStep.nodeId === edge.target && currentStep.targetId === edge.source));

                const isSelected = selectedEdgeId === edge.id;

                const strokeColor = isPathEdge
                  ? 'var(--accent-primary)'
                  : isRelaxed
                  ? 'var(--color-success)'
                  : isExamined
                  ? 'var(--color-info)'
                  : isSelected
                  ? 'var(--text-primary)'
                  : 'var(--border)';

                const strokeWidth = isPathEdge ? 3.5 : isRelaxed ? 3.0 : isExamined || isSelected ? 2.5 : 1.5;

                const midX = (sNode.x + tNode.x) / 2;
                const midY = (sNode.y + tNode.y) / 2;

                return (
                  <g
                    key={edge.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                      setSelectedNodeId(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <line
                      x1={sNode.x}
                      y1={sNode.y}
                      x2={tNode.x}
                      y2={tNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className={isRelaxed ? 'anim-edge-relax' : undefined}
                      markerEnd={isDirected ? (isPathEdge ? 'url(#arrow-path)' : 'url(#arrow)') : undefined}
                      strokeDasharray={isExamined && !isPathEdge && !isRelaxed ? '4 2' : undefined}
                    />

                    {isWeighted && (
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        onClick={(e) => handleEditEdgeWeight(edge.id, edge.weight, e)}
                      >
                        <title>Click to edit weight</title>
                        <rect
                          x="-14"
                          y="-9"
                          width="28"
                          height="18"
                          rx="3"
                          fill="var(--bg-surface)"
                          stroke={isPathEdge ? 'var(--accent-primary)' : isRelaxed ? 'var(--color-success)' : isSelected ? 'var(--text-primary)' : 'var(--border)'}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isPathEdge ? 'var(--accent-primary)' : isRelaxed ? 'var(--color-success)' : 'var(--text-secondary)'}
                          fontFamily="var(--font-mono)"
                          fontSize="10"
                          fontWeight="500"
                        >
                          {edge.weight}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSource = node.id === sourceNode;
                const isDest = node.id === destinationNode;
                const isPath = finalPathSet.has(node.id);
                const isCurrent = currentStep?.nodeId === node.id;
                const isFrontier = activeFrontierSet.has(node.id);
                const isVisited = activeVisitedSet.has(node.id);
                const isSelected = node.id === selectedNodeId;

                let fillColor = 'var(--node-default)';
                let borderColor = 'var(--node-default-border)';
                let textColor = 'var(--text-primary)';
                let badgeText = '';

                if (isPath) {
                  fillColor = 'var(--accent-primary)';
                  borderColor = 'var(--accent-hover)';
                  textColor = '#111315';
                } else if (isCurrent) {
                  fillColor = 'var(--node-current)';
                  borderColor = 'var(--accent-primary)';
                  textColor = '#111315';
                  badgeText = 'C';
                } else if (isSource) {
                  fillColor = 'var(--node-source)';
                  borderColor = 'var(--accent-hover)';
                  textColor = '#111315';
                  badgeText = 'S';
                } else if (isDest) {
                  fillColor = 'var(--node-destination)';
                  borderColor = 'var(--accent-primary)';
                  textColor = '#111315';
                  badgeText = 'D';
                } else if (isFrontier) {
                  fillColor = 'var(--node-frontier)';
                  borderColor = '#79C0FF';
                  textColor = '#111315';
                  badgeText = 'F';
                } else if (isVisited) {
                  fillColor = 'var(--node-visited)';
                  borderColor = '#6E7681';
                  textColor = '#F0F6FC';
                  badgeText = 'V';
                }

                if (isSelected) {
                  borderColor = 'var(--text-primary)';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleMouseDownNode(node.id, e)}
                    style={{ cursor: activeTool === 'add_edge' ? 'pointer' : 'grab' }}
                  >
                    {/* Current Node pulse halo */}
                    {isCurrent && (
                      <circle
                        className="anim-pulse-current"
                        r="17"
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="2"
                      />
                    )}

                    {/* Frontier breathing halo */}
                    {isFrontier && !isCurrent && !isPath && (
                      <circle
                        className="anim-pulse-frontier"
                        r="15"
                        fill="none"
                        stroke="var(--color-info)"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Outer glow ring for selected or path node */}
                    {(isSelected || isPath) && !isCurrent && (
                      <circle
                        r="18"
                        fill="none"
                        stroke={isPath ? 'var(--accent-primary)' : 'var(--text-primary)'}
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                    )}

                    <circle
                      r="14"
                      fill={fillColor}
                      stroke={borderColor}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />

                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={textColor}
                      fontFamily="var(--font-mono)"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {node.label}
                    </text>

                    {/* Non-color Badge (WCAG a11y requirement) */}
                    {badgeText && (
                      <g transform="translate(10, -10)">
                        <circle r="6" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="1" />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--accent-primary)"
                          fontFamily="var(--font-mono)"
                          fontSize="8"
                          fontWeight="700"
                        >
                          {badgeText}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </main>

        {/* --- Right Column: Telemetry & Results Console (320px) --- */}
        <aside
          style={{
            width: '320px',
            borderLeft: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 5,
          }}
        >
          {activeTab === 'telemetry' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Telemetry Console
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  Algorithmic Execution Metrics
                </div>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: result?.found ? 'rgba(63, 185, 80, 0.1)' : result ? 'rgba(229, 83, 75, 0.1)' : 'var(--bg-elevated)',
                  border: `1px solid ${result?.found ? 'rgba(63, 185, 80, 0.3)' : result ? 'rgba(229, 83, 75, 0.3)' : 'var(--border)'}`,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: result?.found ? 'var(--color-success)' : result ? 'var(--color-error)' : 'var(--text-muted)',
                  }}
                >
                  {result?.found ? 'SOLVED (Optimal)' : result ? 'NO ROUTE' : 'IDLE'}
                </span>
              </div>

              {/* Route Chain Display */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Reconstructed Route
                </div>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: result?.found ? 'var(--accent-primary)' : 'var(--text-muted)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result?.found ? result.path.join(' → ') : 'No path established'}
                </div>
              </div>

              {/* Real-time C++ Kernel Metrics Table */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Kernel Metrics (Native C++)
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Total Path Cost</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          {result?.cost !== null && result?.cost !== undefined ? result.cost.toFixed(2) : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Nodes Visited</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {result ? result.metrics.nodesVisited : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Edges Examined</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {result ? result.metrics.edgesExamined : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Edge Relaxations</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {result ? result.metrics.edgeRelaxations : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Execution Time</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-info)' }}>
                          {result ? `${result.metrics.executionTimeMs} ms` : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Step Inspector */}
              {currentStep && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Step Inspector ({currentStepIndex + 1}/{result?.steps.length})
                    </div>
                    <button
                      onClick={() => setActiveTab('trace')}
                      className="btn-ghost"
                      style={{ height: '20px', padding: '0 6px', fontSize: '10px', color: 'var(--accent-primary)' }}
                    >
                      View Full Trace →
                    </button>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ color: 'var(--accent-hover)', marginBottom: '4px' }}>
                      &gt; {currentStep.action}: {currentStep.description}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Node: {currentStep.nodeId} | Frontier: [{currentStep.frontier.join(', ')}]
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trace' && (
            <TraceLogPanel
              steps={result?.steps || []}
              currentStepIndex={currentStepIndex}
              onSelectStep={seek}
            />
          )}

          {activeTab === 'comparison' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Technical Benchmark Report
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  Multi-Algorithm Benchmark
                </div>
              </div>

              {compareResult ? (
                <div>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Algorithm</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Cost</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Visited</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Time (ms)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareResult.results.map((r) => (
                          <tr key={r.algorithm} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '7px 10px', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                              {r.algorithm}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-primary)' }}>
                              {r.cost !== null ? r.cost.toFixed(2) : '—'}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                              {r.metrics.nodesVisited}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--color-info)' }}>
                              {r.metrics.executionTimeMs}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cost Parity Badge */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: compareResult.costParity ? 'rgba(63, 185, 80, 0.1)' : 'rgba(229, 83, 75, 0.1)',
                      border: `1px solid ${compareResult.costParity ? 'rgba(63, 185, 80, 0.3)' : 'rgba(229, 83, 75, 0.3)'}`,
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: compareResult.costParity ? 'var(--color-success)' : 'var(--color-error)',
                      marginBottom: '8px',
                    }}
                  >
                    {compareResult.costParity ? '✓ COST PARITY VERIFIED (Dijkstra == A*)' : '⚠ COST DISCREPANCY DETECTED'}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                    <div>Fastest Kernel: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{compareResult.fastest.toUpperCase()}</span></div>
                    <div>Fewest Nodes Visited: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{compareResult.fewestVisited.toUpperCase()}</span></div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  Click "Compare All Algorithms" in the controls panel to benchmark Dijkstra, A*, BFS, and DFS side-by-side.
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  System Architecture
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  Process &amp; Toolchain Status
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div>// Layer 1: Native C++ Engine</div>
                <div style={{ color: health?.cppEngine?.discovered ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  Status: {health?.cppEngine?.discovered ? 'Binary Verified' : 'Engine Ready'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '2px' }}>
                  Target: {health?.cppEngine?.resolvedPath || health?.cppEngine?.configuredPath}
                </div>

                <div style={{ marginTop: '12px' }}>// Layer 2: Node.js Express API</div>
                <div style={{ color: healthError ? 'var(--color-error)' : 'var(--color-success)' }}>
                  Status: {healthError ? `Error: ${healthError}` : 'HTTP Server Online'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Probe: /api/health (200 OK)
                </div>

                <div style={{ marginTop: '12px' }}>// Layer 3: React 18+ Client</div>
                <div style={{ color: 'var(--text-primary)' }}>
                  Mode: Vite HMR (Development)
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Storage: 100% In-Memory (DB-Free)
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* --- Bottom Bar: Stepped Playback Controls & Timeline (48px) --- */}
      <footer
        style={{
          height: '48px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        {/* Playback Step Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={jumpToStart}
            disabled={!result || currentStepIndex <= 0}
            className="btn-ghost"
            style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
            title="Jump to Start (Home)"
          >
            ⏮ First
          </button>

          <button
            onClick={stepBackward}
            disabled={!result || currentStepIndex <= 0}
            className="btn-ghost"
            style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
            title="Step Backward (Left Arrow)"
          >
            ◀ Step
          </button>

          {isPlaying ? (
            <button
              onClick={pause}
              className="btn-primary"
              style={{ height: '30px', padding: '0 16px', fontSize: '11px' }}
              title="Pause (Space)"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              onClick={handlePlayClick}
              disabled={isLoading || nodes.length === 0}
              className="btn-primary"
              style={{ height: '30px', padding: '0 16px', fontSize: '11px' }}
              title="Play (Space)"
            >
              ▶ Play
            </button>
          )}

          <button
            onClick={stepForward}
            disabled={!result || (currentStepIndex >= (result.steps.length - 1))}
            className="btn-ghost"
            style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
            title="Step Forward (Right Arrow)"
          >
            Step ▶
          </button>

          <button
            onClick={jumpToEnd}
            disabled={!result || (currentStepIndex >= (result.steps.length - 1))}
            className="btn-ghost"
            style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
            title="Jump to End (End)"
          >
            Last ⏭
          </button>

          <button
            onClick={handleResetExecution}
            className="btn-ghost"
            style={{ height: '30px', padding: '0 8px', fontSize: '11px', color: 'var(--text-muted)' }}
            title="Reset Execution"
          >
            ↺ Reset
          </button>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border)', margin: '0 4px' }} />

          {/* Monospace Step Indicator */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', minWidth: '95px' }}>
            STEP {currentStepIndex >= 0 ? String(currentStepIndex + 1).padStart(2, '0') : '00'} /{' '}
            {result?.steps ? String(result.steps.length).padStart(2, '0') : '00'}
          </div>
        </div>

        {/* Playback Scrubber */}
        <div style={{ flex: 1, maxWidth: '420px', margin: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min={0}
            max={result?.steps ? Math.max(0, result.steps.length - 1) : 0}
            value={currentStepIndex >= 0 ? currentStepIndex : 0}
            disabled={!result || result.steps.length === 0}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Discrete Playback Speed Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { label: '0.25x', speed: 800 },
            { label: '0.5x', speed: 500 },
            { label: '1x', speed: 250 },
            { label: '2x', speed: 120 },
            { label: 'Max', speed: 25 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setSpeed(item.speed)}
              className={playbackSpeed === item.speed ? 'btn-secondary' : 'btn-ghost'}
              style={{
                height: '24px',
                padding: '0 7px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                borderColor: playbackSpeed === item.speed ? 'var(--accent-primary)' : undefined,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </footer>
      </>
      )}
    </div>
  );
};

export default App;
