import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControlSidebar } from '../components/ControlSidebar';
import { CanvasNode } from '../types/graph';

describe('ControlSidebar', () => {
  const defaultNodes: CanvasNode[] = [
    { id: 'A', label: 'A', x: 100, y: 100 },
    { id: 'B', label: 'B', x: 200, y: 200 },
  ];

  const defaultProps = {
    algorithm: 'dijkstra' as const,
    onAlgorithmChange: vi.fn(),
    heuristic: 'euclidean' as const,
    onHeuristicChange: vi.fn(),
    sourceNode: 'A',
    onSourceNodeChange: vi.fn(),
    destinationNode: 'B',
    onDestinationNodeChange: vi.fn(),
    nodes: defaultNodes,
    isDirected: false,
    onToggleDirected: vi.fn(),
    isWeighted: true,
    onToggleWeighted: vi.fn(),
    activeTool: 'select' as const,
    onToolChange: vi.fn(),
    hasSelection: false,
    onDeleteSelection: vi.fn(),
    isLoading: false,
    onRunAlgorithm: vi.fn(),
    onCompareAlgorithms: vi.fn(),
    onReset: vi.fn(),
  };

  it('renders algorithm selector and endpoints', () => {
    render(<ControlSidebar {...defaultProps} />);
    expect(screen.getByText('Algorithm')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select pathfinding algorithm/i })).toHaveValue('dijkstra');
    expect(screen.getByLabelText(/Source Node/i)).toHaveValue('A');
    expect(screen.getByLabelText(/Destination Node/i)).toHaveValue('B');
  });

  it('calls onRunAlgorithm when "Run Pathfinding" button is clicked', () => {
    const onRun = vi.fn();
    render(<ControlSidebar {...defaultProps} onRunAlgorithm={onRun} />);
    const runBtn = screen.getByRole('button', { name: /Run Pathfinding/i });
    fireEvent.click(runBtn);
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('switches tool when a tool button is clicked', () => {
    const onToolChange = vi.fn();
    render(<ControlSidebar {...defaultProps} onToolChange={onToolChange} />);
    const addNodeBtn = screen.getByTitle(/Click canvas to add nodes/i);
    fireEvent.click(addNodeBtn);
    expect(onToolChange).toHaveBeenCalledWith('add_node');
  });

  it('shows heuristic selector only for A*', () => {
    const { rerender } = render(<ControlSidebar {...defaultProps} algorithm="dijkstra" />);
    expect(screen.queryByText('Heuristic Function')).not.toBeInTheDocument();

    rerender(<ControlSidebar {...defaultProps} algorithm="astar" />);
    expect(screen.getByText('Heuristic Function')).toBeInTheDocument();
  });

  it('disables Run button while isLoading is true', () => {
    render(<ControlSidebar {...defaultProps} isLoading={true} />);
    const runBtn = screen.getByRole('button', { name: /Computing Path/i });
    expect(runBtn).toBeDisabled();
  });

  // --- Algorithm Availability Combinations (BFS & DFS rules) ---

  it('Combination 1: Unweighted + Undirected -> BFS/DFS visible and selectable', () => {
    render(
      <ControlSidebar
        {...defaultProps}
        isWeighted={false}
        isDirected={false}
      />
    );

    // BFS and DFS must be visible
    expect(screen.getByRole('option', { name: /Breadth-First Search/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Depth-First Search/i })).toBeInTheDocument();

    // Dijkstra and A* remain available
    expect(screen.getByRole('option', { name: /Dijkstra's Algorithm/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /A\* Search/i })).toBeInTheDocument();
  });

  it('Combination 2: Weighted + Undirected -> BFS/DFS unavailable', () => {
    render(
      <ControlSidebar
        {...defaultProps}
        isWeighted={true}
        isDirected={false}
      />
    );

    // BFS and DFS must be unavailable
    expect(screen.queryByRole('option', { name: /Breadth-First Search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Depth-First Search/i })).not.toBeInTheDocument();

    // Dijkstra and A* remain available
    expect(screen.getByRole('option', { name: /Dijkstra's Algorithm/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /A\* Search/i })).toBeInTheDocument();
  });

  it('Combination 3: Unweighted + Directed -> BFS/DFS unavailable', () => {
    render(
      <ControlSidebar
        {...defaultProps}
        isWeighted={false}
        isDirected={true}
      />
    );

    // BFS and DFS must be unavailable
    expect(screen.queryByRole('option', { name: /Breadth-First Search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Depth-First Search/i })).not.toBeInTheDocument();

    // Dijkstra and A* remain available
    expect(screen.getByRole('option', { name: /Dijkstra's Algorithm/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /A\* Search/i })).toBeInTheDocument();
  });

  it('Combination 4: Weighted + Directed -> BFS/DFS unavailable', () => {
    render(
      <ControlSidebar
        {...defaultProps}
        isWeighted={true}
        isDirected={true}
      />
    );

    // BFS and DFS must be unavailable
    expect(screen.queryByRole('option', { name: /Breadth-First Search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Depth-First Search/i })).not.toBeInTheDocument();

    // Dijkstra and A* remain available
    expect(screen.getByRole('option', { name: /Dijkstra's Algorithm/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /A\* Search/i })).toBeInTheDocument();
  });
});
