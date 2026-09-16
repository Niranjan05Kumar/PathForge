import React from 'react';
import { TraceStep } from '../types/graph';

export interface PlaybackControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentStep?: TraceStep;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSeek: (stepIndex: number) => void;
  onSetSpeed: (speedMs: number) => void;
  onReset: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = React.memo(({
  currentStepIndex,
  totalSteps,
  isPlaying,
  playbackSpeed,
  currentStep,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  onSeek,
  onSetSpeed,
  onReset,
}) => {
  if (totalSteps <= 0) return null;

  const displayStep = currentStepIndex < 0 ? 0 : currentStepIndex + 1;

  return (
    <div
      className="playback-controls-container"
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        maxWidth: '96%',
        backgroundColor: 'rgba(26, 29, 32, 0.95)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 15,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top row: Status info & Description */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
            }}
          >
            Step {displayStep} / {totalSteps}
          </span>

          {currentStep?.action && (
            <span
              style={{
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              [{currentStep.action}]
            </span>
          )}
        </div>

        <div
          style={{
            maxWidth: '380px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--text-primary)',
            fontSize: '11px',
          }}
          title={currentStep?.description}
        >
          {currentStep?.description || 'Playback ready'}
        </div>
      </div>

      {/* Center: Interactive Scrubber Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex < 0 ? 0 : currentStepIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          style={{
            flex: 1,
            height: '4px',
            accentColor: 'var(--accent-primary)',
            cursor: 'pointer',
          }}
          aria-label="Trace step playback scrubber"
        />
      </div>

      {/* Bottom row: Control Buttons & Speed */}
      <div
        className="playback-buttons-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={onJumpToStart}
            className="btn-ghost"
            style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
            title="Jump to Start (First Step)"
          >
            ⏮ First
          </button>
          <button
            type="button"
            onClick={onStepBackward}
            className="btn-secondary"
            style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
            title="Step Backward (Left Arrow)"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className={isPlaying ? 'btn-secondary' : 'btn-primary'}
            style={{ height: '28px', padding: '0 14px', fontSize: '12px', fontWeight: 600 }}
            title="Play / Pause (Spacebar)"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            onClick={onStepForward}
            className="btn-secondary"
            style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
            title="Step Forward (Right Arrow)"
          >
            Next ▶
          </button>
          <button
            type="button"
            onClick={onJumpToEnd}
            className="btn-ghost"
            style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
            title="Jump to End (Final Step)"
          >
            Last ⏭
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => onSetSpeed(parseInt(e.target.value, 10))}
              className="select-field"
              style={{ height: '26px', fontSize: '11px', padding: '0 6px' }}
              aria-label="Select playback speed"
            >
              <option value="600">0.5x (Slow)</option>
              <option value="250">1.0x (Normal)</option>
              <option value="120">2.0x (Fast)</option>
              <option value="50">5.0x (Turbo)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="btn-ghost"
            style={{ height: '26px', fontSize: '11px', padding: '0 6px', border: '1px solid var(--border)' }}
            title="Reset step playback to beginning"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
});
