import { CanvasNode } from '../types/graph';

export interface PanOffset {
  x: number;
  y: number;
}

export interface ViewportBox {
  width: number;
  height: number;
}

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3.0;
export const ZOOM_STEP = 0.15;

/**
 * Converts screen/pointer coordinates into the graph SVG coordinate space,
 * taking current pan offset and zoom scaling into account.
 */
export function screenToGraph(
  clientX: number,
  clientY: number,
  svgRect: DOMRect,
  pan: PanOffset,
  zoom: number
): { x: number; y: number } {
  const safeZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom || 1.0));
  const screenX = clientX - svgRect.left;
  const screenY = clientY - svgRect.top;

  return {
    x: Math.round((screenX - pan.x) / safeZoom),
    y: Math.round((screenY - pan.y) / safeZoom),
  };
}

/**
 * Calculates optimal zoom and pan to fit all graph nodes within the viewport.
 */
export function calculateFitToScreen(
  nodes: CanvasNode[],
  viewport: ViewportBox,
  padding = 60
): { pan: PanOffset; zoom: number } {
  if (!nodes || nodes.length === 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { pan: { x: 0, y: 0 }, zoom: 1.0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.x < minX) minX = node.x;
    if (node.x > maxX) maxX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.y > maxY) maxY = node.y;
  }

  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  // Single node or nodes at exact same point
  if (graphWidth <= 10 && graphHeight <= 10) {
    const panX = viewport.width / 2 - minX;
    const panY = viewport.height / 2 - minY;
    return { pan: { x: Math.round(panX), y: Math.round(panY) }, zoom: 1.0 };
  }

  const availWidth = Math.max(50, viewport.width - padding * 2);
  const availHeight = Math.max(50, viewport.height - padding * 2);

  const scaleX = availWidth / (graphWidth || 1);
  const scaleY = availHeight / (graphHeight || 1);
  const rawZoom = Math.min(scaleX, scaleY);
  const zoom = Math.max(MIN_ZOOM, Math.min(1.5, +rawZoom.toFixed(2)));

  // Center the bounding box in the viewport
  const graphCenterX = (minX + maxX) / 2;
  const graphCenterY = (minY + maxY) / 2;

  const panX = viewport.width / 2 - graphCenterX * zoom;
  const panY = viewport.height / 2 - graphCenterY * zoom;

  return {
    pan: { x: Math.round(panX), y: Math.round(panY) },
    zoom,
  };
}
