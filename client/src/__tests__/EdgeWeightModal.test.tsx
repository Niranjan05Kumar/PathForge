import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeWeightModal } from '../components/EdgeWeightModal';
import { CanvasEdge } from '../types/graph';

describe('EdgeWeightModal Component', () => {
  const dummyEdge: CanvasEdge = {
    id: 'edge-1',
    source: 'A',
    target: 'B',
    weight: 4.5,
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <EdgeWeightModal
        edge={dummyEdge}
        isOpen={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with edge endpoints and current weight', () => {
    render(
      <EdgeWeightModal
        edge={dummyEdge}
        isOpen={true}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Edit Edge Weight/i)).toBeInTheDocument();
    expect(screen.getByText(/A ↔ B/i)).toBeInTheDocument();

    const input = screen.getByLabelText(/Weight \(Cost\)/i) as HTMLInputElement;
    expect(input.value).toBe('4.5');
  });

  it('validates negative weight and displays inline error without alert', () => {
    const onSave = vi.fn();
    render(
      <EdgeWeightModal
        edge={dummyEdge}
        isOpen={true}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/Weight \(Cost\)/i);
    fireEvent.change(input, { target: { value: '-2' } });

    const saveButton = screen.getByRole('button', { name: /Save Weight/i });
    fireEvent.click(saveButton);

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/valid non-negative number/i)).toBeInTheDocument();
  });

  it('submits updated weight when valid', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <EdgeWeightModal
        edge={dummyEdge}
        isOpen={true}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const input = screen.getByLabelText(/Weight \(Cost\)/i);
    fireEvent.change(input, { target: { value: '8.25' } });

    const saveButton = screen.getByRole('button', { name: /Save Weight/i });
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith('edge-1', 8.25);
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers onDelete when Delete Edge is clicked', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <EdgeWeightModal
        edge={dummyEdge}
        isOpen={true}
        onSave={vi.fn()}
        onDelete={onDelete}
        onClose={onClose}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete Edge/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('edge-1');
    expect(onClose).toHaveBeenCalled();
  });
});
