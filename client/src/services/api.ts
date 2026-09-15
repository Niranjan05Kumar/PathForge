import { PathfindRequest, PathfindResult, CompareRequest, CompareResult } from '../types/graph';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function runPathfind(payload: PathfindRequest): Promise<ApiResponse<PathfindResult>> {
  try {
    const res = await fetch('/api/pathfind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to communicate with API server.'
      }
    };
  }
}

export async function runCompare(payload: CompareRequest): Promise<ApiResponse<CompareResult>> {
  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to communicate with API server.'
      }
    };
  }
}

export async function checkHealth(): Promise<any> {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
}
