import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { App } from '../App';
import { runPathfind, runCompare } from '../services/api';

vi.mock('../services/api', () => ({
  runPathfind: vi.fn(),
  runCompare: vi.fn(),
}));

describe('Direct Right Panel (No Tabs) & Refined Dual Results Display', () => {
  it('renders both Workspace Telemetry and Algorithm Comparison directly in the right panel without tabs', () => {
    render(<App />);

    // Tab buttons must NOT exist in the header navigation
    expect(screen.queryByRole('button', { name: /^Workspace$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Comparison$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Complexity$/i })).not.toBeInTheDocument();

    // Right panel should directly contain both section headers
    const resultsPanel = screen.getByLabelText('Analytical Results and Telemetry');
    expect(resultsPanel).toBeInTheDocument();

    // Both sections must be present simultaneously
    expect(screen.getByText('Workspace Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Algorithm Comparison')).toBeInTheDocument();

    // Telemetry content is directly visible
    expect(screen.getByText(/No Execution Results/i)).toBeInTheDocument();

    // Comparison content is directly visible
    expect(screen.getByText(/No Comparative Analysis Run/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /▶ Run Comparison/i })).toBeInTheDocument();
  });

  it('permanently does not render any Complexity panel or matrix', () => {
    render(<App />);
    expect(screen.queryByText(/Asymptotic Complexity Matrix/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TIME COMPLEXITY/i)).not.toBeInTheDocument();
  });

  it('shows BOTH results at the same time with only requested metrics when pathfinding runs', async () => {
    const mockPathfindResult = {
      algorithm: 'dijkstra',
      source: 'A',
      target: 'F',
      found: true,
      path: ['A', 'C', 'E', 'F'],
      cost: 9.0,
      metrics: {
        nodesVisited: 6,
        edgesExamined: 14,
        edgeRelaxations: 7,
        executionTimeMs: 0.278,
      },
      steps: [
        {
          step: 0,
          action: 'visit_node',
          nodeId: 'A',
          description: 'Selected Node A',
          frontier: [],
          visited: ['A'],
        },
      ],
    };

    const mockCompareResult = {
      results: [
        {
          algorithm: 'dijkstra',
          source: 'A',
          target: 'F',
          found: true,
          path: ['A', 'C', 'E', 'F'],
          cost: 9.0,
          metrics: {
            nodesVisited: 6,
            edgesExamined: 14,
            edgeRelaxations: 7,
            executionTimeMs: 0.007,
          },
          steps: [],
        },
        {
          algorithm: 'astar',
          source: 'A',
          target: 'F',
          found: true,
          path: ['A', 'C', 'E', 'F'],
          cost: 9.0,
          metrics: {
            nodesVisited: 4,
            edgesExamined: 8,
            edgeRelaxations: 4,
            executionTimeMs: 0.01,
          },
          steps: [],
        },
      ],
      costParity: true,
      fastest: 'dijkstra',
      fewestVisited: 'astar',
    };

    vi.mocked(runPathfind).mockResolvedValue({
      success: true,
      data: mockPathfindResult,
    });

    vi.mocked(runCompare).mockResolvedValue({
      success: true,
      data: mockCompareResult,
    });

    render(<App />);

    const runBtn = screen.getByRole('button', { name: /Run Pathfinding/i });
    fireEvent.click(runBtn);

    expect(runPathfind).toHaveBeenCalled();
    expect(runCompare).toHaveBeenCalled();

    // 1. Check Workspace Telemetry data
    await waitFor(() => {
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getAllByText('9.00').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Nodes Visited')).toBeInTheDocument();
      expect(screen.getAllByText('6').length).toBeGreaterThan(0);
      expect(screen.getByText(/Reconstructed Path Sequence/i)).toBeInTheDocument();
    });

    // Verify forbidden Workspace Telemetry items
    expect(screen.queryByText(/Optimal Route Found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Execution Time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Edges Examined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Edge Relaxations/i)).not.toBeInTheDocument();

    // 2. Check Algorithm Comparison data at the same time
    expect(screen.getByText('ALGO')).toBeInTheDocument();
    expect(screen.getByText('COST')).toBeInTheDocument();
    expect(screen.getByText('VISITED')).toBeInTheDocument();
    expect(screen.getAllByText('DIJKSTRA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ASTAR')).toBeInTheDocument();

    // Verify forbidden Algorithm Comparison items
    expect(screen.queryByText(/Fewest Visited/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Optimality Parity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fastest Search/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^EXAMINED$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TIME \(MS\)/i)).not.toBeInTheDocument();
  });
});
