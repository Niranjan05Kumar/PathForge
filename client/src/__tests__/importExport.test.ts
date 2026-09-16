import { describe, it, expect } from 'vitest';
import { parseAndValidateGraphJson } from '../utils/import';

describe('Graph Import & Validation Utility', () => {
  it('successfully parses valid graph JSON payload', () => {
    const raw = JSON.stringify({
      nodes: [
        { id: 'A', label: 'Alpha', x: 50, y: 50 },
        { id: 'B', label: 'Beta', x: 200, y: 150 },
      ],
      edges: [
        { source: 'A', target: 'B', weight: 3.5 },
      ],
      directed: false,
      weighted: true,
    });

    const res = parseAndValidateGraphJson(raw);
    expect(res.success).toBe(true);
    expect(res.nodes?.length).toBe(2);
    expect(res.edges?.length).toBe(1);
    expect(res.edges?.[0].weight).toBe(3.5);
  });

  it('rejects invalid JSON syntax', () => {
    const res = parseAndValidateGraphJson('{ invalid json format');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('rejects graph without nodes array', () => {
    const res = parseAndValidateGraphJson(JSON.stringify({ edges: [] }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('nodes');
  });

  it('rejects duplicate node IDs', () => {
    const res = parseAndValidateGraphJson(
      JSON.stringify({
        nodes: [{ id: 'A' }, { id: 'A' }],
        edges: [],
      })
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('Duplicate');
  });

  it('rejects edges referencing non-existent nodes', () => {
    const res = parseAndValidateGraphJson(
      JSON.stringify({
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: [{ source: 'A', target: 'Z' }],
      })
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('non-existent');
  });
});
