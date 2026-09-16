import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlaybackControls } from '../components/PlaybackControls';
import { TraceStep } from '../types/graph';

describe('PlaybackControls', () => {
  const mockStep: TraceStep = {
    step: 0,
    action: 'visit',
    nodeId: 'A',
    description: 'Visiting node A with initial distance 0.0',
    frontier: ['B', 'C'],
    visited: ['A'],
  };

  const defaultProps = {
    currentStepIndex: 0,
    totalSteps: 27,
    isPlaying: false,
    playbackSpeed: 250,
    currentStep: mockStep,
    onTogglePlay: vi.fn(),
    onStepForward: vi.fn(),
    onStepBackward: vi.fn(),
    onJumpToStart: vi.fn(),
    onJumpToEnd: vi.fn(),
    onSeek: vi.fn(),
    onSetSpeed: vi.fn(),
    onReset: vi.fn(),
  };

  it('renders with a static width of 580px', () => {
    const { container } = render(<PlaybackControls {...defaultProps} />);
    const controlsContainer = container.querySelector('.playback-controls-container');
    expect(controlsContainer).toBeInTheDocument();
    expect(controlsContainer).toHaveStyle({ width: '580px' });
  });

  it('renders step counter, description, and action badge', () => {
    render(<PlaybackControls {...defaultProps} />);
    expect(screen.getByText('Step 1 / 27')).toBeInTheDocument();
    expect(screen.getByText(/\[visit\]/i)).toBeInTheDocument();
    expect(screen.getByText('Visiting node A with initial distance 0.0')).toBeInTheDocument();
  });

  it('renders interactive scrubber slider and responds to seek', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} />);
    const slider = screen.getByRole('slider', { name: /Trace step playback scrubber/i });
    expect(slider).toHaveValue('0');
    fireEvent.change(slider, { target: { value: '14' } });
    expect(onSeek).toHaveBeenCalledWith(14);
  });

  it('renders all transport buttons and triggers corresponding events', () => {
    const onTogglePlay = vi.fn();
    const onStepForward = vi.fn();
    const onStepBackward = vi.fn();
    const onJumpToStart = vi.fn();
    const onJumpToEnd = vi.fn();

    render(
      <PlaybackControls
        {...defaultProps}
        onTogglePlay={onTogglePlay}
        onStepForward={onStepForward}
        onStepBackward={onStepBackward}
        onJumpToStart={onJumpToStart}
        onJumpToEnd={onJumpToEnd}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /▶ Play/i }));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Next ▶/i }));
    expect(onStepForward).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /◀ Prev/i }));
    expect(onStepBackward).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /⏮ First/i }));
    expect(onJumpToStart).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Last ⏭/i }));
    expect(onJumpToEnd).toHaveBeenCalledTimes(1);
  });

  it('renders speed selector and reset button', () => {
    const onSetSpeed = vi.fn();
    const onReset = vi.fn();

    render(<PlaybackControls {...defaultProps} onSetSpeed={onSetSpeed} onReset={onReset} />);

    const speedSelect = screen.getByRole('combobox', { name: /Select playback speed/i });
    expect(speedSelect).toHaveValue('250');
    fireEvent.change(speedSelect, { target: { value: '120' } });
    expect(onSetSpeed).toHaveBeenCalledWith(120);

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when totalSteps is 0', () => {
    const { container } = render(<PlaybackControls {...defaultProps} totalSteps={0} />);
    expect(container.firstChild).toBeNull();
  });
});
