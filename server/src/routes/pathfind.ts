import { Router, Request, Response } from 'express';
import { validatePathfindRequest } from '../validation/graphValidator';
import { executeEngine } from '../engine/engineBridge';

export const pathfindRouter = Router();

pathfindRouter.post('/', async (req: Request, res: Response) => {
  // Pre-execution validation
  const validation = validatePathfindRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }

  try {
    const engineResponse = await executeEngine(req.body);

    if (engineResponse.success) {
      return res.status(200).json(engineResponse);
    }

    // Map specific C++ engine error codes to HTTP status codes
    const errorCode = engineResponse.error?.code;
    let statusCode = 400;

    if (errorCode === 'EXECUTION_TIMEOUT') {
      statusCode = 504;
    } else if (errorCode === 'ENGINE_NOT_FOUND' || errorCode === 'PROCESS_SPAWN_ERROR' || errorCode === 'ENGINE_ABNORMAL_EXIT') {
      statusCode = 500;
    }

    return res.status(statusCode).json(engineResponse);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred executing pathfinding.'
      }
    });
  }
});
