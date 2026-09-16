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
  recordTrace?: boolean;
  graph: GraphPayload;
}

export interface CompareRequest {
  algorithms: { algorithm: string; heuristic?: string }[];
  source: string;
  target: string;
  graph: GraphPayload;
}
