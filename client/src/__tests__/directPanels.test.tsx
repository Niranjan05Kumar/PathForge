import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../App';

describe('Direct Right Panel (No Tabs) & Complexity Tab Removal', () => {
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
});
