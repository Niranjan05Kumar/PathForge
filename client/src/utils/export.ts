import { CanvasNode, CanvasEdge, PathfindResult } from '../types/graph';

function triggerDownload(jsonString: string, filename: string) {
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports current canvas topology into PathForge JSON format.
 */
export function exportGraphJson(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  directed: boolean,
  weighted: boolean,
  filename: string = 'pathforge-graph.json'
) {
  const payload = {
    generator: 'PathForge Algorithm Laboratory',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    directed,
    weighted,
    nodes: nodes.map((n) => ({
      id: n.id,
      label: n.label,
      x: n.x,
      y: n.y
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      weight: e.weight
    }))
  };

  triggerDownload(JSON.stringify(payload, null, 2), filename);
}

export interface ExperimentExportPayload {
  graph: {
    directed: boolean;
    weighted: boolean;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
  };
  result: PathfindResult;
  timestamp: string;
}

/**
 * Exports a full analytical experiment snapshot including graph topology,
 * search parameters, computed shortest path, and C++ kernel metrics.
 */
export function exportExperimentJson(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  directed: boolean,
  weighted: boolean,
  result: PathfindResult,
  filename: string = `pathforge-experiment-${Date.now()}.json`
) {
  const payload: ExperimentExportPayload = {
    graph: {
      directed,
      weighted,
      nodes,
      edges
    },
    result,
    timestamp: new Date().toISOString()
  };

  triggerDownload(JSON.stringify(payload, null, 2), filename);
}
