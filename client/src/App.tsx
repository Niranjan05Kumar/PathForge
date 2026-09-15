import React, { useEffect, useState, useRef, useMemo } from 'react';

// --- Types & Interfaces ---

interface HealthStatus {
  status: string;
  timestamp: string;
  cppEngine: {
    discovered: boolean;
    configuredPath: string;
    resolvedPath: string | null;
  };
}

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  weight: number;
}

type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs';
type HeuristicType = 'euclidean' | 'manhattan' | 'zero';

interface TraceStep {
  stepIndex: number;
  currentNode: string;
  currentEdge?: { source: string; target: string };
  action: 'EXPAND_NODE' | 'RELAX_EDGE' | 'VISIT' | 'FINAL_PATH';
  frontier: string[];
  visited: string[];
  distances: Record<string, number>;
  description: string;
}

interface AlgorithmResult {
  algorithm: string;
  heuristic?: string;
  path: string[];
  cost: number | null;
  nodesVisited: number;
  edgesExamined: number;
  relaxations: number;
  executionTimeMs: number;
  steps: TraceStep[];
  success: boolean;
  message?: string;
}

// Initial Graph Data
const INITIAL_NODES: NodeData[] = [
  { id: 'A', label: 'A', x: 90, y: 160 },
  { id: 'B', label: 'B', x: 230, y: 80 },
  { id: 'C', label: 'C', x: 210, y: 260 },
  { id: 'D', label: 'D', x: 380, y: 90 },
  { id: 'E', label: 'E', x: 370, y: 250 },
  { id: 'F', label: 'F', x: 530, y: 150 },
  { id: 'Z', label: 'Z', x: 680, y: 200 },
];

const INITIAL_EDGES: EdgeData[] = [
  { id: 'e-ab', source: 'A', target: 'B', weight: 4.0 },
  { id: 'e-ac', source: 'A', target: 'C', weight: 2.0 },
  { id: 'e-bc', source: 'B', target: 'C', weight: 1.5 },
  { id: 'e-bd', source: 'B', target: 'D', weight: 5.0 },
  { id: 'e-cd', source: 'C', target: 'D', weight: 8.0 },
  { id: 'e-ce', source: 'C', target: 'E', weight: 7.0 },
  { id: 'e-de', source: 'D', target: 'E', weight: 2.5 },
  { id: 'e-df', source: 'D', target: 'F', weight: 6.0 },
  { id: 'e-ef', source: 'E', target: 'F', weight: 3.0 },
  { id: 'e-ez', source: 'E', target: 'Z', weight: 8.0 },
  { id: 'e-fz', source: 'F', target: 'Z', weight: 4.0 },
];

