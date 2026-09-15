import React, { useState } from 'react';
import {
  BenchmarkSuiteResult,
  BenchmarkAlgorithmMetrics,
  GraphGeneratorOptions,
  CanvasNode,
  CanvasEdge
} from '../types/graph';
import { runBenchmark, generateGraph } from '../services/api';

interface BenchmarkDashboardProps {
  onLoadGraphToCanvas?: (nodes: CanvasNode[], edges: CanvasEdge[], directed: boolean, weighted: boolean) => void;
  onSwitchToEditor?: () => void;
}

type TopologyType = 'sparse' | 'grid' | 'tree' | 'random' | 'dense';

interface AlgorithmChoice {
  id: string;
  name: string;
  algorithm: string;
  heuristic?: string;
  selected: boolean;
}

export const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({
  onLoadGraphToCanvas,
  onSwitchToEditor
}) => {
  // Preset options
  const [presetSize, setPresetSize] = useState<'100' | '1000' | '10000' | '100000' | 'custom'>('1000');
  const [nodeCount, setNodeCount] = useState<number>(1000);
  const [topology, setTopology] = useState<TopologyType>('sparse');
  const [seed, setSeed] = useState<number>(42);
  const [runs, setRuns] = useState<number>(5);
  const [directed, setDirected] = useState<boolean>(false);
  const [weighted, setWeighted] = useState<boolean>(true);

  // Algorithms enabled
  const [algorithms, setAlgorithms] = useState<AlgorithmChoice[]>([
    { id: 'dijkstra', name: 'Dijkstra (Indexed Min-Heap)', algorithm: 'dijkstra', selected: true },
    { id: 'astar_eucl', name: 'A* Search (Euclidean)', algorithm: 'astar', heuristic: 'euclidean', selected: true },
    { id: 'astar_manh', name: 'A* Search (Manhattan)', algorithm: 'astar', heuristic: 'manhattan', selected: false },
    { id: 'bfs', name: 'BFS (Breadth-First Search)', algorithm: 'bfs', selected: true },
    { id: 'dfs', name: 'DFS (Iterative Stack)', algorithm: 'dfs', selected: false }
  ]);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isGeneratingGraph, setIsGeneratingGraph] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkSuiteResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleSelectPreset = (size: '100' | '1000' | '10000' | '100000' | 'custom') => {
    setPresetSize(size);
    if (size === '100') {
      setNodeCount(100);
      setRuns(10);
    } else if (size === '1000') {
      setNodeCount(1000);
      setRuns(5);
    } else if (size === '10000') {
      setNodeCount(10000);
      setRuns(3);
    } else if (size === '100000') {
      setNodeCount(100000);
      setRuns(1);
    }
  };

  const toggleAlgorithm = (id: string) => {
    setAlgorithms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleRunBenchmark = async () => {
    const selectedAlgs = algorithms.filter((a) => a.selected);
    if (selectedAlgs.length === 0) {
      setErrorMessage('Please select at least one algorithm to benchmark.');
      return;
    }

    setIsRunning(true);
    setErrorMessage(null);
    setExportNotice(null);

    const graphConfig: GraphGeneratorOptions = {
      nodes: nodeCount,
      topology,
      seed,
      directed,
      weighted
    };

    const payload = {
      runs,
      graphConfig,
      algorithms: selectedAlgs.map((a) => ({
        algorithm: a.algorithm,
        heuristic: a.heuristic
      }))
    };

    try {
      const resp = await runBenchmark(payload);
      if (resp.success && resp.data) {
        setBenchmarkResult(resp.data);
      } else {
        setErrorMessage(resp.error?.message || 'Benchmark execution failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with benchmark service.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadGraphIntoWorkbench = async () => {
    if (nodeCount > 2000) {
      setErrorMessage('Direct canvas rendering is limited to V <= 2,000 to maintain 60 FPS animation.');
      return;
    }

    setIsGeneratingGraph(true);
    setErrorMessage(null);

    try {
      const resp = await generateGraph({
        nodes: nodeCount,
        topology,
        seed,
        directed,
        weighted
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

        if (onLoadGraphToCanvas) {
          onLoadGraphToCanvas(generatedNodes, generatedEdges, directed, weighted);
        }
        if (onSwitchToEditor) {
          onSwitchToEditor();
        }
      } else {
        setErrorMessage(resp.error?.message || 'Failed generating graph for canvas.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating graph.');
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  const handleExportSummary = () => {
    if (!benchmarkResult) return;

    const summaryMd = [
      `# PathForge Algorithm Benchmark Summary`,
      `- Date: ${new Date().toISOString()}`,
      `- Topology: ${benchmarkResult.graphSummary.topology} (Seed: ${benchmarkResult.graphSummary.seed})`,
      `- Graph Scale: V = ${benchmarkResult.graphSummary.nodes.toLocaleString()}, E = ${benchmarkResult.graphSummary.edges.toLocaleString()}`,
      `- Iterations (Runs): ${benchmarkResult.runs}`,
      `- Optimal Cost Parity: ${benchmarkResult.costMatch ? 'VERIFIED (100% Match)' : 'DIVERGED'}`,
      `- Fastest: ${benchmarkResult.fastest.toUpperCase()}`,
      `- Fewest Nodes Visited: ${benchmarkResult.fewestVisited.toUpperCase()}`,
      ``,
      `| Algorithm | Avg Time (ms) | Min (ms) | Max (ms) | Std Dev | Nodes Visited | Edges Examined | Relaxations | Cost |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
      ...benchmarkResult.results.map(
        (r) =>
          `| ${r.algorithm.toUpperCase()}${r.heuristic ? ` (${r.heuristic})` : ''} | ${r.avgTimeMs.toFixed(4)} | ${r.minTimeMs.toFixed(4)} | ${r.maxTimeMs.toFixed(4)} | ${r.stdDevTimeMs.toFixed(4)} | ${r.avgNodesVisited.toLocaleString()} | ${r.avgEdgesExamined.toLocaleString()} | ${r.avgEdgeRelaxations.toLocaleString()} | ${r.pathCost ?? 'N/A'} |`
      )
    ].join('\n');

    navigator.clipboard.writeText(summaryMd);
    setExportNotice('Benchmark report copied to clipboard in Markdown format!');
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Compute maximum metrics for chart bar scaling
  const maxTime = benchmarkResult
    ? Math.max(...benchmarkResult.results.map((r) => r.avgTimeMs), 0.0001)
    : 1;

  const maxVisited = benchmarkResult
    ? Math.max(...benchmarkResult.results.map((r) => r.avgNodesVisited), 1)
    : 1;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
        padding: '24px 32px'
      }}
    >
      {/* Dashboard Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--accent-muted)'
              }}
            >
              NATIVE C++ DSA BENCHMARK SUITE
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              MODE: BENCHMARK (ZERO TRACE OVERHEAD)
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            High-Performance Synthetic Graph Benchmarking
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Stress test, profile, and verify mathematical optimality across 100 to 100,000+ nodes using isolated C++ kernel timers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onSwitchToEditor && (
            <button onClick={onSwitchToEditor} className="btn-secondary" style={{ height: '32px', fontSize: '12px' }}>
              ← Return to Canvas Editor
            </button>
          )}
          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="btn-primary"
            style={{ height: '32px', fontSize: '12px', minWidth: '170px' }}
          >
            {isRunning ? 'Benchmarking Engine...' : '⚡ Run C++ Benchmark'}
          </button>
        </div>
      </div>

      {/* Notifications / Errors */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'rgba(229, 83, 75, 0.12)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--color-error)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>⚠ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {exportNotice && (
        <div
          style={{
            backgroundColor: 'rgba(63, 185, 80, 0.12)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--color-success)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          ✓ {exportNotice}
        </div>
      )}

      {/* Configuration Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Panel 1: Graph Scale & Preset */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            1. Scale Presets (Vertices)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
            <button
              onClick={() => handleSelectPreset('100')}
              className={presetSize === '100' ? 'btn-primary' : 'btn-ghost'}
              style={{ height: '28px', fontSize: '11px', border: '1px solid var(--border)' }}
            >
              100
            </button>
            <button
              onClick={() => handleSelectPreset('1000')}
              className={presetSize === '1000' ? 'btn-primary' : 'btn-ghost'}
              style={{ height: '28px', fontSize: '11px', border: '1px solid var(--border)' }}
            >
              1K
            </button>
            <button
              onClick={() => handleSelectPreset('10000')}
              className={presetSize === '10000' ? 'btn-primary' : 'btn-ghost'}
              style={{ height: '28px', fontSize: '11px', border: '1px solid var(--border)' }}
            >
              10K
            </button>
            <button
              onClick={() => handleSelectPreset('100000')}
              className={presetSize === '100000' ? 'btn-primary' : 'btn-ghost'}
              style={{ height: '28px', fontSize: '11px', border: '1px solid var(--border)' }}
            >
              100K
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '90px' }}>Vertex Count:</label>
            <input
              type="number"
              min={2}
              max={100000}
              value={nodeCount}
              onChange={(e) => {
                setNodeCount(Math.max(2, Math.min(100000, parseInt(e.target.value) || 2)));
                setPresetSize('custom');
              }}
              className="select-field"
              style={{ flex: 1, height: '28px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Panel 2: Topology & Seeds */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            2. Topology & Determinism
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                TOPOLOGY TYPE
              </label>
              <select
                value={topology}
                onChange={(e) => setTopology(e.target.value as TopologyType)}
                className="select-field"
                style={{ width: '100%', height: '28px', fontSize: '11px' }}
              >
                <option value="sparse">Sparse Network (Avg Deg ~3)</option>
                <option value="grid">2D Square Grid</option>
                <option value="tree">Connected Tree (V - 1 Edges)</option>
                <option value="random">Erdős–Rényi Random</option>
                <option value="dense">Dense Network (25% Density)</option>
              </select>
            </div>

            <div style={{ width: '100px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                RNG SEED
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  className="select-field"
                  style={{ width: '60px', height: '28px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                />
                <button
                  onClick={() => setSeed(Math.floor(Math.random() * 999999) + 1)}
                  title="Generate Random Seed"
                  className="btn-ghost"
                  style={{ width: '28px', height: '28px', padding: 0, border: '1px solid var(--border)' }}
                >
                  🎲
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />
              Weighted Edges
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={directed} onChange={(e) => setDirected(e.target.checked)} />
              Directed Edges
            </label>
          </div>
        </div>

        {/* Panel 3: Algorithms & Multi-Run */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Suite Algorithms
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Runs:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={runs}
                onChange={(e) => setRuns(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="select-field"
                style={{ width: '45px', height: '24px', fontSize: '11px', padding: '0 4px', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {algorithms.map((alg) => (
              <label
                key={alg.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: alg.selected ? 'var(--bg-elevated)' : 'transparent'
                }}
              >
                <input type="checkbox" checked={alg.selected} onChange={() => toggleAlgorithm(alg.id)} />
                <span style={{ color: alg.selected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {alg.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {benchmarkResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary Metric Header */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Network Scale</div>
                <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  V = {benchmarkResult.graphSummary.nodes.toLocaleString()} | E = {benchmarkResult.graphSummary.edges.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Iterations</div>
                <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {benchmarkResult.runs} Runs (Warm-up Primes Caches)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fastest Algorithm</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  ⚡ {benchmarkResult.fastest.toUpperCase()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fewest Visited</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  🎯 {benchmarkResult.fewestVisited.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Cost Parity Badge & Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: benchmarkResult.costMatch ? 'rgba(63, 185, 80, 0.15)' : 'rgba(229, 83, 75, 0.15)',
                  border: `1px solid ${benchmarkResult.costMatch ? 'var(--color-success)' : 'var(--color-error)'}`,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: benchmarkResult.costMatch ? 'var(--color-success)' : 'var(--color-error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{benchmarkResult.costMatch ? '✓' : '⚠'}</span>
                <span>{benchmarkResult.costMatch ? 'COST PARITY: VERIFIED (100% MATCH)' : 'COST DIVERGENCE DETECTED'}</span>
              </div>

              <button
                onClick={handleExportSummary}
                className="btn-secondary"
                style={{ height: '30px', fontSize: '11px' }}
              >
                📋 Copy Markdown Report
              </button>

              {nodeCount <= 2000 && onLoadGraphToCanvas && (
                <button
                  onClick={handleLoadGraphIntoWorkbench}
                  disabled={isGeneratingGraph}
                  className="btn-ghost"
                  style={{ height: '30px', fontSize: '11px', border: '1px solid var(--border)' }}
                >
                  {isGeneratingGraph ? 'Loading...' : '🔍 Inspect on Canvas'}
                </button>
              )}
            </div>
          </div>

          {/* Comparative Performance Visual Charts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Chart 1: Average Execution Time (ms) */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Execution Kernel Time (ms) — Lower is Better
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Min / Avg / Max
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {benchmarkResult.results.map((r) => {
                  const pct = Math.max(3, (r.avgTimeMs / maxTime) * 100);
                  const isFastest = r.algorithm === benchmarkResult.fastest;

                  return (
                    <div key={r.algorithm + (r.heuristic || '')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                        <span style={{ fontWeight: isFastest ? 700 : 500, color: isFastest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {r.algorithm.toUpperCase()}{r.heuristic ? ` (${r.heuristic})` : ''}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {r.avgTimeMs.toFixed(3)} ms (±{r.stdDevTimeMs.toFixed(3)})
                        </span>
                      </div>
                      <div
                        style={{
                          height: '20px',
                          backgroundColor: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: isFastest ? 'var(--accent-primary)' : '#4a5568',
                            transition: 'width 0.4s ease-out',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '6px'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            left: '8px',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: pct > 25 ? '#111315' : 'var(--text-secondary)',
                            fontWeight: 600
                          }}
                        >
                          min: {r.minTimeMs.toFixed(3)} ms | max: {r.maxTimeMs.toFixed(3)} ms
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Nodes Visited / Search Pruning */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Search Space Pruning (Nodes Visited) — Fewer is More Efficient
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  State Exploration
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {benchmarkResult.results.map((r) => {
                  const pct = Math.max(3, (r.avgNodesVisited / maxVisited) * 100);
                  const isFewest = r.algorithm === benchmarkResult.fewestVisited;

                  return (
                    <div key={r.algorithm + (r.heuristic || '')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                        <span style={{ fontWeight: isFewest ? 700 : 500, color: isFewest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {r.algorithm.toUpperCase()}{r.heuristic ? ` (${r.heuristic})` : ''}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {r.avgNodesVisited.toLocaleString()} nodes ({((r.avgNodesVisited / benchmarkResult.graphSummary.nodes) * 100).toFixed(1)}% of V)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '20px',
                          backgroundColor: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: isFewest ? '#38a169' : '#4a5568',
                            transition: 'width 0.4s ease-out'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            left: '8px',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: pct > 30 ? '#ffffff' : 'var(--text-secondary)',
                            fontWeight: 600
                          }}
                        >
                          Examined {r.avgEdgesExamined.toLocaleString()} edges | {r.avgEdgeRelaxations.toLocaleString()} relaxations
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Statistical Metrics Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Statistical Measurement Matrix
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Isolated C++ Kernel Clocks
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px' }}>ALGORITHM</th>
                    <th style={{ padding: '10px 14px' }}>HEURISTIC</th>
                    <th style={{ padding: '10px 14px' }}>AVG TIME (MS)</th>
                    <th style={{ padding: '10px 14px' }}>MIN / MAX (MS)</th>
                    <th style={{ padding: '10px 14px' }}>STD DEV (σ)</th>
                    <th style={{ padding: '10px 14px' }}>NODES VISITED</th>
                    <th style={{ padding: '10px 14px' }}>EDGES EXAMINED</th>
                    <th style={{ padding: '10px 14px' }}>RELAXATIONS</th>
                    <th style={{ padding: '10px 14px' }}>PATH COST</th>
                    <th style={{ padding: '10px 14px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResult.results.map((r: BenchmarkAlgorithmMetrics, idx: number) => {
                    const isFastest = r.algorithm === benchmarkResult.fastest;
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: isFastest ? 'var(--accent-subtle)' : idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: isFastest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {r.algorithm.toUpperCase()}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {r.heuristic || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: isFastest ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {r.avgTimeMs.toFixed(4)} ms
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {r.minTimeMs.toFixed(3)} / {r.maxTimeMs.toFixed(3)}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          ±{r.stdDevTimeMs.toFixed(4)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {r.avgNodesVisited.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {r.avgEdgesExamined.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {r.avgEdgeRelaxations.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                          {r.pathCost !== null ? r.pathCost.toFixed(2) : 'No Path'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '10px',
                              backgroundColor: r.found ? 'rgba(63, 185, 80, 0.15)' : 'rgba(229, 83, 75, 0.15)',
                              color: r.found ? 'var(--color-success)' : 'var(--color-error)'
                            }}
                          >
                            {r.found ? 'OPTIMAL' : 'UNREACHABLE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Call to Action */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '48px 24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-subtle)',
              border: '1px solid var(--accent-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginBottom: '16px'
            }}
          >
            ⚡
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>
            No Active Benchmark Run
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 0 20px 0' }}>
            Configure your network scale (up to 100,000 nodes), topology, and algorithms above, then run the native C++ benchmark harness.
          </p>
          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="btn-primary"
            style={{ height: '36px', padding: '0 20px', fontSize: '13px' }}
          >
            {isRunning ? 'Benchmarking Engine...' : 'Run Benchmark (1,000 Nodes)'}
          </button>
        </div>
      )}
    </div>
  );
};
