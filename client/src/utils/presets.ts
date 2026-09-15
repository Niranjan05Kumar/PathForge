import { CanvasNode, CanvasEdge } from '../types/graph';

export interface GraphPreset {
  id: string;
  name: string;
  description: string;
  directed: boolean;
  weighted: boolean;
  defaultSource: string;
  defaultTarget: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const GRAPH_PRESETS: GraphPreset[] = [
  {
    id: 'sample-network',
    name: 'Sample Multi-Path Network',
    description: 'A 6-node network with branching paths, cycles, and varied weights.',
    directed: false,
    weighted: true,
    defaultSource: 'A',
    defaultTarget: 'F',
    nodes: [
      { id: 'A', label: 'A', x: 120, y: 220 },
      { id: 'B', label: 'B', x: 280, y: 120 },
      { id: 'C', label: 'C', x: 280, y: 320 },
      { id: 'D', label: 'D', x: 460, y: 120 },
      { id: 'E', label: 'E', x: 460, y: 320 },
      { id: 'F', label: 'F', x: 620, y: 220 }
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', weight: 4.0 },
      { id: 'e2', source: 'A', target: 'C', weight: 2.0 },
      { id: 'e3', source: 'B', target: 'C', weight: 1.5 },
      { id: 'e4', source: 'B', target: 'D', weight: 5.0 },
      { id: 'e5', source: 'C', target: 'E', weight: 3.0 },
      { id: 'e6', source: 'D', target: 'E', weight: 2.5 },
      { id: 'e7', source: 'D', target: 'F', weight: 2.0 },
      { id: 'e8', source: 'E', target: 'F', weight: 4.0 }
    ]
  },
  {
    id: 'detour-benchmark',
    name: 'Dijkstra Detour Benchmark',
    description: 'Contrasts fewest hops (2 hops, weight 20) against lowest cost (4 hops, weight 4).',
    directed: true,
    weighted: true,
    defaultSource: 'A',
    defaultTarget: 'D',
    nodes: [
      { id: 'A', label: 'Start (A)', x: 120, y: 220 },
      { id: 'HighHop', label: 'High Cost (H)', x: 370, y: 100 },
      { id: 'C1', label: 'C1', x: 240, y: 340 },
      { id: 'C2', label: 'C2', x: 370, y: 340 },
      { id: 'C3', label: 'C3', x: 500, y: 340 },
      { id: 'D', label: 'Goal (D)', x: 620, y: 220 }
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'HighHop', weight: 10.0 },
      { id: 'e2', source: 'HighHop', target: 'D', weight: 10.0 },
      { id: 'e3', source: 'A', target: 'C1', weight: 1.0 },
      { id: 'e4', source: 'C1', target: 'C2', weight: 1.0 },
      { id: 'e5', source: 'C2', target: 'C3', weight: 1.0 },
      { id: 'e6', source: 'C3', target: 'D', weight: 1.0 }
    ]
  },
  {
    id: 'grid-4x4',
    name: 'Geometric Grid (4x4)',
    description: 'A 16-node 2D mesh grid ideal for Euclidean and Manhattan A* heuristic exploration.',
    directed: false,
    weighted: true,
    defaultSource: 'N_0_0',
    defaultTarget: 'N_3_3',
    nodes: (() => {
      const nodes: CanvasNode[] = [];
      for (let r = 0; r < 4; ++r) {
        for (let c = 0; c < 4; ++c) {
          nodes.push({
            id: `N_${r}_${c}`,
            label: `${r},${c}`,
            x: 140 + c * 130,
            y: 80 + r * 90
          });
        }
      }
      return nodes;
    })(),
    edges: (() => {
      const edges: CanvasEdge[] = [];
      let count = 1;
      for (let r = 0; r < 4; ++r) {
        for (let c = 0; c < 4; ++c) {
          // Horizontal neighbor
          if (c + 1 < 4) {
            edges.push({
              id: `ge_${count++}`,
              source: `N_${r}_${c}`,
              target: `N_${r}_${c + 1}`,
              weight: 1.0
            });
          }
          // Vertical neighbor
          if (r + 1 < 4) {
            edges.push({
              id: `ge_${count++}`,
              source: `N_${r}_${c}`,
              target: `N_${r + 1}_${c}`,
              weight: 1.0
            });
          }
        }
      }
      return edges;
    })()
  },
  {
    id: 'linear-chain',
    name: 'Linear Pipeline',
    description: 'A simple 5-node sequence to verify baseline traversal and path reconstruction.',
    directed: true,
    weighted: true,
    defaultSource: 'N1',
    defaultTarget: 'N5',
    nodes: [
      { id: 'N1', label: 'N1', x: 120, y: 220 },
      { id: 'N2', label: 'N2', x: 240, y: 220 },
      { id: 'N3', label: 'N3', x: 360, y: 220 },
      { id: 'N4', label: 'N4', x: 480, y: 220 },
      { id: 'N5', label: 'N5', x: 600, y: 220 }
    ],
    edges: [
      { id: 'e1', source: 'N1', target: 'N2', weight: 2.0 },
      { id: 'e2', source: 'N2', target: 'N3', weight: 3.5 },
      { id: 'e3', source: 'N3', target: 'N4', weight: 1.0 },
      { id: 'e4', source: 'N4', target: 'N5', weight: 2.5 }
    ]
  }
];
