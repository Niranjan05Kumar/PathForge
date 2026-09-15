import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Mandatory Specification Edge-Case Verification Suite (Section 16.3)', () => {
  // 1. Empty Graph
  it('Edge Case 1: Empty Graph (V = 0) rejects immediately with EMPTY_GRAPH', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'B',
        graph: {
          directed: false,
          weighted: true,
          nodes: [],
          edges: []
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMPTY_GRAPH');
  });

  // 2. Single Node Graph
  it('Edge Case 2: Single Node (V = 1, S = A, D = A) returns path [A] with cost 0.0', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'A',
        graph: {
          directed: false,
          weighted: true,
          nodes: [{ id: 'A', label: 'Alpha', x: 100, y: 100 }],
          edges: []
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.path).toEqual(['A']);
    expect(res.body.data.cost).toBe(0.0);
    expect(res.body.data.metrics.edgeRelaxations).toBe(0);
  });

  // 3. Source Equals Destination on Multi-Node Graph
  it('Edge Case 3: Source Equals Destination (S = D) returns path [S] with cost 0.0', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'astar',
        heuristic: 'euclidean',
        source: 'B',
        target: 'B',
        graph: {
          directed: false,
          weighted: true,
          nodes: [
            { id: 'A', label: 'Alpha', x: 0, y: 0 },
            { id: 'B', label: 'Beta', x: 50, y: 50 },
            { id: 'C', label: 'Gamma', x: 100, y: 100 }
          ],
          edges: [
            { source: 'A', target: 'B', weight: 5 },
            { source: 'B', target: 'C', weight: 5 }
          ]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.path).toEqual(['B']);
    expect(res.body.data.cost).toBe(0.0);
  });

  // 4. Disconnected Graph
  it('Edge Case 4: Disconnected Graph returns found: false, path: [], cost: null without failure', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'D',
        graph: {
          directed: false,
          weighted: true,
          nodes: [
            { id: 'A', label: 'A', x: 10, y: 10 },
            { id: 'B', label: 'B', x: 20, y: 20 },
            { id: 'C', label: 'C', x: 80, y: 80 },
            { id: 'D', label: 'D', x: 90, y: 90 }
          ],
          edges: [
            { source: 'A', target: 'B', weight: 2.0 },
            { source: 'C', target: 'D', weight: 3.0 }
          ]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.found).toBe(false);
    expect(res.body.data.path).toEqual([]);
    expect(res.body.data.cost).toBeNull();
  });

  // 5. Zero-Weight Edges
  it('Edge Case 5: Zero-Weight Edges (w = 0) process correctly without infinite loops', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'C',
        graph: {
          directed: true,
          weighted: true,
          nodes: [
            { id: 'A', label: 'A', x: 0, y: 0 },
            { id: 'B', label: 'B', x: 10, y: 10 },
            { id: 'C', label: 'C', x: 20, y: 20 }
          ],
          edges: [
            { source: 'A', target: 'B', weight: 0.0 },
            { source: 'B', target: 'C', weight: 0.0 }
          ]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.path).toEqual(['A', 'B', 'C']);
    expect(res.body.data.cost).toBe(0.0);
  });

  // 6. Negative-Weight Edges
  it('Edge Case 6: Negative-Weight Edges reject for Dijkstra and A* with NEGATIVE_EDGE_WEIGHT', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'C',
        graph: {
          directed: true,
          weighted: true,
          nodes: [
            { id: 'A', label: 'A', x: 0, y: 0 },
            { id: 'B', label: 'B', x: 10, y: 10 },
            { id: 'C', label: 'C', x: 20, y: 20 }
          ],
          edges: [
            { source: 'A', target: 'B', weight: 5.0 },
            { source: 'B', target: 'C', weight: -2.0 }
          ]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NEGATIVE_EDGE_WEIGHT');
  });

  // 7. Missing Coordinates for Geometric Heuristics
  it('Edge Case 7: Geometric heuristics reject graphs with missing coordinates with MISSING_NODE_COORDINATES', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'astar',
        heuristic: 'euclidean',
        source: 'A',
        target: 'B',
        graph: {
          directed: false,
          weighted: true,
          nodes: [
            { id: 'A', label: 'A' },
            { id: 'B', label: 'B' }
          ],
          edges: [{ source: 'A', target: 'B', weight: 1.0 }]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_NODE_COORDINATES');
  });

  // 8. Deterministic Multiple Shortest Paths
  it('Edge Case 8: Deterministic selection when multiple paths have identical minimal cost', async () => {
    const graph = {
      directed: false,
      weighted: true,
      nodes: [
        { id: 'S', label: 'Start', x: 0, y: 50 },
        { id: 'A', label: 'A', x: 50, y: 0 },
        { id: 'B', label: 'B', x: 50, y: 100 },
        { id: 'T', label: 'Target', x: 100, y: 50 }
      ],
      edges: [
        { source: 'S', target: 'A', weight: 10.0 },
        { source: 'S', target: 'B', weight: 10.0 },
        { source: 'A', target: 'T', weight: 10.0 },
        { source: 'B', target: 'T', weight: 10.0 }
      ]
    };

    const res1 = await request(app)
      .post('/api/pathfind')
      .send({ algorithm: 'dijkstra', source: 'S', target: 'T', graph });

    const res2 = await request(app)
      .post('/api/pathfind')
      .send({ algorithm: 'dijkstra', source: 'S', target: 'T', graph });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.data.cost).toBe(20.0);
    expect(res2.body.data.cost).toBe(20.0);
    expect(res1.body.data.path).toEqual(res2.body.data.path);
  });
});
