import { Router, Request, Response } from 'express';
import { validatePathfindRequest } from '../validation/graphValidator';
import { executeEngine } from '../engine/engineBridge';

export const compareRouter = Router();

compareRouter.post('/', async (req: Request, res: Response) => {
  const { algorithms, source, target, graph } = req.body;

  if (!Array.isArray(algorithms) || algorithms.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: "Field 'algorithms' must be a non-empty array of algorithm configurations."
      }
    });
  }

  // Pre-validate every algorithm configuration
  for (const algSpec of algorithms) {
    const candidatePayload = {
      ...algSpec,
      source,
      target,
      graph,
      recordTrace: false
    };

    const validation = validatePathfindRequest(candidatePayload);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
  }

  try {
    const results: any[] = [];

    // Execute each algorithm (omits detailed visualization steps for comparison efficiency)
    for (const algSpec of algorithms) {
      const payload = {
        ...algSpec,
        source,
        target,
        graph,
        recordTrace: false
      };

      const response = await executeEngine(payload);
      if (!response.success) {
        return res.status(400).json(response);
      }
      results.push(response.data);
    }

    // Determine cost parity among optimal algorithms (Dijkstra and A*)
    const optimalResults = results.filter(
      r => (r.algorithm === 'dijkstra' || r.algorithm === 'astar') && r.found && r.cost !== null
    );

    let costParity = true;
    if (optimalResults.length > 1) {
      const baseCost = optimalResults[0].cost;
      for (let i = 1; i < optimalResults.length; ++i) {
        if (Math.abs(optimalResults[i].cost - baseCost) > 1e-6) {
          costParity = false;
          break;
        }
      }
    }

    // Identify fastest algorithm and fewest nodes visited
    let fastest = results[0]?.algorithm || '';
    let minTime = results[0]?.metrics?.executionTimeMs ?? Infinity;

    let fewestVisited = results[0]?.algorithm || '';
    let minVisited = results[0]?.metrics?.nodesVisited ?? Infinity;

    for (const r of results) {
      if (r.metrics) {
        if (r.metrics.executionTimeMs < minTime) {
          minTime = r.metrics.executionTimeMs;
          fastest = r.algorithm;
        }
        if (r.metrics.nodesVisited < minVisited) {
          minVisited = r.metrics.nodesVisited;
          fewestVisited = r.algorithm;
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        results,
        costParity,
        fastest,
        fewestVisited
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred during comparison.'
      }
    });
  }
});
