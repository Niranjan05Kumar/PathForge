import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { PathfindResult } from '../types/graph';

describe('TelemetryPanel', () => {
  const mockResult: PathfindResult = {
    algorithm: 'dijkstra',
    source: 'A',
    target: 'B',
    found: true,
    path: ['A', 'C', 'B'],
    cost: 4.5,
    metrics: {
      nodesVisited: 6,
      edgesExamined: 10,
      edgeRelaxations: 8,
      executionTimeMs: 0.32,
    },
    steps: [
      {
        step: 0,
        action: 'visit_node',
        nodeId: 'A',
        description: 'Selected Node A with tentative cost 0.00',
        frontier: [],
        visited: ['A'],
      },
    ],
  };

  it('renders waiting state when result is null', () => {
    render(<TelemetryPanel result={null} currentStepIndex={0} />);
    expect(screen.getByText(/No Execution Results/i)).toBeInTheDocument();
  });

  it('renders only Total Cost, Nodes Visited, and Reconstructed Path Sequence when result is present', () => {
    render(
      <TelemetryPanel
        result={mockResult}
        currentStep={mockResult.steps[0]}
        currentStepIndex={0}
      />
    );

    // Explicitly expected data
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('4.50')).toBeInTheDocument();
    expect(screen.getByText('Nodes Visited')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText(/Reconstructed Path Sequence/i)).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();

    // Explicitly forbidden data
    expect(screen.queryByText(/Optimal Route Found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Execution Time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Edges Examined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Edge Relaxations/i)).not.toBeInTheDocument();
  });

  it('renders "No route exists" when found is false', () => {
    const noPathResult: PathfindResult = {
      ...mockResult,
      found: false,
      path: [],
      cost: null,
    };
    render(<TelemetryPanel result={noPathResult} currentStepIndex={0} />);
    expect(screen.getByText(/No route exists/i)).toBeInTheDocument();
  });
});
