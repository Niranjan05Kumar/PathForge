import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Synthetic Graph Generation & Benchmark API', () => {
  describe('POST /api/graph/generate', () => {
    it('generates a deterministic tree graph with reproducible structure', async () => {
      const res = await request(app)
        .post('/api/graph/generate')
        .send({
          nodes: 25,
          topology: 'tree',
          seed: 42
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.topology).toBe('tree');
      expect(res.body.seed).toBe(42);
      expect(res.body.nodeCount).toBe(25);
      expect(res.body.edgeCount).toBe(24);
      expect(Array.isArray(res.body.nodes)).toBe(true);
      expect(res.body.nodes.length).toBe(25);
      expect(Array.isArray(res.body.edges)).toBe(true);
      expect(res.body.edges.length).toBe(24);
    });

    it('generates a grid topology with proper node layout', async () => {
      const res = await request(app)
        .post('/api/graph/generate')
        .send({
          nodes: 16,
          topology: 'grid',
          seed: 123
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.nodeCount).toBe(16);
      expect(res.body.edges.length).toBeGreaterThan(0);
    });

    it('rejects invalid topology with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/graph/generate')
        .send({
          nodes: 20,
          topology: 'hypercube'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOPOLOGY');
    });

    it('rejects negative node count with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/graph/generate')
        .send({
          nodes: -5,
          topology: 'sparse'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_NODES');
    });
  });

  describe('POST /api/benchmark/run', () => {
    it('executes multi-run benchmark on synthetic grid graph', async () => {
      const res = await request(app)
        .post('/api/benchmark/run')
        .send({
          runs: 3,
          graphConfig: {
            nodes: 25,
            topology: 'grid',
            seed: 42
          },
          algorithms: [
            { algorithm: 'dijkstra' },
            { algorithm: 'astar', heuristic: 'manhattan' },
            { algorithm: 'bfs' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.runs).toBe(3);
      expect(res.body.costMatch).toBe(true);
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(3);

      const dijkstraRes = res.body.results.find((r: any) => r.algorithm === 'dijkstra');
      const astarRes = res.body.results.find((r: any) => r.algorithm === 'astar');
      expect(dijkstraRes).toBeDefined();
      expect(astarRes).toBeDefined();
      expect(dijkstraRes.found).toBe(true);
      expect(astarRes.found).toBe(true);
      expect(dijkstraRes.pathCost).toBe(astarRes.pathCost);
    });

    it('rejects request with neither graphConfig nor graph with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/benchmark/run')
        .send({
          runs: 5,
          algorithms: [{ algorithm: 'dijkstra' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_FIELD');
    });

    it('rejects invalid run count with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/benchmark/run')
        .send({
          runs: 0,
          graphConfig: { nodes: 10, topology: 'tree' }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_RUNS');
    });
  });
});
