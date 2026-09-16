import React, { useState, useEffect, useRef } from 'react';
import { CanvasEdge } from '../types/graph';

export interface EdgeWeightModalProps {
  edge: CanvasEdge | null;
  isOpen: boolean;
  onSave: (edgeId: string, newWeight: number) => void;
  onDelete?: (edgeId: string) => void;
  onClose: () => void;
}

export const EdgeWeightModal: React.FC<EdgeWeightModalProps> = ({
  edge,
  isOpen,
  onSave,
  onDelete,
  onClose,
}) => {
  const [weightInput, setWeightInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (edge && isOpen) {
      setWeightInput(edge.weight.toString());
      setErrorMessage(null);
      // Auto-focus and select input after mount
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [edge, isOpen]);

  if (!isOpen || !edge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(weightInput.trim());

    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
      setErrorMessage('Edge weight must be a valid non-negative number (≥ 0).');
      return;
    }

    onSave(edge.id, +parsed.toFixed(2));
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && edge) {
      onDelete(edge.id);
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edge-weight-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '360px',
          maxWidth: '92vw',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              id="edge-weight-modal-title"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Edit Edge Weight
            </h3>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-primary)',
                marginTop: '2px',
              }}
            >
              {edge.source} ↔ {edge.target}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-ghost"
            style={{ width: '26px', height: '26px', padding: 0, fontSize: '14px' }}
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label
              htmlFor="edge-weight-input"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Weight (Cost)
            </label>
            <input
              id="edge-weight-input"
              ref={inputRef}
              type="number"
              step="any"
              min="0"
              value={weightInput}
              onChange={(e) => {
                setWeightInput(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              style={{
                width: '100%',
                height: '32px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                borderColor: errorMessage ? 'var(--color-error)' : undefined,
              }}
              placeholder="e.g. 5.0"
            />
            {errorMessage && (
              <div
                style={{
                  color: 'var(--color-error)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '6px',
                }}
              >
                ⚠ {errorMessage}
              </div>
            )}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Used for Dijkstra and A* path costs. Set to 0.0 for zero-cost transitions.
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-destructive"
                style={{ height: '30px', fontSize: '11px' }}
              >
                Delete Edge
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ height: '30px', fontSize: '11px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ height: '30px', fontSize: '11px' }}
              >
                Save Weight
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
