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
    render(<TelemetryPanel result={null} currentStep={undefined} currentStepIndex={0} />);
    expect(screen.getByText(/No Execution Results/i)).toBeInTheDocument();
  });

  it('renders optimal route badge and metrics when result is present', () => {
    render(
      <TelemetryPanel
        result={mockResult}
        currentStep={mockResult.steps[0]}
        currentStepIndex={0}
      />
    );
    expect(screen.getByText(/Optimal Route Found/i)).toBeInTheDocument();
    expect(screen.getByText('4.50')).toBeInTheDocument(); // total cost
    expect(screen.getByText('6')).toBeInTheDocument(); // visited nodes
    expect(screen.getByText('8')).toBeInTheDocument(); // relaxed edges
    expect(screen.getByText(/0.320/)).toBeInTheDocument(); // kernel duration
  });

  it('displays the path sequence correctly', () => {
    render(
      <TelemetryPanel
        result={mockResult}
        currentStep={mockResult.steps[0]}
        currentStepIndex={0}
      />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders "No Route Exists" when found is false', () => {
    const noPathResult: PathfindResult = {
      ...mockResult,
      found: false,
      path: [],
      cost: null,
    };
    render(<TelemetryPanel result={noPathResult} currentStep={undefined} currentStepIndex={0} />);
    expect(screen.getByText(/No Route Exists/i)).toBeInTheDocument();
  });
});
