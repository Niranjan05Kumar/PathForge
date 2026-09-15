export interface CanvasNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface AlgorithmMetrics {
  nodesVisited: number;
  edgesExamined: number;
  edgeRelaxations: number;
  executionTimeMs: number;
}

export interface TraceStep {
  step: number;
  action: string;
  nodeId: string;
  targetId?: string;
  edgeWeight?: number;
  frontier: string[];
  visited: string[];
  description: string;
}

export interface PathfindResult {
  algorithm: string;
  source: string;
  target: string;
  found: boolean;
  path: string[];
  cost: number | null;
  metrics: AlgorithmMetrics;
  steps: TraceStep[];
}

export interface CompareResult {
  results: PathfindResult[];
  costParity: boolean;
  fastest: string;
  fewestVisited: string;
}

export interface GraphPayload {
  directed: boolean;
  weighted: boolean;
  nodes: { id: string; label?: string; x: number; y: number }[];
  edges: { source: string; target: string; weight: number }[];
}

export interface PathfindRequest {
  algorithm: string;
  heuristic?: string;
  source: string;
  target: string;
  mode?: 'visualize' | 'benchmark';
  graph: GraphPayload;
}

export interface CompareRequest {
  algorithms: { algorithm: string; heuristic?: string }[];
  source: string;
  target: string;
  graph: GraphPayload;
}

export interface GraphGeneratorOptions {
  nodes: number;
  edges?: number;
  density?: number;
  topology: 'random' | 'sparse' | 'dense' | 'grid' | 'tree';
  directed?: boolean;
  weighted?: boolean;
  seed?: number;
  minWeight?: number;
  maxWeight?: number;
}

export interface BenchmarkAlgorithmMetrics {
  algorithm: string;
  heuristic?: string;
  runs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  stdDevTimeMs: number;
  avgNodesVisited: number;
  avgEdgesExamined: number;
  avgEdgeRelaxations: number;
  pathCost: number | null;
  found: boolean;
}

export interface BenchmarkSuiteResult {
  success: boolean;
  graphSummary: {
    nodes: number;
    edges: number;
    topology: string;
    directed: boolean;
    weighted: boolean;
    seed: number;
  };
  source: string;
  target: string;
  runs: number;
  costMatch: boolean;
  fastest: string;
  fewestVisited: string;
  results: BenchmarkAlgorithmMetrics[];
}

export interface BenchmarkRequest {
  runs?: number;
  graphConfig?: GraphGeneratorOptions;
  graph?: GraphPayload;
  source?: string;
  target?: string;
  algorithms?: Array<string | { algorithm: string; heuristic?: string }>;
}

export interface GenerateGraphResponse {
  success: boolean;
  topology: string;
  seed: number;
  directed: boolean;
  weighted: boolean;
  nodeCount: number;
  edgeCount: number;
  nodes: Array<{ id: string; label: string; x?: number; y?: number }>;
  edges: Array<{ source: string; target: string; weight: number }>;
}
