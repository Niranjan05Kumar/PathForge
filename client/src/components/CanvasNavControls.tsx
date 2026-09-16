import React from 'react';

export interface CanvasNavControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitToScreen: () => void;
}

export const CanvasNavControls: React.FC<CanvasNavControlsProps> = React.memo(({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitToScreen,
}) => {
  return (
    <div
      className="canvas-nav-controls"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(26, 29, 32, 0.9)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '3px 6px',
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <button
        type="button"
        onClick={onZoomOut}
        className="btn-ghost"
        style={{ width: '26px', height: '24px', padding: 0, fontSize: '14px', fontWeight: 600 }}
        title="Zoom Out (Mouse wheel down)"
        aria-label="Zoom Out"
      >
        −
      </button>

      <button
        type="button"
        onClick={onResetView}
        className="btn-ghost"
        style={{
          height: '24px',
          padding: '0 6px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-primary)',
          fontWeight: 600,
        }}
        title="Reset Zoom to 100%"
        aria-label="Reset Zoom"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        className="btn-ghost"
        style={{ width: '26px', height: '24px', padding: 0, fontSize: '14px', fontWeight: 600 }}
        title="Zoom In (Mouse wheel up)"
        aria-label="Zoom In"
      >
        +
      </button>

      <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 2px' }} />

      <button
        type="button"
        onClick={onFitToScreen}
        className="btn-ghost"
        style={{ height: '24px', padding: '0 6px', fontSize: '11px', gap: '4px' }}
        title="Fit all nodes to view"
        aria-label="Fit to Screen"
      >
        <span>⛶</span>
        <span>Fit</span>
      </button>

      <button
        type="button"
        onClick={onResetView}
        className="btn-ghost"
        style={{ height: '24px', padding: '0 6px', fontSize: '11px' }}
        title="Reset pan and zoom to default"
        aria-label="Reset View"
      >
        Reset
      </button>
    </div>
  );
});
