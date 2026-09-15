import { CanvasNode, CanvasEdge } from '../types/graph';

export interface ImportResult {
  success: boolean;
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
  directed?: boolean;
  weighted?: boolean;
  error?: string;
}

/**
 * Validates and parses a raw JSON string into PathForge graph state.
 * Enforces strict schema integrity:
 * - Must be valid JSON object with `nodes` array
 * - Unique, non-empty node IDs
 * - Valid numeric coordinates (assigns deterministic grid positions if missing)
 * - Valid edge endpoints and non-negative weights
 */
export function parseAndValidateGraphJson(rawJson: string): ImportResult {
  if (!rawJson || !rawJson.trim()) {
    return {
      success: false,
      error: 'Uploaded file is empty.'
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    return {
      success: false,
      error: `Malformed JSON: ${err.message}`
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Invalid format: Root must be a JSON object containing a "nodes" array.'
    };
  }

  // Check nodes array
  if (!Array.isArray(parsed.nodes)) {
    return {
      success: false,
      error: 'Invalid format: Missing or invalid "nodes" array.'
    };
  }

  if (parsed.nodes.length === 0) {
    return {
      success: false,
      error: 'Empty graph: Graph must contain at least 1 node.'
    };
  }

  const nodes: CanvasNode[] = [];
  const nodeIds = new Set<string>();

  // Determine if auto-layout coordinates need to be generated
  const totalNodes = parsed.nodes.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(totalNodes)));

  for (let i = 0; i < totalNodes; ++i) {
    const n = parsed.nodes[i];
    if (!n || typeof n !== 'object') {
      return {
        success: false,
        error: `Node at index ${i} is invalid.`
      };
    }

    const id = typeof n.id === 'string' ? n.id.trim() : String(n.id || '').trim();
    if (!id) {
      return {
        success: false,
        error: `Node at index ${i} is missing a valid 'id' property.`
      };
    }

    if (nodeIds.has(id)) {
      return {
        success: false,
        error: `Duplicate node ID detected: '${id}'. All node IDs must be unique.`
      };
    }

    nodeIds.add(id);

    // Coordinates: use existing if valid numbers, otherwise auto-layout
    let x = typeof n.x === 'number' && !isNaN(n.x) ? n.x : -1;
    let y = typeof n.y === 'number' && !isNaN(n.y) ? n.y : -1;

    if (x < 0 || y < 0) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const stepX = 800 / (cols + 1);
      const stepY = 600 / (Math.ceil(totalNodes / cols) + 1);
      x = Math.round(100 + c * stepX);
      y = Math.round(100 + r * stepY);
    }

    const label = typeof n.label === 'string' && n.label.trim() ? n.label.trim() : id;

    nodes.push({ id, label, x, y });
  }

  // Check edges array
  const edges: CanvasEdge[] = [];
  const edgeList = Array.isArray(parsed.edges) ? parsed.edges : [];

  for (let i = 0; i < edgeList.length; ++i) {
    const e = edgeList[i];
    if (!e || typeof e !== 'object') {
      return {
        success: false,
        error: `Edge at index ${i} is invalid.`
      };
    }

    const source = typeof e.source === 'string' ? e.source.trim() : String(e.source || '').trim();
    const target = typeof e.target === 'string' ? e.target.trim() : String(e.target || '').trim();

    if (!source || !target) {
      return {
        success: false,
        error: `Edge at index ${i} is missing 'source' or 'target' endpoint.`
      };
    }

    if (!nodeIds.has(source)) {
      return {
        success: false,
        error: `Edge at index ${i} references non-existent source node '${source}'.`
      };
    }

    if (!nodeIds.has(target)) {
      return {
        success: false,
        error: `Edge at index ${i} references non-existent target node '${target}'.`
      };
    }

    const rawWeight = e.weight !== undefined ? Number(e.weight) : 1.0;
    if (isNaN(rawWeight)) {
      return {
        success: false,
        error: `Edge between '${source}' and '${target}' has invalid non-numeric weight '${e.weight}'.`
      };
    }

    if (rawWeight < 0) {
      return {
        success: false,
        error: `Negative edge weight ${rawWeight} detected between '${source}' and '${target}'. Negative weights are not supported.`
      };
    }

    const edgeId = typeof e.id === 'string' && e.id.trim() ? e.id.trim() : `edge_${i}`;
    edges.push({
      id: edgeId,
      source,
      target,
      weight: Math.round(rawWeight * 10) / 10
    });
  }

  const directed = Boolean(parsed.directed);
  const weighted = parsed.weighted !== undefined ? Boolean(parsed.weighted) : true;

  return {
    success: true,
    nodes,
    edges,
    directed,
    weighted
  };
}
