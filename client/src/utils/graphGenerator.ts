import { CanvasNode, CanvasEdge } from '../types/graph';

export interface RandomGraphOptions {
  nodeCount?: number;
  isDirected?: boolean;
  isWeighted?: boolean;
}

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/**
 * Generates a valid, connected random graph positioned cleanly within the visible canvas.
 * Guaranteed to be usable by BFS, DFS, Dijkstra, and A* with valid positive weights and coordinates.
 */
export function generateRandomGraph(options: RandomGraphOptions = {}): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  sourceNode: string;
  destinationNode: string;
} {
  const count = options.nodeCount ?? Math.floor(Math.random() * 3) + 6; // 6 to 8 nodes
  const isDirected = Boolean(options.isDirected);
  const isWeighted = options.isWeighted !== false;

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  // 1. Generate node positions arranged in logical progressive columns with organic jitter
  const cols = Math.min(count, 4);
  const startX = 130;
  const endX = 670;
  const colWidth = (endX - startX) / (cols - 1);

  for (let i = 0; i < count; i++) {
    const label = NODE_LABELS[i] || `N${i + 1}`;
    let x: number;
    let y: number;

    if (i === 0) {
      // Source node at left center
      x = startX;
      y = 220 + Math.floor(Math.random() * 40 - 20);
    } else if (i === count - 1) {
      // Target node at right center
      x = endX;
      y = 220 + Math.floor(Math.random() * 40 - 20);
    } else {
      // Intermediate nodes spaced across inner columns
      const colIndex = 1 + Math.floor(((i - 1) / (count - 2)) * (cols - 2));
      const baseX = startX + colIndex * colWidth;
      const rankInCol = (i % 2 === 0) ? 1 : 0;
      const baseY = rankInCol === 0 ? 130 : 310;
      x = baseX + Math.floor(Math.random() * 50 - 25);
      y = baseY + Math.floor(Math.random() * 50 - 25);
    }

    nodes.push({ id: label, label, x, y });
  }

  // Helper to check if an edge already exists
  const edgeExists = (u: string, v: string) => {
    return edges.some((e) => {
      if (isDirected) {
        return e.source === u && e.target === v;
      }
      return (e.source === u && e.target === v) || (e.source === v && e.target === u);
    });
  };

  const getWeight = () => {
    if (!isWeighted) return 1.0;
    return +(Math.random() * 7.5 + 1.5).toFixed(1); // 1.5 to 9.0
  };

  let edgeCounter = 1;

  // 2. Backbone connectivity: Ensure every intermediate node is connected to at least one previous node
  // and destination is reachable from intermediate nodes
  for (let i = 1; i < count; i++) {
    // Pick a predecessor to connect from
    let prevIndex = i - 1;
    if (i > 2 && Math.random() < 0.4) {
      prevIndex = Math.max(0, i - 2);
    }
    const u = nodes[prevIndex].id;
    const v = nodes[i].id;
    if (!edgeExists(u, v) && u !== v) {
      edges.push({
        id: `re_${edgeCounter++}`,
        source: u,
        target: v,
        weight: getWeight(),
      });
    }
  }

  // Ensure an alternate path to the target node
  if (count >= 4) {
    const altPre = nodes[count - 3].id;
    const target = nodes[count - 1].id;
    if (!edgeExists(altPre, target) && altPre !== target) {
      edges.push({
        id: `re_${edgeCounter++}`,
        source: altPre,
        target,
        weight: getWeight(),
      });
    }
  }

  // 3. Add 2 to 4 additional cross-edges for interesting multi-path branching and cycle choices
  const extraEdgesCount = Math.floor(Math.random() * 3) + 2;
  let attempts = 0;
  while (edges.length < count + extraEdgesCount && attempts < 30) {
    attempts++;
    const idx1 = Math.floor(Math.random() * count);
    const idx2 = Math.floor(Math.random() * count);
    if (idx1 === idx2) continue;

    const u = nodes[Math.min(idx1, idx2)].id;
    const v = nodes[Math.max(idx1, idx2)].id;

    if (!edgeExists(u, v)) {
      edges.push({
        id: `re_${edgeCounter++}`,
        source: u,
        target: v,
        weight: getWeight(),
      });
    }
  }

  return {
    nodes,
    edges,
    sourceNode: nodes[0].id,
    destinationNode: nodes[nodes.length - 1].id,
  };
}
