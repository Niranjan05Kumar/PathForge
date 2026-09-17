import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/compare', () => {
  const sampleGraph = {
    directed: false,
    weighted: false,
    nodes: [
      { id: 'A', label: 'Alpha', x: 0.0, y: 0.0 },
      { id: 'B', label: 'Beta', x: 10.0, y: 0.0 },
      { id: 'C', label: 'Gamma', x: 20.0, y: 0.0 }
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1.0 },
      { source: 'B', target: 'C', weight: 1.0 }
    ]
  };

  it('compares multiple algorithms and confirms cost parity', async () => {
    const res = await request(app)
      .post('/api/compare')
      .send({
        algorithms: [
          { algorithm: 'dijkstra' },
          { algorithm: 'astar', heuristic: 'euclidean' },
          { algorithm: 'bfs' }
        ],
        source: 'A',
        target: 'C',
        graph: sampleGraph
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.results)).toBe(true);
    expect(res.body.data.results.length).toBe(3);
    expect(res.body.data.costParity).toBe(true);
    expect(typeof res.body.data.fastest).toBe('string');
    expect(typeof res.body.data.fewestVisited).toBe('string');
  });

  it('rejects empty algorithms array with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/compare')
      .send({
        algorithms: [],
        source: 'A',
        target: 'C',
        graph: sampleGraph
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_FIELD');
  });
});
