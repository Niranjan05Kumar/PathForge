import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const defaultEnginePath = path.resolve(__dirname, '../../engine/build/pathforge-engine.exe');
  const configuredPath = process.env.CPP_ENGINE_PATH 
    ? path.resolve(__dirname, '..', process.env.CPP_ENGINE_PATH) 
    : defaultEnginePath;
  
  const engineExists = fs.existsSync(configuredPath) || fs.existsSync(defaultEnginePath);

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cppEngine: {
      discovered: engineExists,
      configuredPath,
      resolvedPath: fs.existsSync(configuredPath) ? configuredPath : (fs.existsSync(defaultEnginePath) ? defaultEnginePath : null)
    }
  });
});

// Standard Error Envelope Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.'
    }
  });
});
