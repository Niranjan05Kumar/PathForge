import { describe, it, expect } from 'vitest';
import { screenToGraph, calculateFitToScreen, MIN_ZOOM, MAX_ZOOM } from '../utils/canvasMath';
import { CanvasNode } from '../types/graph';

describe('Canvas Navigation Math Utility', () => {
  const dummyRect = {
    left: 100,
    top: 50,
    width: 800,
    height: 600,
    right: 900,
    bottom: 650,
    x: 100,
    y: 50,
    toJSON: () => {},
  } as DOMRect;

  it('converts screen coordinates at 1.0x zoom and zero pan', () => {
    const pos = screenToGraph(200, 150, dummyRect, { x: 0, y: 0 }, 1.0);
    expect(pos.x).toBe(100); // 200 - 100
    expect(pos.y).toBe(100); // 150 - 50
  });

  it('converts screen coordinates with pan offsets', () => {
    const pos = screenToGraph(200, 150, dummyRect, { x: 50, y: -20 }, 1.0);
    expect(pos.x).toBe(50);  // (100 - 50) / 1
    expect(pos.y).toBe(120); // (100 - (-20)) / 1
  });

  it('converts screen coordinates under zoom scaling', () => {
    const pos = screenToGraph(300, 250, dummyRect, { x: 0, y: 0 }, 2.0);
    expect(pos.x).toBe(100); // (300 - 100) / 2
    expect(pos.y).toBe(100); // (250 - 50) / 2
  });

  it('clamps zoom within safe bounds', () => {
    const posMin = screenToGraph(200, 150, dummyRect, { x: 0, y: 0 }, 0.01);
    expect(posMin.x).toBe(Math.round(100 / MIN_ZOOM));

    const posMax = screenToGraph(200, 150, dummyRect, { x: 0, y: 0 }, 10.0);
    expect(posMax.x).toBe(Math.round(100 / MAX_ZOOM));
  });

  it('calculates fit-to-screen for multi-node graph', () => {
    const nodes: CanvasNode[] = [
      { id: 'A', label: 'A', x: 100, y: 100 },
      { id: 'B', label: 'B', x: 500, y: 300 },
    ];
    const fit = calculateFitToScreen(nodes, { width: 800, height: 600 }, 50);

    expect(fit.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(fit.zoom).toBeLessThanOrEqual(1.5);
    expect(typeof fit.pan.x).toBe('number');
    expect(typeof fit.pan.y).toBe('number');
  });

  it('returns default center when nodes list is empty', () => {
    const fit = calculateFitToScreen([], { width: 800, height: 600 });
    expect(fit.zoom).toBe(1.0);
    expect(fit.pan).toEqual({ x: 0, y: 0 });
  });
});
