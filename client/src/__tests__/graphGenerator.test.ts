import { describe, it, expect } from 'vitest';
import { generateRandomGraph } from '../utils/graphGenerator';

describe('generateRandomGraph', () => {
  it('generates a valid random graph with default parameters', () => {
    const graph = generateRandomGraph();

    expect(graph.nodes.length).toBeGreaterThanOrEqual(6);
    expect(graph.nodes.length).toBeLessThanOrEqual(8);
    expect(graph.edges.length).toBeGreaterThanOrEqual(graph.nodes.length - 1);
    expect(graph.sourceNode).toBe(graph.nodes[0].id);
    expect(graph.destinationNode).toBe(graph.nodes[graph.nodes.length - 1].id);
    expect(graph.sourceNode).not.toBe(graph.destinationNode);
  });

  it('positions all nodes within the visible canvas boundaries', () => {
    const { nodes } = generateRandomGraph({ nodeCount: 8 });

    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(80);
      expect(node.x).toBeLessThanOrEqual(720);
      expect(node.y).toBeGreaterThanOrEqual(60);
      expect(node.y).toBeLessThanOrEqual(420);
    }
  });

  it('creates valid edges without self-loops or duplicates', () => {
    const { nodes, edges } = generateRandomGraph({ isDirected: false, isWeighted: true });
    const nodeIds = new Set(nodes.map((n) => n.id));

    const seenEdges = new Set<string>();

    for (const edge of edges) {
      // Endpoints must exist
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);

      // No self-loops
      expect(edge.source).not.toBe(edge.target);

      // Positive weights
      expect(edge.weight).toBeGreaterThan(0);

      // Undirected uniqueness check
      const canonicalKey = [edge.source, edge.target].sort().join('--');
      expect(seenEdges.has(canonicalKey)).toBe(false);
      seenEdges.add(canonicalKey);
    }
  });

  it('sets edge weights to 1.0 when isWeighted is false', () => {
    const { edges } = generateRandomGraph({ isWeighted: false });

    for (const edge of edges) {
      expect(edge.weight).toBe(1.0);
    }
  });

  it('respects requested nodeCount', () => {
    const graph = generateRandomGraph({ nodeCount: 9 });
    expect(graph.nodes.length).toBe(9);
  });
});
