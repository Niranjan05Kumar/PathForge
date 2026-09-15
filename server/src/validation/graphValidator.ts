export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

const SUPPORTED_ALGORITHMS = new Set(['bfs', 'dfs', 'dijkstra', 'astar']);
const SUPPORTED_HEURISTICS = new Set(['zero', 'euclidean', 'manhattan']);

export function validatePathfindRequest(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Request body must be a valid JSON object.' }
    };
  }

  const { algorithm, heuristic, source, target, graph } = body;

  if (!algorithm || typeof algorithm !== 'string') {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'algorithm' is required and must be a string." }
    };
  }

  const normalizedAlgo = algorithm.toLowerCase();
  if (!SUPPORTED_ALGORITHMS.has(normalizedAlgo)) {
    return {
      valid: false,
      error: { code: 'INVALID_ALGORITHM', message: `Algorithm '${algorithm}' is not supported. Supported: bfs, dfs, dijkstra, astar.` }
    };
  }

  if (normalizedAlgo === 'astar') {
    const h = (heuristic || 'euclidean').toLowerCase();
    if (!SUPPORTED_HEURISTICS.has(h)) {
      return {
        valid: false,
        error: { code: 'INVALID_HEURISTIC', message: `Heuristic '${heuristic}' is not supported. Supported: zero, euclidean, manhattan.` }
      };
    }
  }

  if (!source || typeof source !== 'string') {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'source' is required and must be a non-empty string." }
    };
  }

  if (!target || typeof target !== 'string') {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'target' is required and must be a non-empty string." }
    };
  }

  if (!graph || typeof graph !== 'object') {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'graph' object is required." }
    };
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    return {
      valid: false,
      error: { code: 'EMPTY_GRAPH', message: 'Graph must contain at least one node.' }
    };
  }

  const nodeSet = new Set<string>();
  const isGeometricHeuristic = normalizedAlgo === 'astar' && (heuristic || 'euclidean').toLowerCase() !== 'zero';

  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id.trim()) {
      return {
        valid: false,
        error: { code: 'INVALID_NODE', message: "Each node must have a valid non-empty 'id' string." }
      };
    }

    if (isGeometricHeuristic) {
      if (typeof node.x !== 'number' || typeof node.y !== 'number' || isNaN(node.x) || isNaN(node.y)) {
        return {
          valid: false,
          error: {
            code: 'MISSING_NODE_COORDINATES',
            message: `Node '${node.id}' is missing valid numeric (x, y) coordinates required for geometric heuristic.`
          }
        };
      }
    }

    nodeSet.add(node.id);
  }

  if (!nodeSet.has(source)) {
    return {
      valid: false,
      error: { code: 'INVALID_NODE', message: `Source node '${source}' does not exist in graph.` }
    };
  }

  if (!nodeSet.has(target)) {
    return {
      valid: false,
      error: { code: 'INVALID_NODE', message: `Target node '${target}' does not exist in graph.` }
    };
  }

  if (Array.isArray(graph.edges)) {
    for (const edge of graph.edges) {
      if (!edge || typeof edge.source !== 'string' || typeof edge.target !== 'string') {
        return {
          valid: false,
          error: { code: 'INVALID_EDGE', message: "Each edge must define string 'source' and 'target' properties." }
        };
      }

      if (!nodeSet.has(edge.source)) {
        return {
          valid: false,
          error: { code: 'INVALID_NODE', message: `Edge source '${edge.source}' does not exist in graph.` }
        };
      }

      if (!nodeSet.has(edge.target)) {
        return {
          valid: false,
          error: { code: 'INVALID_NODE', message: `Edge target '${edge.target}' does not exist in graph.` }
        };
      }

      if (typeof edge.weight === 'number' && edge.weight < 0) {
        return {
          valid: false,
          error: {
            code: 'NEGATIVE_EDGE_WEIGHT',
            message: `Negative edge weight ${edge.weight} is not supported between '${edge.source}' and '${edge.target}'.`
          }
        };
      }
    }
  }

  return { valid: true };
}
