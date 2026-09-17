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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
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

  if (!source || typeof source !== 'string' || !source.trim()) {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'source' is required and must be a non-empty string." }
    };
  }

  if (!target || typeof target !== 'string' || !target.trim()) {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'target' is required and must be a non-empty string." }
    };
  }

  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    return {
      valid: false,
      error: { code: 'MISSING_FIELD', message: "Field 'graph' object is required." }
    };
  }

  // BFS and DFS are available strictly on unweighted and undirected graphs
  if (normalizedAlgo === 'bfs' || normalizedAlgo === 'dfs') {
    const isDirected = Boolean(graph.directed);
    const isWeighted = Boolean(graph.weighted);
    if (isDirected || isWeighted) {
      return {
        valid: false,
        error: {
          code: 'INVALID_ALGORITHM_FOR_GRAPH',
          message: `Algorithm '${algorithm.toUpperCase()}' is only supported on unweighted and undirected graphs.`
        }
      };
    }
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
    if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id.trim()) {
      return {
        valid: false,
        error: { code: 'INVALID_NODE', message: "Each node must have a valid non-empty 'id' string." }
      };
    }

    if (nodeSet.has(node.id)) {
      return {
        valid: false,
        error: { code: 'DUPLICATE_NODE', message: `Duplicate node ID '${node.id}' detected in graph.` }
      };
    }

    if (isGeometricHeuristic) {
      if (typeof node.x !== 'number' || typeof node.y !== 'number' || isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
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
    const edgeSet = new Set<string>();
    const isDirected = Boolean(graph.directed);
    const allowSelfLoops = Boolean(graph.allowSelfLoops);
    const allowDuplicateEdges = Boolean(graph.allowDuplicateEdges);

    for (const edge of graph.edges) {
      if (!edge || typeof edge !== 'object' || typeof edge.source !== 'string' || typeof edge.target !== 'string') {
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

      if (!allowSelfLoops && edge.source === edge.target) {
        return {
          valid: false,
          error: {
            code: 'SELF_LOOP_DISALLOWED',
            message: `Self-loops are not allowed: '${edge.source}' -> '${edge.target}'.`
          }
        };
      }

      const edgeKey = isDirected
        ? `${edge.source}->${edge.target}`
        : (edge.source < edge.target ? `${edge.source}--${edge.target}` : `${edge.target}--${edge.source}`);

      if (!allowDuplicateEdges && edgeSet.has(edgeKey)) {
        return {
          valid: false,
          error: {
            code: 'DUPLICATE_EDGE',
            message: `Duplicate edge detected between '${edge.source}' and '${edge.target}'.`
          }
        };
      }
      edgeSet.add(edgeKey);

      if (typeof edge.weight !== 'undefined') {
        if (typeof edge.weight !== 'number' || isNaN(edge.weight) || !isFinite(edge.weight)) {
          return {
            valid: false,
            error: {
              code: 'INVALID_EDGE_WEIGHT',
              message: `Edge weight between '${edge.source}' and '${edge.target}' must be a valid finite number.`
            }
          };
        }

        if (edge.weight < 0) {
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
  } else if (typeof graph.edges !== 'undefined') {
    return {
      valid: false,
      error: { code: 'INVALID_GRAPH', message: "Field 'edges' must be an array if provided." }
    };
  }

  return { valid: true };
}
