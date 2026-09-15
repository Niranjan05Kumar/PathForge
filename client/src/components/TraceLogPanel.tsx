import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TraceStep } from '../types/graph';

interface TraceLogPanelProps {
  steps: TraceStep[];
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export const TraceLogPanel: React.FC<TraceLogPanelProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active step into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [currentStepIndex]);

  const filteredSteps = useMemo(() => {
    if (filterAction === 'ALL') {
      return steps.map((step, idx) => ({ step, originalIndex: idx }));
    }
    return steps
      .map((step, idx) => ({ step, originalIndex: idx }))
      .filter(({ step }) => {
        if (filterAction === 'VISIT') return step.action === 'visit_node';
        if (filterAction === 'EXAMINE') return step.action === 'examine_edge';
        if (filterAction === 'RELAX') return step.action === 'relax_edge';
        if (filterAction === 'ENQUEUE') return step.action === 'enqueue_node' || step.action === 'push_node';
        if (filterAction === 'FINALIZE') return step.action === 'finalize_path' || step.action === 'no_path';
        return true;
      });
  }, [steps, filterAction]);

  if (!steps || steps.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>📜</div>
        <div>No trace recorded yet.</div>
        <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>
          Run an algorithm to inspect discrete step-by-step kernel operations.
        </div>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'visit_node':
        return { label: 'VISIT', bg: 'rgba(242, 169, 59, 0.15)', color: 'var(--accent-primary)', border: 'var(--accent-muted)' };
      case 'examine_edge':
        return { label: 'EXAMINE', bg: 'rgba(88, 166, 255, 0.12)', color: 'var(--color-info)', border: '#388bfd33' };
      case 'relax_edge':
        return { label: 'RELAX', bg: 'rgba(63, 185, 80, 0.15)', color: 'var(--color-success)', border: '#2ea04344' };
      case 'enqueue_node':
      case 'push_node':
        return { label: 'QUEUE', bg: 'rgba(163, 113, 247, 0.15)', color: '#D2A8FF', border: '#a371f744' };
      case 'finalize_path':
        return { label: 'GOAL', bg: 'rgba(242, 169, 59, 0.25)', color: 'var(--accent-primary)', border: 'var(--accent-primary)' };
      case 'no_path':
        return { label: 'EXHAUSTED', bg: 'rgba(229, 83, 75, 0.15)', color: 'var(--color-error)', border: '#f8514944' };
      default:
        return { label: action.toUpperCase(), bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header & Filter Controls */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Step Trace Feed ({steps.length} steps)
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="select-input"
          style={{
            height: '24px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '0 6px',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <option value="ALL">All Actions</option>
          <option value="VISIT">Visits only</option>
          <option value="EXAMINE">Examines only</option>
          <option value="RELAX">Relaxations only</option>
          <option value="ENQUEUE">Queue / Stack only</option>
          <option value="FINALIZE">Final Route only</option>
        </select>
      </div>

      {/* Scrollable Event Feed */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {filteredSteps.map(({ step, originalIndex }) => {
          const isActive = originalIndex === currentStepIndex;
          const badge = getActionBadge(step.action);

          return (
            <div
              key={originalIndex}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectStep(originalIndex)}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {/* Top Line: Step number & Action Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    #{String(originalIndex + 1).padStart(2, '0')}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Node Target or Edge Info */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {step.targetId ? `${step.nodeId} → ${step.targetId}` : step.nodeId}
                  {step.edgeWeight ? ` (${step.edgeWeight})` : ''}
                </div>
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '11px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: '1.4',
                }}
              >
                {step.description}
              </div>

              {/* Frontier / Queue snapshot pills */}
              {step.frontier && step.frontier.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '2px',
                    overflowX: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: 'var(--color-info)' }}>Q:</span> [
                  {step.frontier.slice(0, 6).join(', ')}
                  {step.frontier.length > 6 ? ` +${step.frontier.length - 6}` : ''}]
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
