import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { pathfindRouter } from './routes/pathfind';
import { compareRouter } from './routes/compare';
import { getEngineBinaryPath } from './engine/engineBridge';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  let engineDiscovered = false;
  let resolvedPath: string | null = null;
  try {
    resolvedPath = getEngineBinaryPath();
    engineDiscovered = true;
  } catch {
    engineDiscovered = false;
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cppEngine: {
      discovered: engineDiscovered,
      configuredPath: process.env.CPP_ENGINE_PATH || null,
      resolvedPath
    }
  });
});

// Algorithmic Laboratory Endpoints
app.use('/api/pathfind', pathfindRouter);
app.use('/api/compare', compareRouter);

// 404 Handler for Unmatched API Endpoints
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found.'
    }
  });
});

// Serve static client bundle if client/dist exists (production mode)
const possibleClientDistPaths = [
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist')
];

for (const p of possibleClientDistPaths) {
  if (fs.existsSync(p)) {
    app.use(express.static(p));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(p, 'index.html'));
    });
    break;
  }
}

// Standard Error Envelope Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : (err.message || 'An unexpected error occurred.')
    }
  });
});