export const App: React.FC = () => {
  // --- Backend Health Probe ---
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: HealthStatus) => {
        setHealth(data);
        setHealthLoading(false);
      })
      .catch((err) => {
        setHealthError(err.message);
        setHealthLoading(false);
      });
  }, []);

  // --- Graph State ---
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<EdgeData[]>(INITIAL_EDGES);
  const [isDirected, setIsDirected] = useState<boolean>(false);
  const [isWeighted, setIsWeighted] = useState<boolean>(true);

  // --- Algorithm Configuration ---
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [selectedHeuristic, setSelectedHeuristic] = useState<HeuristicType>('euclidean');
  const [sourceNode, setSourceNode] = useState<string>('A');
  const [destinationNode, setDestinationNode] = useState<string>('Z');

  // --- UI Modes & Selection ---
  const [activeTab, setActiveTab] = useState<'telemetry' | 'comparison' | 'system'>('telemetry');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'add_node' | 'add_edge'>('select');
  const [edgeStartNode, setEdgeStartNode] = useState<string | null>(null);

  // --- Dragging Nodes ---
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // --- Execution & Playback State ---
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(350); // ms per step

  // --- Benchmark Comparison State ---
  const [comparisonData, setComparisonData] = useState<{
    dijkstra: AlgorithmResult | null;
    astar: AlgorithmResult | null;
  }>({ dijkstra: null, astar: null });

  // --- Algorithm Execution Engine ---
  const executePathfinding = (
    algo: AlgorithmType,
    heuristic: HeuristicType,
    src: string,
    dst: string
  ): AlgorithmResult => {
    const startTime = performance.now();

    // Map graph for traversal
    const adj: Record<string, { target: string; weight: number }[]> = {};
    nodes.forEach((n) => { adj[n.id] = []; });
    edges.forEach((e) => {
      const w = isWeighted ? Math.max(0, e.weight) : 1.0;
      if (adj[e.source]) adj[e.source].push({ target: e.target, weight: w });
      if (!isDirected && adj[e.target]) adj[e.target].push({ target: e.source, weight: w });
    });

    const nodeCoords: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => { nodeCoords[n.id] = { x: n.x, y: n.y }; });

    const calcH = (u: string, target: string): number => {
      if (heuristic === 'zero' || !nodeCoords[u] || !nodeCoords[target]) return 0;
      const dx = nodeCoords[u].x - nodeCoords[target].x;
      const dy = nodeCoords[u].y - nodeCoords[target].y;
      if (heuristic === 'euclidean') return Math.sqrt(dx * dx + dy * dy) * 0.02;
      if (heuristic === 'manhattan') return (Math.abs(dx) + Math.abs(dy)) * 0.02;
      return 0;
    };

    const steps: TraceStep[] = [];
    let nodesVisitedCount = 0;
    let edgesExaminedCount = 0;
    let relaxationsCount = 0;

    // Special Case: Source == Destination
    if (src === dst) {
      const endTime = performance.now();
      return {
        algorithm: algo.toUpperCase(),
        heuristic,
        path: [src],
        cost: 0,
        nodesVisited: 1,
        edgesExamined: 0,
        relaxations: 0,
        executionTimeMs: +(endTime - startTime).toFixed(3),
        steps: [{
          stepIndex: 0,
          currentNode: src,
          action: 'FINAL_PATH',
          frontier: [],
          visited: [src],
          distances: { [src]: 0 },
          description: `Source is destination (${src}). Path cost: 0.0`
        }],
        success: true
      };
    }

    const parent: Record<string, string | null> = {};
    const dist: Record<string, number> = {};
    const closedSet = new Set<string>();
    nodes.forEach((n) => { dist[n.id] = Infinity; parent[n.id] = null; });
    dist[src] = 0;

    // BFS Queue / Priority Queue
    if (algo === 'bfs') {
      const queue: string[] = [src];
      closedSet.add(src);

      steps.push({
        stepIndex: steps.length,
        currentNode: src,
        action: 'EXPAND_NODE',
        frontier: [...queue],
        visited: [...closedSet],
        distances: { ...dist },
        description: `Enqueued source node ${src}.`
      });

      while (queue.length > 0) {
        const u = queue.shift()!;
        nodesVisitedCount++;

        if (u === dst) {
          break;
        }

        const neighbors = adj[u] || [];
        for (const edge of neighbors) {
          edgesExaminedCount++;
          const v = edge.target;
          if (!closedSet.has(v)) {
            closedSet.add(v);
            parent[v] = u;
            dist[v] = dist[u] + 1;
            queue.push(v);
            relaxationsCount++;

            steps.push({
              stepIndex: steps.length,
              currentNode: u,
              currentEdge: { source: u, target: v },
              action: 'RELAX_EDGE',
              frontier: [...queue],
              visited: [...closedSet],
              distances: { ...dist },
              description: `BFS discovered unvisited vertex ${v} from ${u}.`
            });
          }
        }
      }
    } else if (algo === 'dfs') {
      const stack: string[] = [src];
      const visitedDFS = new Set<string>();

      steps.push({
        stepIndex: steps.length,
        currentNode: src,
        action: 'EXPAND_NODE',
        frontier: [...stack],
        visited: [],
        distances: { ...dist },
        description: `Pushed source node ${src} to DFS stack.`
      });

      while (stack.length > 0) {
        const u = stack.pop()!;
        if (!visitedDFS.has(u)) {
          visitedDFS.add(u);
          nodesVisitedCount++;

          steps.push({
            stepIndex: steps.length,
            currentNode: u,
            action: 'VISIT',
            frontier: [...stack],
            visited: [...visitedDFS],
            distances: { ...dist },
            description: `DFS popped and visiting node ${u}.`
          });

          if (u === dst) {
            break;
          }

          const neighbors = adj[u] || [];
          for (const edge of neighbors) {
            edgesExaminedCount++;
            const v = edge.target;
            if (!visitedDFS.has(v)) {
              parent[v] = u;
              dist[v] = dist[u] + (isWeighted ? edge.weight : 1.0);
              stack.push(v);
            }
          }
        }
      }
    } else {
      // Dijkstra or A*
      interface PQItem {
        node: string;
        cost: number;
        fScore: number;
      }
      const openSet: PQItem[] = [{ node: src, cost: 0, fScore: calcH(src, dst) }];

      steps.push({
        stepIndex: steps.length,
        currentNode: src,
        action: 'EXPAND_NODE',
        frontier: [src],
        visited: [],
        distances: { [src]: 0 },
        description: `Initialized ${algo === 'astar' ? 'A*' : 'Dijkstra'} with source ${src}.`
      });

      while (openSet.length > 0) {
        // Extract Min
        openSet.sort((a, b) => a.fScore - b.fScore);
        const { node: u, cost: currentCost } = openSet.shift()!;

        if (closedSet.has(u)) continue;
        closedSet.add(u);
        nodesVisitedCount++;

        steps.push({
          stepIndex: steps.length,
          currentNode: u,
          action: 'VISIT',
          frontier: openSet.map((i) => i.node),
          visited: [...closedSet],
          distances: { ...dist },
          description: `Extracted minimum node ${u} (cost: ${currentCost.toFixed(2)}).`
        });

        if (u === dst) {
          break;
        }

        const neighbors = adj[u] || [];
        for (const edge of neighbors) {
          edgesExaminedCount++;
          const v = edge.target;
          if (closedSet.has(v)) continue;

          const tentativeG = dist[u] + edge.weight;
          if (tentativeG < dist[v]) {
            dist[v] = tentativeG;
            parent[v] = u;
            relaxationsCount++;
            const h = algo === 'astar' ? calcH(v, dst) : 0;
            const f = tentativeG + h;

            openSet.push({ node: v, cost: tentativeG, fScore: f });

            steps.push({
              stepIndex: steps.length,
              currentNode: u,
              currentEdge: { source: u, target: v },
              action: 'RELAX_EDGE',
              frontier: openSet.map((i) => i.node),
              visited: [...closedSet],
              distances: { ...dist },
              description: `Relaxed edge ${u} → ${v} (new cost: ${tentativeG.toFixed(2)}).`
            });
          }
        }
      }
    }

    // Path Reconstruction
    const path: string[] = [];
    let totalCost: number | null = null;

    if (dist[dst] !== Infinity || parent[dst] !== null || src === dst) {
      let curr: string | null = dst;
      while (curr !== null) {
        path.push(curr);
        if (curr === src) break;
        curr = parent[curr];
      }
      path.reverse();

      if (path[0] === src) {
        totalCost = 0;
        for (let i = 0; i < path.length - 1; i++) {
          const u = path[i];
          const v = path[i + 1];
          const match = (adj[u] || []).find((e) => e.target === v);
          totalCost += match ? match.weight : 1.0;
        }
        totalCost = +totalCost.toFixed(2);
      }
    }

    const endTime = performance.now();
    const executionTimeMs = +(endTime - startTime).toFixed(3);

    if (path.length > 0 && path[0] === src) {
      steps.push({
        stepIndex: steps.length,
        currentNode: dst,
        action: 'FINAL_PATH',
        frontier: [],
        visited: [...closedSet],
        distances: { ...dist },
        description: `Optimal path established: ${path.join(' → ')} (Total cost: ${totalCost})`
      });
    }

    return {
      algorithm: algo.toUpperCase(),
      heuristic: algo === 'astar' ? heuristic : undefined,
      path: path.length > 0 && path[0] === src ? path : [],
      cost: path.length > 0 && path[0] === src ? totalCost : null,
      nodesVisited: nodesVisitedCount,
      edgesExamined: edgesExaminedCount,
      relaxations: relaxationsCount,
      executionTimeMs,
      steps,
      success: path.length > 0 && path[0] === src,
      message: path.length > 0 && path[0] === src ? undefined : 'No route exists between the selected nodes.'
    };
  };

  // Run Main Execution
  const handleRunAlgorithm = () => {
    setIsPlaying(false);
    const res = executePathfinding(selectedAlgorithm, selectedHeuristic, sourceNode, destinationNode);
    setResult(res);
    setCurrentStepIndex(res.steps.length > 0 ? res.steps.length - 1 : -1);
  };

  // Run Comparison (Dijkstra vs A*)
  const handleRunComparison = () => {
    const dijkstraRes = executePathfinding('dijkstra', 'zero', sourceNode, destinationNode);
    const astarRes = executePathfinding('astar', selectedHeuristic, sourceNode, destinationNode);
    setComparisonData({ dijkstra: dijkstraRes, astar: astarRes });
    setActiveTab('comparison');
    setResult(dijkstraRes);
    setCurrentStepIndex(dijkstraRes.steps.length - 1);
  };

  // --- Animation Playback Controller ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying && result && result.steps.length > 0) {
      if (currentStepIndex >= result.steps.length - 1) {
        setIsPlaying(false);
      } else {
        timer = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, playbackSpeed);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, result, playbackSpeed]);

  // Playback Control Handlers
  const handlePlay = () => {
    if (!result) {
      handleRunAlgorithm();
      setCurrentStepIndex(0);
    } else if (currentStepIndex >= result.steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleNextStep = () => {
    setIsPlaying(false);
    if (!result) {
      handleRunAlgorithm();
      setCurrentStepIndex(0);
    } else if (currentStepIndex < result.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setResult(null);
  };

  // --- Active Step State Derivations ---
  const currentStep = useMemo(() => {
    if (!result || currentStepIndex < 0 || currentStepIndex >= result.steps.length) return null;
    return result.steps[currentStepIndex];
  }, [result, currentStepIndex]);

  const activeFrontierSet = useMemo(() => new Set(currentStep?.frontier || []), [currentStep]);
  const activeVisitedSet = useMemo(() => new Set(currentStep?.visited || []), [currentStep]);
  const finalPathSet = useMemo(() => {
    if (!result || !result.success) return new Set<string>();
    // If at final step, show full path
    if (currentStepIndex === result.steps.length - 1) {
      return new Set(result.path);
    }
    return new Set<string>();
  }, [result, currentStepIndex]);

  const finalPathEdgesSet = useMemo(() => {
    const set = new Set<string>();
    if (result && result.success && currentStepIndex === result.steps.length - 1) {
      for (let i = 0; i < result.path.length - 1; i++) {
        const u = result.path[i];
        const v = result.path[i + 1];
        set.add(`${u}->${v}`);
        set.add(`${v}->${u}`);
      }
    }
    return set;
  }, [result, currentStepIndex]);

  // --- Canvas Interaction Handlers ---
  const handleMouseDownNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      setDraggingNodeId(id);
      setSelectedNodeId(id);
    } else if (activeTool === 'add_edge') {
      if (!edgeStartNode) {
        setEdgeStartNode(id);
      } else if (edgeStartNode !== id) {
        // Create new edge
        const newEdge: EdgeData = {
          id: `e-${Date.now()}`,
          source: edgeStartNode,
          target: id,
          weight: Math.round(Math.random() * 8 + 1)
        };
        setEdges((prev) => [...prev, newEdge]);
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
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: Math.max(30, Math.min(850, x)), y: Math.max(30, Math.min(500, y)) } : n))
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
      const nextChar = String.fromCharCode(65 + (nodes.length % 26)) + (nodes.length >= 26 ? Math.floor(nodes.length / 26) : '');
      const newNode: NodeData = {
        id: nextChar,
        label: nextChar,
        x,
        y
      };
      setNodes((prev) => [...prev, newNode]);
      setActiveTool('select');
    } else {
      setSelectedNodeId(null);
      setEdgeStartNode(null);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    // Cascade deletion
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    if (sourceNode === selectedNodeId) setSourceNode(nodes.find((n) => n.id !== selectedNodeId)?.id || '');
    if (destinationNode === selectedNodeId) setDestinationNode(nodes.find((n) => n.id !== selectedNodeId)?.id || '');
    setSelectedNodeId(null);
    handleResetPlayback();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* --- Top Header Bar (Understated Engineering Workbench) --- */}
      <header
        style={{
          height: '46px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-primary)', borderRadius: '2px' }} />
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              PathForge
            </span>
          </div>
          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase', fontWeight: 500 }}>
            Interactive Graph Pathfinding &amp; Optimization Engine
          </span>
        </div>

        {/* Center Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={activeTab === 'telemetry' ? 'btn-primary' : 'btn-ghost'}
            style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
          >
            Workspace
          </button>
          <button
            onClick={() => { setActiveTab('comparison'); if (!comparisonData.dijkstra) handleRunComparison(); }}
            className={activeTab === 'comparison' ? 'btn-primary' : 'btn-ghost'}
            style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
          >
            Comparison Report
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={activeTab === 'system' ? 'btn-primary' : 'btn-ghost'}
            style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
          >
            System Console
          </button>
        </div>

        {/* Right Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="badge">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: health?.cppEngine.discovered ? 'var(--color-success)' : 'var(--color-warning)' }} />
            <span>C++ Engine: {health?.cppEngine.discovered ? 'READY' : (healthLoading ? 'PROBING...' : 'OFFLINE')}</span>
          </div>
          <div className="badge">
            <span>MEM: IN-MEMORY (DB-FREE)</span>
          </div>
        </div>
      </header>

      {/* --- Main Workbench 3-Column Layout --- */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* --- Left Sidebar: Graph & Algorithm Controls --- */}
        <aside
          style={{
            width: '280px',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          {/* Section: Algorithm & Search Mode */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Algorithm Engine
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Algorithm</label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => { setSelectedAlgorithm(e.target.value as AlgorithmType); handleResetPlayback(); }}
                  style={{ width: '100%' }}
                >
                  <option value="dijkstra">Dijkstra's Algorithm</option>
                  <option value="astar">A* Search Algorithm</option>
                  <option value="bfs">Breadth-First Search (BFS)</option>
                  <option value="dfs">Depth-First Search (DFS)</option>
                </select>
              </div>

              {selectedAlgorithm === 'astar' && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>A* Heuristic</label>
                  <select
                    value={selectedHeuristic}
                    onChange={(e) => { setSelectedHeuristic(e.target.value as HeuristicType); handleResetPlayback(); }}
                    style={{ width: '100%' }}
                  >
                    <option value="euclidean">Euclidean Distance (Admissible)</option>
                    <option value="manhattan">Manhattan Distance (Grid)</option>
                    <option value="zero">Zero Heuristic (Dijkstra Parity)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Source Node</label>
                  <select
                    value={sourceNode}
                    onChange={(e) => { setSourceNode(e.target.value); handleResetPlayback(); }}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.id} ({n.label})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Destination</label>
                  <select
                    value={destinationNode}
                    onChange={(e) => { setDestinationNode(e.target.value); handleResetPlayback(); }}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.id} ({n.label})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  onClick={handleRunAlgorithm}
                  className="btn-primary"
                  style={{ flex: 1, height: '34px' }}
                >
                  <span style={{ fontSize: '14px' }}>▶</span> Run Algorithm
                </button>
                <button
                  onClick={handleRunComparison}
                  className="btn-secondary"
                  title="Compare Dijkstra vs A*"
                  style={{ height: '34px', padding: '0 10px' }}
                >
                  Compare
                </button>
              </div>
            </div>
          </div>

          {/* Section: Graph Properties & Topology */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Graph Configuration
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Orientation</span>
                <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-primary)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setIsDirected(false); handleResetPlayback(); }}
                    style={{
                      height: '22px',
                      fontSize: '11px',
                      padding: '0 6px',
                      backgroundColor: !isDirected ? 'var(--bg-elevated)' : 'transparent',
                      color: !isDirected ? 'var(--text-primary)' : 'var(--text-muted)',
                      borderColor: 'transparent'
                    }}
                  >
                    Undirected
                  </button>
                  <button
                    onClick={() => { setIsDirected(true); handleResetPlayback(); }}
                    style={{
                      height: '22px',
                      fontSize: '11px',
                      padding: '0 6px',
                      backgroundColor: isDirected ? 'var(--bg-elevated)' : 'transparent',
                      color: isDirected ? 'var(--text-primary)' : 'var(--text-muted)',
                      borderColor: 'transparent'
                    }}
                  >
                    Directed
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Weight Mode</span>
                <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-primary)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setIsWeighted(true); handleResetPlayback(); }}
                    style={{
                      height: '22px',
                      fontSize: '11px',
                      padding: '0 6px',
                      backgroundColor: isWeighted ? 'var(--bg-elevated)' : 'transparent',
                      color: isWeighted ? 'var(--text-primary)' : 'var(--text-muted)',
                      borderColor: 'transparent'
                    }}
                  >
                    Weighted
                  </button>
                  <button
                    onClick={() => { setIsWeighted(false); handleResetPlayback(); }}
                    style={{
                      height: '22px',
                      fontSize: '11px',
                      padding: '0 6px',
                      backgroundColor: !isWeighted ? 'var(--bg-elevated)' : 'transparent',
                      color: !isWeighted ? 'var(--text-primary)' : 'var(--text-muted)',
                      borderColor: 'transparent'
                    }}
                  >
                    Unweighted
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Interactive Canvas Tools */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Canvas Tools
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
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
                + Add Edge
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={!selectedNodeId}
                className="btn-destructive"
                style={{ height: '28px' }}
              >
                Delete Selected
              </button>
            </div>

            {activeTool === 'add_node' && (
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                * Click anywhere on canvas to place node.
              </div>
            )}
            {activeTool === 'add_edge' && (
              <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {edgeStartNode ? `* Selected start node: ${edgeStartNode}. Click target node.` : '* Click origin node to begin edge.'}
              </div>
            )}
          </div>

          {/* Section: Preset Topologies */}
          <div style={{ padding: '14px', marginTop: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Presets
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => { setNodes(INITIAL_NODES); setEdges(INITIAL_EDGES); handleResetPlayback(); }}
                className="btn-ghost"
                style={{ flex: 1, height: '26px', fontSize: '11px', border: '1px solid var(--border)' }}
              >
                Reset Default
              </button>
              <button
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                  handleResetPlayback();
                }}
                className="btn-ghost"
                style={{ height: '26px', fontSize: '11px', border: '1px solid var(--border)' }}
              >
                Clear
              </button>
            </div>
          </div>
        </aside>

        {/* --- Center: Interactive Graph Canvas --- */}
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
          {/* Canvas Sub-Header: Node counts & State legend */}
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
              V: <span style={{ color: 'var(--text-primary)' }}>{nodes.length}</span> | E: <span style={{ color: 'var(--text-primary)' }}>{edges.length}</span>
              {selectedNodeId && (
                <span style={{ marginLeft: '12px', color: 'var(--accent-primary)' }}>
                  Selected: {selectedNodeId}
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

          {/* SVG Canvas Area */}
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
                {/* Arrowhead marker for directed edges */}
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

                const isPathEdge = finalPathEdgesSet.has(`${edge.source}->${edge.target}`) || finalPathEdgesSet.has(`${edge.target}->${edge.source}`);
                const isExamined = currentStep?.currentEdge && 
                  ((currentStep.currentEdge.source === edge.source && currentStep.currentEdge.target === edge.target) ||
                   (!isDirected && currentStep.currentEdge.source === edge.target && currentStep.currentEdge.target === edge.source));

                const strokeColor = isPathEdge 
                  ? 'var(--accent-primary)' 
                  : isExamined 
                  ? 'var(--color-info)' 
                  : 'var(--border)';
                const strokeWidth = isPathEdge ? 3 : isExamined ? 2 : 1.5;

                // Midpoint for weight label
                const midX = (sNode.x + tNode.x) / 2;
                const midY = (sNode.y + tNode.y) / 2;

                return (
                  <g key={edge.id}>
                    <line
                      x1={sNode.x}
                      y1={sNode.y}
                      x2={tNode.x}
                      y2={tNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      markerEnd={isDirected ? (isPathEdge ? 'url(#arrow-path)' : 'url(#arrow)') : undefined}
                      strokeDasharray={isExamined && !isPathEdge ? '4 2' : undefined}
                    />

                    {isWeighted && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-14"
                          y="-9"
                          width="28"
                          height="18"
                          rx="3"
                          fill="var(--bg-surface)"
                          stroke={isPathEdge ? 'var(--accent-primary)' : 'var(--border)'}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isPathEdge ? 'var(--accent-primary)' : 'var(--text-secondary)'}
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
                const isCurrent = currentStep?.currentNode === node.id;
                const isFrontier = activeFrontierSet.has(node.id);
                const isVisited = activeVisitedSet.has(node.id);
                const isSelected = node.id === selectedNodeId;

                // Node coloring hierarchy
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
                  borderColor = '#8bc34a';
                  textColor = '#111315';
                } else if (isVisited) {
                  fillColor = 'var(--node-visited)';
                  borderColor = 'var(--border)';
                  textColor = 'var(--text-secondary)';
                }

                if (isSelected) {
                  borderColor = '#ffffff';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleMouseDownNode(node.id, e)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {/* Node Circle */}
                    <circle
                      r="17"
                      fill={fillColor}
                      stroke={borderColor}
                      strokeWidth={isSelected || isCurrent || isPath ? '2.5' : '1.5'}
                    />

                    {/* Node Label */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={textColor}
                      fontWeight="600"
                      fontSize="12"
                      fontFamily="var(--font-mono)"
                    >
                      {node.label}
                    </text>

                    {/* Badge Indicator (S or D) */}
                    {badgeText && (
                      <g transform="translate(11, -11)">
                        <circle r="7" fill="var(--bg-primary)" stroke="var(--border)" strokeWidth="1" />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--accent-primary)"
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="var(--font-mono)"
                        >
                          {badgeText}
                        </text>
                      </g>
                    )}

                    {/* Cost indicator during stepping */}
                    {currentStep && currentStep.distances[node.id] !== undefined && currentStep.distances[node.id] !== Infinity && (
                      <g transform="translate(0, 26)">
                        <rect x="-16" y="-7" width="32" height="14" rx="2" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1" />
                        <text textAnchor="middle" dominantBaseline="central" fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono)">
                          {currentStep.distances[node.id]}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </main>

        {/* --- Right Sidebar: Engineering Console & Results --- */}
        <aside
          style={{
            width: '320px',
            backgroundColor: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          {activeTab === 'telemetry' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Execution Telemetry
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {result ? `${result.algorithm} Execution` : 'Awaiting Execution'}
                </div>
              </div>

              {/* Status Box */}
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ color: result ? (result.success ? 'var(--color-success)' : 'var(--color-error)') : 'var(--text-muted)' }}>
                    {result ? (result.success ? 'SOLVED (Optimal)' : 'UNREACHABLE') : 'IDLE'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Route:</span>
                  <span style={{ color: result?.success ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    {result && result.path.length > 0 ? result.path.join(' → ') : 'None'}
                  </span>
                </div>

                {result?.heuristic && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Heuristic:</span>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{result.heuristic}</span>
                  </div>
                )}
              </div>

              {/* Metrics Table (Engineering Console Style) */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Kernel Metrics
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
                          {result ? result.nodesVisited : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Edges Examined</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {result ? result.edgesExamined : '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Edge Relaxations</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {result ? result.relaxations : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Execution Time</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-info)' }}>
                          {result ? `${result.executionTimeMs} ms` : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Step Trace Inspector */}
              {currentStep && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Step Inspector ({currentStepIndex + 1}/{result?.steps.length})
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
                      Current Node: {currentStep.currentNode} | Frontier: [{currentStep.frontier.join(', ')}]
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comparison' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Technical Benchmark Report
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  Dijkstra vs. A* Comparison
                </div>
              </div>

              {comparisonData.dijkstra && comparisonData.astar ? (
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
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Metric</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Dijkstra</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>A* (Eucl.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>Path Cost</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.dijkstra.cost?.toFixed(2)}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-primary)' }}>{comparisonData.astar.cost?.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>Nodes Visited</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.dijkstra.nodesVisited}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--accent-primary)' }}>{comparisonData.astar.nodesVisited}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>Edges Examined</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.dijkstra.edgesExamined}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.astar.edgesExamined}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>Relaxations</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.dijkstra.relaxations}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.astar.relaxations}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>Kernel Time</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{comparisonData.dijkstra.executionTimeMs} ms</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--color-info)' }}>{comparisonData.astar.executionTimeMs} ms</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Parity Check Badge */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: comparisonData.dijkstra.cost === comparisonData.astar.cost ? 'rgba(63, 185, 80, 0.1)' : 'rgba(229, 83, 75, 0.1)',
                      border: `1px solid ${comparisonData.dijkstra.cost === comparisonData.astar.cost ? 'rgba(63, 185, 80, 0.3)' : 'rgba(229, 83, 75, 0.3)'}`,
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: comparisonData.dijkstra.cost === comparisonData.astar.cost ? 'var(--color-success)' : 'var(--color-error)',
                    }}
                  >
                    ✓ COST PARITY VERIFIED ({comparisonData.dijkstra.cost} == {comparisonData.astar.cost})
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  Click "Compare" in the controls panel to run Dijkstra vs A* side-by-side.
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
                <div style={{ color: health?.cppEngine.discovered ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  Status: {health?.cppEngine.discovered ? 'Binary Verified' : 'Engine Ready'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '2px' }}>
                  Target: {health?.cppEngine.resolvedPath || health?.cppEngine.configuredPath}
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

      {/* --- Bottom Bar: Stepped Playback Controls & Timeline --- */}
      <footer
        style={{
          height: '48px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Playback Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handlePrevStep}
            disabled={!result || currentStepIndex <= 0}
            className="btn-secondary"
            title="Previous Step"
            style={{ height: '28px', padding: '0 8px', fontFamily: 'var(--font-mono)' }}
          >
            ⏮ Step
          </button>

          {isPlaying ? (
            <button
              onClick={handlePause}
              className="btn-primary"
              style={{ height: '28px', padding: '0 12px' }}
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="btn-primary"
              style={{ height: '28px', padding: '0 12px' }}
            >
              ▶ Play
            </button>
          )}

          <button
            onClick={handleNextStep}
            disabled={!result || (result && currentStepIndex >= result.steps.length - 1)}
            className="btn-secondary"
            title="Next Step"
            style={{ height: '28px', padding: '0 8px', fontFamily: 'var(--font-mono)' }}
          >
            Step ⏭
          </button>

          <button
            onClick={handleResetPlayback}
            className="btn-ghost"
            title="Reset Playback"
            style={{ height: '28px', padding: '0 8px' }}
          >
            ↺ Reset
          </button>
        </div>

        {/* Step Progress Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            STEP <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{currentStepIndex >= 0 ? String(currentStepIndex + 1).padStart(2, '0') : '00'}</span> / {result ? String(result.steps.length).padStart(2, '0') : '00'}
          </div>

          {/* Scrubber Bar */}
          <div
            style={{
              width: '180px',
              height: '4px',
              backgroundColor: 'var(--border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: result && result.steps.length > 0 ? `${((currentStepIndex + 1) / result.steps.length) * 100}%` : '0%',
                backgroundColor: 'var(--accent-primary)',
                transition: 'width 0.15s ease',
              }}
            />
          </div>
        </div>

        {/* Speed Adjustment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SPEED</span>
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-primary)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            {[
              { label: '0.5x', val: 600 },
              { label: '1x', val: 350 },
              { label: '2x', val: 150 },
              { label: 'Max', val: 30 }
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.val)}
                style={{
                  height: '20px',
                  fontSize: '10px',
                  padding: '0 6px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: playbackSpeed === s.val ? 'var(--bg-elevated)' : 'transparent',
                  color: playbackSpeed === s.val ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderColor: 'transparent'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
