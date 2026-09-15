import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/pathfind', () => {
  const sampleGraph = {
    directed: false,
    weighted: true,
    nodes: [
      { id: 'A', label: 'Alpha', x: 0.0, y: 0.0 },
      { id: 'B', label: 'Beta', x: 10.0, y: 0.0 },
      { id: 'C', label: 'Gamma', x: 20.0, y: 0.0 }
    ],
    edges: [
      { source: 'A', target: 'B', weight: 4.0 },
      { source: 'B', target: 'C', weight: 3.0 }
    ]
  };

  it('runs Dijkstra with visualize mode and returns steps', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'C',
        mode: 'visualize',
        graph: sampleGraph
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.cost).toBe(7.0);
    expect(res.body.data.path).toEqual(['A', 'B', 'C']);
    expect(res.body.data.metrics.nodesVisited).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.steps)).toBe(true);
    expect(res.body.data.steps.length).toBeGreaterThan(0);
  });

  it('runs A* with Euclidean heuristic and verifies cost parity', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'astar',
        heuristic: 'euclidean',
        source: 'A',
        target: 'C',
        mode: 'visualize',
        graph: sampleGraph
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cost).toBe(7.0);
    expect(res.body.data.path).toEqual(['A', 'B', 'C']);
  });

  it('omits steps when benchmark mode is requested', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'bfs',
        source: 'A',
        target: 'C',
        mode: 'benchmark',
        graph: sampleGraph
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.steps).toEqual([]);
  });

  it('rejects non-existent node with HTTP 400 and INVALID_NODE', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'GhostNode',
        target: 'C',
        graph: sampleGraph
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_NODE');
  });

  it('rejects missing coordinates for A* Euclidean heuristic with HTTP 400', async () => {
    const noCoordsGraph = {
      directed: false,
      weighted: true,
      nodes: [{ id: 'A' }, { id: 'B' }],
      edges: [{ source: 'A', target: 'B', weight: 1.0 }]
    };

    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'astar',
        heuristic: 'euclidean',
        source: 'A',
        target: 'B',
        graph: noCoordsGraph
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_NODE_COORDINATES');
  });

  it('rejects negative edge weights with HTTP 400', async () => {
    const negativeGraph = {
      nodes: [{ id: 'A' }, { id: 'B' }],
      edges: [{ source: 'A', target: 'B', weight: -5.0 }]
    };

    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'B',
        graph: negativeGraph
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NEGATIVE_EDGE_WEIGHT');
  });
});
