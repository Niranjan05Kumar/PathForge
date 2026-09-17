import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Server Graph Validation & IPC Hardening Suite', () => {
  it('rejects duplicate node IDs with DUPLICATE_NODE', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'bfs',
        source: 'A',
        target: 'B',
        graph: {
          directed: false,
          weighted: false,
          nodes: [
            { id: 'A', label: 'Node A' },
            { id: 'B', label: 'Node B' },
            { id: 'A', label: 'Duplicate Node A' }
          ],
          edges: [
            { source: 'A', target: 'B' }
          ]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_NODE');
    expect(res.body.error.message).toContain('Duplicate node ID');
  });

  it('rejects disallowed self-loops with SELF_LOOP_DISALLOWED', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'bfs',
        source: 'A',
        target: 'B',
        graph: {
          directed: false,
          allowSelfLoops: false,
          nodes: [
            { id: 'A' },
            { id: 'B' }
          ],
          edges: [
            { source: 'A', target: 'A', weight: 1.0 },
            { source: 'A', target: 'B', weight: 1.0 }
          ]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SELF_LOOP_DISALLOWED');
    expect(res.body.error.message).toContain('Self-loop');
  });

  it('rejects duplicate edges when disallowed with DUPLICATE_EDGE', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'B',
        graph: {
          directed: false,
          allowDuplicateEdges: false,
          nodes: [
            { id: 'A' },
            { id: 'B' }
          ],
          edges: [
            { source: 'A', target: 'B', weight: 2.0 },
            { source: 'A', target: 'B', weight: 5.0 }
          ]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_EDGE');
    expect(res.body.error.message).toContain('Duplicate edge');
  });

  it('rejects non-numeric edge weight with INVALID_EDGE_WEIGHT', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dijkstra',
        source: 'A',
        target: 'B',
        graph: {
          nodes: [{ id: 'A' }, { id: 'B' }],
          edges: [
            { source: 'A', target: 'B', weight: 'invalid-weight' }
          ]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_EDGE_WEIGHT');
  });

  it('rejects invalid edge endpoint with INVALID_NODE', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'bfs',
        source: 'A',
        target: 'B',
        graph: {
          nodes: [{ id: 'A' }, { id: 'B' }],
          edges: [
            { source: 'A', target: 'NonExistent', weight: 1.0 }
          ]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_NODE');
  });

  it('rejects non-object payload with INVALID_PAYLOAD', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send([1, 2, 3]);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  it('rejects missing algorithm with MISSING_FIELD', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        source: 'A',
        target: 'B',
        graph: {
          nodes: [{ id: 'A' }, { id: 'B' }],
          edges: [{ source: 'A', target: 'B' }]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_FIELD');
  });

  it('ensures /api/compare rejects invalid graph payloads without crashing', async () => {
    const res = await request(app)
      .post('/api/compare')
      .send({
        algorithms: [{ algorithm: 'bfs' }, { algorithm: 'dijkstra' }],
        source: 'A',
        target: 'B',
        graph: {
          nodes: [{ id: 'A' }, { id: 'A' }], // Duplicate node ID
          edges: []
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_NODE');
  });

  it('rejects BFS when graph is weighted with INVALID_ALGORITHM_FOR_GRAPH', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'bfs',
        source: 'A',
        target: 'B',
        graph: {
          directed: false,
          weighted: true,
          nodes: [{ id: 'A' }, { id: 'B' }],
          edges: [{ source: 'A', target: 'B', weight: 3.0 }]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_ALGORITHM_FOR_GRAPH');
  });

  it('rejects DFS when graph is directed with INVALID_ALGORITHM_FOR_GRAPH', async () => {
    const res = await request(app)
      .post('/api/pathfind')
      .send({
        algorithm: 'dfs',
        source: 'A',
        target: 'B',
        graph: {
          directed: true,
          weighted: false,
          nodes: [{ id: 'A' }, { id: 'B' }],
          edges: [{ source: 'A', target: 'B', weight: 1.0 }]
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_ALGORITHM_FOR_GRAPH');
  });

  it('returns structured JSON 404 for unknown API endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns ok and discovered engine path on /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.cppEngine).toBeDefined();
    expect(res.body.cppEngine.discovered).toBe(true);
  });
});
