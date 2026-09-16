import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayback } from '../hooks/usePlayback';

describe('usePlayback Hook State Transitions', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      usePlayback({ totalSteps: 5, initialSpeed: 200 })
    );

    expect(result.current.currentStepIndex).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playbackSpeed).toBe(200);
  });

  it('steps forward and backward within bounds', () => {
    const { result } = renderHook(() =>
      usePlayback({ totalSteps: 3 })
    );

    act(() => {
      result.current.stepForward();
    });
    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      result.current.stepForward();
    });
    expect(result.current.currentStepIndex).toBe(1);

    act(() => {
      result.current.stepBackward();
    });
    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      result.current.stepBackward();
    });
    expect(result.current.currentStepIndex).toBe(0); // Floor clamped
  });

  it('jumps to start and end', () => {
    const { result } = renderHook(() =>
      usePlayback({ totalSteps: 10 })
    );

    act(() => {
      result.current.jumpToEnd();
    });
    expect(result.current.currentStepIndex).toBe(9);

    act(() => {
      result.current.jumpToStart();
    });
    expect(result.current.currentStepIndex).toBe(0);
  });

  it('seeks to target step index', () => {
    const { result } = renderHook(() =>
      usePlayback({ totalSteps: 10 })
    );

    act(() => {
      result.current.seek(5);
    });
    expect(result.current.currentStepIndex).toBe(5);

    act(() => {
      result.current.reset();
    });
    expect(result.current.currentStepIndex).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
  });
});
