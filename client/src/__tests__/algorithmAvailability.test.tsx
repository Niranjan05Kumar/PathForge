import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../App';

describe('Algorithm Availability & Automatic Fallback', () => {
  it('allows selecting BFS when graph is unweighted and undirected, then falls back to Dijkstra when graph is made weighted', async () => {
    render(<App />);

    // Initial graph is undirected and weighted -> toggle to Unweighted
    const weightToggleBtn = screen.getByRole('button', { name: /Weighted/i });
    fireEvent.click(weightToggleBtn);

    // Now graph is unweighted + undirected -> BFS must be available
    const algoSelect = screen.getByRole('combobox', { name: /Select Pathfinding Algorithm/i });
    expect(screen.getByRole('option', { name: /Breadth-First Search/i })).toBeInTheDocument();

    // Select BFS
    fireEvent.change(algoSelect, { target: { value: 'bfs' } });
    expect(algoSelect).toHaveValue('bfs');

    // Toggle back to Weighted -> should automatically fallback to Dijkstra
    const unweightedBtn = screen.getByRole('button', { name: /Unweighted/i });
    fireEvent.click(unweightedBtn);

    expect(algoSelect).toHaveValue('dijkstra');
    expect(screen.queryByRole('option', { name: /Breadth-First Search/i })).not.toBeInTheDocument();
  });

  it('falls back from DFS to Dijkstra when graph is made directed', async () => {
    render(<App />);

    // Initial graph is weighted -> toggle to Unweighted
    const weightToggleBtn = screen.getByRole('button', { name: /Weighted/i });
    fireEvent.click(weightToggleBtn);

    // Select DFS
    const algoSelect = screen.getByRole('combobox', { name: /Select Pathfinding Algorithm/i });
    fireEvent.change(algoSelect, { target: { value: 'dfs' } });
    expect(algoSelect).toHaveValue('dfs');

    // Toggle to Directed
    const directedToggleBtn = screen.getByRole('button', { name: /Undirected/i });
    fireEvent.click(directedToggleBtn);

    expect(algoSelect).toHaveValue('dijkstra');
    expect(screen.queryByRole('option', { name: /Depth-First Search/i })).not.toBeInTheDocument();
  });
});
