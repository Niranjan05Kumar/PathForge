import { Router, Request, Response } from 'express';
import { validateBenchmarkRequest } from '../validation/benchmarkValidator';
import { executeEngine } from '../engine/engineBridge';

export const benchmarkRouter = Router();

async function handleBenchmark(req: Request, res: Response) {
  const validation = validateBenchmarkRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  try {
    const payload = {
      command: 'benchmark',
      ...req.body
    };

    const engineResponse = await executeEngine(payload, 30000); // 30s timeout for large benchmarks

    if (engineResponse.success) {
      return res.status(200).json(engineResponse);
    }

    const errorCode = engineResponse.error?.code;
    let statusCode = 400;
    if (errorCode === 'EXECUTION_TIMEOUT') {
      statusCode = 504;
    } else if (
      errorCode === 'ENGINE_NOT_FOUND' ||
      errorCode === 'PROCESS_SPAWN_ERROR' ||
      errorCode === 'ENGINE_ABNORMAL_EXIT'
    ) {
      statusCode = 500;
    }

    return res.status(statusCode).json(engineResponse);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred during benchmark execution.'
      }
    });
  }
}

// Support both POST /api/benchmark/run and POST /api/benchmark
benchmarkRouter.post('/run', handleBenchmark);
benchmarkRouter.post('/', handleBenchmark);
