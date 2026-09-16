import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComparisonPanel } from '../components/ComparisonPanel';
import { CompareResult } from '../types/graph';

describe('ComparisonPanel', () => {
  const mockCompareResult: CompareResult = {
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

  it('renders waiting state when compareResult is null and handles run compare click', () => {
    const onRunCompare = vi.fn();
    render(<ComparisonPanel compareResult={null} onRunCompare={onRunCompare} isLoading={false} />);

    expect(screen.getByText(/No Comparative Analysis Run/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /▶ Run Comparison/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onRunCompare).toHaveBeenCalledTimes(1);
  });

  it('renders ONLY ALGO, COST, and VISITED in comparison table', () => {
    render(<ComparisonPanel compareResult={mockCompareResult} onRunCompare={vi.fn()} isLoading={false} />);

    // Table Headers
    expect(screen.getByText('ALGO')).toBeInTheDocument();
    expect(screen.getByText('COST')).toBeInTheDocument();
    expect(screen.getByText('VISITED')).toBeInTheDocument();

    // Rows
    expect(screen.getByText('DIJKSTRA')).toBeInTheDocument();
    expect(screen.getByText('ASTAR')).toBeInTheDocument();
    expect(screen.getAllByText('9.00').length).toBe(2);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Forbidden UI elements:
    expect(screen.queryByText(/Fewest Visited/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Optimality Parity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fastest Search/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^EXAMINED$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TIME \(MS\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.007/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.01/i)).not.toBeInTheDocument();
  });
});
