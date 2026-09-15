import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePlaybackOptions {
  totalSteps: number;
  initialSpeed?: number;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
}

export interface UsePlaybackReturn {
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  seek: (stepIndex: number) => void;
  reset: () => void;
  setSpeed: (speedMs: number) => void;
  initializeTrace: (stepCount: number, autoPlay?: boolean) => void;
}

export function usePlayback({
  totalSteps,
  initialSpeed = 250,
  onStepChange,
  onComplete,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(initialSpeed);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const onCompleteRef = useRef(onComplete);

  onStepChangeRef.current = onStepChange;
  onCompleteRef.current = onComplete;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Notify listener on step index change
  useEffect(() => {
    if (onStepChangeRef.current && currentStepIndex >= 0) {
      onStepChangeRef.current(currentStepIndex);
    }
  }, [currentStepIndex]);

  // Main playback timer loop
  useEffect(() => {
    if (!isPlaying || totalSteps <= 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= totalSteps - 1) {
          setIsPlaying(false);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
        return next;
      });
    }, playbackSpeed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeed]);

  const play = useCallback(() => {
    if (totalSteps <= 0) return;
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [totalSteps, currentStepIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const stepForward = useCallback(() => {
    pause();
    if (totalSteps <= 0) return;
    setCurrentStepIndex((prev) => {
      if (prev < 0) return 0;
      return Math.min(prev + 1, totalSteps - 1);
    });
  }, [totalSteps, pause]);

  const stepBackward = useCallback(() => {
    pause();
    if (totalSteps <= 0) return;
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, [totalSteps, pause]);

  const jumpToStart = useCallback(() => {
    pause();
    if (totalSteps > 0) {
      setCurrentStepIndex(0);
    }
  }, [totalSteps, pause]);

  const jumpToEnd = useCallback(() => {
    pause();
    if (totalSteps > 0) {
      setCurrentStepIndex(totalSteps - 1);
    }
  }, [totalSteps, pause]);

  const seek = useCallback(
    (stepIndex: number) => {
      pause();
      if (totalSteps <= 0) return;
      const clamped = Math.max(0, Math.min(stepIndex, totalSteps - 1));
      setCurrentStepIndex(clamped);
    },
    [totalSteps, pause]
  );

  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(-1);
  }, [pause]);

  const setSpeed = useCallback((speedMs: number) => {
    setPlaybackSpeed(Math.max(10, speedMs));
  }, []);

  const initializeTrace = useCallback(
    (stepCount: number, autoPlay: boolean = true) => {
      pause();
      if (stepCount <= 0) {
        setCurrentStepIndex(-1);
        return;
      }
      setCurrentStepIndex(0);
      if (autoPlay) {
        setIsPlaying(true);
      }
    },
    [pause]
  );

  return {
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
    seek,
    reset,
    setSpeed,
    initializeTrace,
  };
}
