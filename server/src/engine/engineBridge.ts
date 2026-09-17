import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface EngineError {
  code: string;
  message: string;
}

export interface EngineResponse<T = any> {
  success: boolean;
  data?: T;
  error?: EngineError;
}

export function getEngineBinaryPath(): string {
  const candidatePaths = [
    process.env.CPP_ENGINE_PATH ? path.resolve(process.cwd(), process.env.CPP_ENGINE_PATH) : null,
    path.resolve(__dirname, '../../../engine/build/pathforge-engine.exe'),
    path.resolve(__dirname, '../../engine/build/pathforge-engine.exe'),
    path.resolve(process.cwd(), 'engine/build/pathforge-engine.exe'),
    path.resolve(process.cwd(), '../engine/build/pathforge-engine.exe'),
    path.resolve(__dirname, '../../../engine/build/pathforge-engine'),
    path.resolve(__dirname, '../../engine/build/pathforge-engine'),
    path.resolve(process.cwd(), 'engine/build/pathforge-engine')
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(`C++ Engine binary not found. Searched paths: ${candidatePaths.join(', ')}`);
}

export function executeEngine(payload: any, timeoutMs = 15000): Promise<EngineResponse> {
  return new Promise((resolve, reject) => {
    let enginePath: string;
    try {
      enginePath = getEngineBinaryPath();
    } catch (err: any) {
      return resolve({
        success: false,
        error: {
          code: 'ENGINE_NOT_FOUND',
          message: err.message
        }
      });
    }

    // Spawn C++ executable strictly via child_process.spawn() - Non-Negotiable Rule 4
    const child = spawn(enginePath, ['--ipc'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let isTimedOut = false;

    // 15-second execution timeout guard
    const timer = setTimeout(() => {
      isTimedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // Process already closed
        }
      }, 1000);

      resolve({
        success: false,
        error: {
          code: 'EXECUTION_TIMEOUT',
          message: `Engine execution timed out after ${timeoutMs}ms.`
        }
      });
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (isTimedOut) return;
      resolve({
        success: false,
        error: {
          code: 'PROCESS_SPAWN_ERROR',
          message: `Failed to spawn C++ engine: ${err.message}`
        }
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (isTimedOut) return;

      if (!stdoutBuffer.trim()) {
        return resolve({
          success: false,
          error: {
            code: 'ENGINE_ABNORMAL_EXIT',
            message: `Engine process exited with code ${code}. Stderr: ${stderrBuffer || '(none)'}`
          }
        });
      }

      try {
        const parsed = JSON.parse(stdoutBuffer.trim());
        resolve(parsed);
      } catch (parseError: any) {
        const snippet = stdoutBuffer.length > 200 ? stdoutBuffer.slice(0, 200) + '...' : stdoutBuffer;
        resolve({
          success: false,
          error: {
            code: 'MALFORMED_ENGINE_OUTPUT',
            message: `Failed to parse engine output JSON: ${parseError.message}. Raw output: ${snippet}`
          }
        });
      }
    });

    // Stream validated JSON payload directly into child process stdin
    try {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    } catch (writeErr: any) {
      clearTimeout(timer);
      resolve({
        success: false,
        error: {
          code: 'STDIN_WRITE_ERROR',
          message: `Failed writing payload to engine stdin: ${writeErr.message}`
        }
      });
    }
  });
}
