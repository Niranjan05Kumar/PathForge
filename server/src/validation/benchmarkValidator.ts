export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

const SUPPORTED_TOPOLOGIES = new Set(['random', 'sparse', 'dense', 'grid', 'tree']);
const SUPPORTED_ALGORITHMS = new Set(['bfs', 'dfs', 'dijkstra', 'astar']);
const SUPPORTED_HEURISTICS = new Set(['zero', 'euclidean', 'manhattan']);

export function validateGenerateGraphRequest(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Request body must be a valid JSON object.' }
    };
  }

  const config = body.graphConfig || body;
  const nodes = config.nodes;

  if (nodes !== undefined) {
    if (typeof nodes !== 'number' || !Number.isInteger(nodes) || nodes <= 0) {
      return {
        valid: false,
        error: { code: 'INVALID_NODES', message: 'Field nodes must be a positive integer.' }
      };
    }
    if (nodes > 100000) {
      return {
        valid: false,
        error: { code: 'NODES_EXCEED_LIMIT', message: 'Node count cannot exceed 100,000 for synthetic generation.' }
      };
    }
  }

  const topology = (config.topology || 'sparse').toLowerCase();
  if (!SUPPORTED_TOPOLOGIES.has(topology)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TOPOLOGY',
        message: `Topology '${config.topology}' is not supported. Supported: random, sparse, dense, grid, tree.`
      }
    };
  }

  return { valid: true };
}

export function validateBenchmarkRequest(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Request body must be a valid JSON object.' }
    };
  }

  // Must contain either graphConfig or graph
  if (!body.graphConfig && !body.graph) {
    return {
      valid: false,
      error: {
        code: 'MISSING_FIELD',
        message: "Benchmark request must specify either 'graphConfig' (for synthetic) or 'graph' (for uploaded/active graph)."
      }
    };
  }

  if (body.graphConfig) {
    const genVal = validateGenerateGraphRequest({ graphConfig: body.graphConfig });
    if (!genVal.valid) {
      return genVal;
    }
  }

  if (body.runs !== undefined) {
    if (typeof body.runs !== 'number' || !Number.isInteger(body.runs) || body.runs < 1) {
      return {
        valid: false,
        error: { code: 'INVALID_RUNS', message: 'Field runs must be an integer >= 1.' }
      };
    }
    if (body.runs > 100) {
      return {
        valid: false,
        error: { code: 'RUNS_EXCEED_LIMIT', message: 'Run count cannot exceed 100.' }
      };
    }
  }

  if (body.algorithms !== undefined) {
    if (!Array.isArray(body.algorithms) || body.algorithms.length === 0) {
      return {
        valid: false,
        error: { code: 'INVALID_ALGORITHMS', message: "Field 'algorithms' must be a non-empty array." }
      };
    }

    for (const algItem of body.algorithms) {
      const algName = (typeof algItem === 'string' ? algItem : algItem?.algorithm)?.toLowerCase();
      if (!algName || !SUPPORTED_ALGORITHMS.has(algName)) {
        return {
          valid: false,
          error: {
            code: 'INVALID_ALGORITHM',
            message: `Algorithm '${algName}' is not supported. Supported: bfs, dfs, dijkstra, astar.`
          }
        };
      }

      if (algName === 'astar' && typeof algItem === 'object' && algItem.heuristic) {
        const h = algItem.heuristic.toLowerCase();
        if (!SUPPORTED_HEURISTICS.has(h)) {
          return {
            valid: false,
            error: {
              code: 'INVALID_HEURISTIC',
              message: `Heuristic '${algItem.heuristic}' is not supported. Supported: zero, euclidean, manhattan.`
            }
          };
        }
      }
    }
  }

  return { valid: true };
}
