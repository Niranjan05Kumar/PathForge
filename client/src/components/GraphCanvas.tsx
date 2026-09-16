import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CanvasNode, CanvasEdge, TraceStep } from '../types/graph';
import { CanvasTool } from './ControlSidebar';
import { useCanvasNavigation } from '../hooks/useCanvasNavigation';
import { CanvasNavControls } from './CanvasNavControls';

export interface GraphCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  sourceNode: string;
  destinationNode: string;
  isDirected: boolean;
  isWeighted: boolean;
  activeTool: CanvasTool;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  edgeStartNode: string | null;
  finalPathSet: Set<string>;
  finalPathEdgesSet: Set<string>;
  activeFrontierSet: Set<string>;
  activeVisitedSet: Set<string>;
  currentStep?: TraceStep;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onAddNode: (x: number, y: number) => void;
  onAddEdge: (source: string, target: string) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onEditEdgeWeight: (edge: CanvasEdge) => void;
  onSetEdgeStartNode: (nodeId: string | null) => void;
  children?: React.ReactNode; // For floating PlaybackControls
}

export const GraphCanvas: React.FC<GraphCanvasProps> = React.memo(({
  nodes,
  edges,
  sourceNode,
  destinationNode,
  isDirected,
  isWeighted,
  activeTool,
  selectedNodeId,
  selectedEdgeId,
  edgeStartNode,
  finalPathSet,
  finalPathEdgesSet,
  activeFrontierSet,
  activeVisitedSet,
  currentStep,
  onSelectNode,
  onSelectEdge,
  onAddNode,
  onAddEdge,
  onMoveNode,
  onEditEdgeWeight,
  onSetEdgeStartNode,
  children,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Zoom & Pan Navigation Hook
  const {
    pan,
    zoom,
    isPanning,
    zoomIn,
    zoomOut,
    resetView,
    fitToScreen,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    screenToGraph,
  } = useCanvasNavigation();

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse cursor preview position for edge creation line
  const [mouseGraphPos, setMouseGraphPos] = useState<{ x: number; y: number } | null>(null);

  // Auto-fit to screen on initial mount if nodes exist
  const hasAutoFittedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoFittedRef.current && nodes.length > 0 && svgRef.current) {
      hasAutoFittedRef.current = true;
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        fitToScreen(nodes, { width: rect.width, height: rect.height });
      }
    }
  }, [nodes, fitToScreen]);

  const handleFitToScreenClick = useCallback(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      fitToScreen(nodes, { width: rect.width, height: rect.height });
    }
  }, [nodes, fitToScreen]);

  // --- Pointer & Mouse Interaction Handlers ---

  const handleMouseDownCanvas = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current && (e.target as HTMLElement).tagName !== 'svg') {
      return;
    }

    if (e.button === 0) { // Left click
      if (activeTool === 'select') {
        startPan(e.clientX, e.clientY);
        onSelectNode(null);
        onSelectEdge(null);
      }
    } else if (e.button === 1) { // Middle click always pans
      startPan(e.clientX, e.clientY);
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    if (isPanning) {
      updatePan(e.clientX, e.clientY);
      return;
    }

    if (draggingNodeId) {
      const graphPos = screenToGraph(e.clientX, e.clientY, rect);
      onMoveNode(draggingNodeId, graphPos.x - dragOffset.x, graphPos.y - dragOffset.y);
      return;
    }

    if (edgeStartNode) {
      const graphPos = screenToGraph(e.clientX, e.clientY, rect);
      setMouseGraphPos(graphPos);
    }
  };

  const handleMouseUpCanvas = () => {
    if (isPanning) {
      endPan();
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    if (activeTool === 'add_node') {
      const rect = svgRef.current.getBoundingClientRect();
      const graphPos = screenToGraph(e.clientX, e.clientY, rect);
      onAddNode(graphPos.x, graphPos.y);
    } else if (activeTool === 'add_edge' && edgeStartNode) {
      // Clicked blank space while connecting an edge: cancel edge connection
      if (e.target === svgRef.current) {
        onSetEdgeStartNode(null);
        setMouseGraphPos(null);
      }
    }
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeTool === 'select') {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const graphPos = screenToGraph(e.clientX, e.clientY, rect);
      const clickedNode = nodes.find((n) => n.id === id);

      if (clickedNode) {
        setDragOffset({
          x: graphPos.x - clickedNode.x,
          y: graphPos.y - clickedNode.y,
        });
      }

      setDraggingNodeId(id);
      onSelectNode(id);
      onSelectEdge(null);
    } else if (activeTool === 'add_edge') {
      if (!edgeStartNode) {
        onSetEdgeStartNode(id);
      } else if (edgeStartNode !== id) {
        onAddEdge(edgeStartNode, id);
        onSetEdgeStartNode(null);
        setMouseGraphPos(null);
      }
    }
  };

  const startNodeData = edgeStartNode ? nodes.find((n) => n.id === edgeStartNode) : null;

  return (
    <main className="workbench-canvas-panel" aria-label="Interactive Graph Canvas Workspace">
      {/* Sub-Header: Node counts & State Legend */}
      <div
        className="canvas-legend-bar"
        style={{
          height: '32px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(26, 29, 32, 0.6)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          zIndex: 2,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          V: <span style={{ color: 'var(--text-primary)' }}>{nodes.length}</span> | E:{' '}
          <span style={{ color: 'var(--text-primary)' }}>{edges.length}</span>
          {selectedNodeId && (
            <span style={{ marginLeft: '12px', color: 'var(--accent-primary)' }}>
              Selected Node: {selectedNodeId}
            </span>
          )}
          {selectedEdgeId && (
            <span style={{ marginLeft: '12px', color: 'var(--accent-primary)' }}>
              Selected Edge: {selectedEdgeId}
            </span>
          )}
          {edgeStartNode && (
            <span style={{ marginLeft: '12px', color: 'var(--color-info)' }}>
              Connecting from: {edgeStartNode} (click destination node)
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Floating Zoom & Pan Navigation Controls */}
        <CanvasNavControls
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetView}
          onFitToScreen={handleFitToScreenClick}
        />

        <svg
          ref={svgRef}
          className="workbench-grid"
          style={{
            width: '100%',
            height: '100%',
            cursor: isPanning
              ? 'grabbing'
              : activeTool === 'add_node'
              ? 'crosshair'
              : activeTool === 'add_edge'
              ? 'pointer'
              : draggingNodeId
              ? 'grabbing'
              : 'grab',
          }}
          onWheel={(e) => {
            if (svgRef.current) {
              handleWheel(e, svgRef.current.getBoundingClientRect());
            }
          }}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onClick={handleCanvasClick}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-active)" />
            </marker>
            <marker
              id="arrow-path"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-primary)" />
            </marker>
          </defs>

          {/* Transformed Graph Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. Render Edges */}
            {edges.map((edge) => {
              const sNode = nodes.find((n) => n.id === edge.source);
              const tNode = nodes.find((n) => n.id === edge.target);
              if (!sNode || !tNode) return null;

              const isPathEdge =
                finalPathEdgesSet.has(`${edge.source}->${edge.target}`) ||
                finalPathEdgesSet.has(`${edge.target}->${edge.source}`);

              const isExamined =
                currentStep?.action === 'examine_edge' &&
                ((currentStep.nodeId === edge.source && currentStep.targetId === edge.target) ||
                  (!isDirected && currentStep.nodeId === edge.target && currentStep.targetId === edge.source));

              const isRelaxed =
                currentStep?.action === 'relax_edge' &&
                ((currentStep.nodeId === edge.source && currentStep.targetId === edge.target) ||
                  (!isDirected && currentStep.nodeId === edge.target && currentStep.targetId === edge.source));

              const isSelected = selectedEdgeId === edge.id;

              const strokeColor = isPathEdge
                ? 'var(--accent-primary)'
                : isRelaxed
                ? 'var(--color-success)'
                : isExamined
                ? 'var(--color-info)'
                : isSelected
                ? 'var(--text-primary)'
                : 'var(--border)';

              const strokeWidth = isPathEdge ? 3.5 : isRelaxed ? 3.0 : isExamined || isSelected ? 2.5 : 1.5;

              const midX = (sNode.x + tNode.x) / 2;
              const midY = (sNode.y + tNode.y) / 2;

              return (
                <g
                  key={edge.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEdge(edge.id);
                    onSelectNode(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <line
                    x1={sNode.x}
                    y1={sNode.y}
                    x2={tNode.x}
                    y2={tNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    className={isRelaxed ? 'anim-edge-relax' : undefined}
                    markerEnd={isDirected ? (isPathEdge ? 'url(#arrow-path)' : 'url(#arrow)') : undefined}
                    strokeDasharray={isExamined && !isPathEdge && !isRelaxed ? '4 2' : undefined}
                  />

                  {isWeighted && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEdgeWeight(edge);
                      }}
                    >
                      <title>Click to edit weight</title>
                      <rect
                        x="-14"
                        y="-9"
                        width="28"
                        height="18"
                        rx="3"
                        fill="var(--bg-surface)"
                        stroke={isPathEdge ? 'var(--accent-primary)' : isRelaxed ? 'var(--color-success)' : isSelected ? 'var(--text-primary)' : 'var(--border)'}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isPathEdge ? 'var(--accent-primary)' : isRelaxed ? 'var(--color-success)' : 'var(--text-secondary)'}
                        fontFamily="var(--font-mono)"
                        fontSize="10"
                        fontWeight="500"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 2. Transient Connecting Edge Preview */}
            {startNodeData && mouseGraphPos && (
              <line
                x1={startNodeData.x}
                y1={startNodeData.y}
                x2={mouseGraphPos.x}
                y2={mouseGraphPos.y}
                stroke="var(--accent-primary)"
                strokeWidth="2"
                strokeDasharray="4 3"
                markerEnd={isDirected ? 'url(#arrow-path)' : undefined}
              />
            )}

            {/* 3. Render Nodes */}
            {nodes.map((node) => {
              const isSource = node.id === sourceNode;
              const isDest = node.id === destinationNode;
              const isPath = finalPathSet.has(node.id);
              const isCurrent = currentStep?.nodeId === node.id;
              const isFrontier = activeFrontierSet.has(node.id);
              const isVisited = activeVisitedSet.has(node.id);
              const isSelected = node.id === selectedNodeId;
              const isConnectingStart = edgeStartNode === node.id;

              let fillColor = 'var(--node-default)';
              let borderColor = 'var(--node-default-border)';
              let textColor = 'var(--text-primary)';
              let badgeText = '';

              if (isPath) {
                fillColor = 'var(--accent-primary)';
                borderColor = 'var(--accent-hover)';
                textColor = '#111315';
              } else if (isCurrent) {
                fillColor = 'var(--node-current)';
                borderColor = 'var(--accent-primary)';
                textColor = '#111315';
                badgeText = 'C';
              } else if (isSource) {
                fillColor = 'var(--node-source)';
                borderColor = 'var(--accent-hover)';
                textColor = '#111315';
                badgeText = 'S';
              } else if (isDest) {
                fillColor = 'var(--node-destination)';
                borderColor = 'var(--accent-primary)';
                textColor = '#111315';
                badgeText = 'D';
              } else if (isFrontier) {
                fillColor = 'var(--node-frontier)';
                borderColor = '#388BFD';
                textColor = '#111315';
                badgeText = 'F';
              } else if (isVisited) {
                fillColor = 'var(--node-visited)';
                borderColor = '#6E7681';
                textColor = 'var(--text-primary)';
                badgeText = 'V';
              }

              if (isSelected || isConnectingStart) {
                borderColor = 'var(--accent-primary)';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  style={{ cursor: activeTool === 'add_edge' ? 'pointer' : 'grab' }}
                >
                  {/* Outer Pulsing Halos */}
                  {isFrontier && !isCurrent && !isPath && (
                    <circle
                      r="16"
                      fill="none"
                      stroke="var(--node-frontier)"
                      strokeWidth="2"
                      className="anim-pulse-frontier"
                    />
                  )}
                  {isCurrent && (
                    <circle
                      r="16"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2.5"
                      className="anim-pulse-current"
                    />
                  )}

                  {/* Base Circle */}
                  <circle
                    r="14"
                    fill={fillColor}
                    stroke={borderColor}
                    strokeWidth={isSelected || isConnectingStart ? 2.5 : 1.5}
                  />

                  {/* Primary Node ID Text */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    fontFamily="var(--font-mono)"
                    fontSize="11"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {node.id}
                  </text>

                  {/* Role Badge (S, D, C, F, V) */}
                  {badgeText && (
                    <g transform="translate(9, -9)">
                      <circle r="6" fill="#111315" stroke={borderColor} strokeWidth="1" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--text-primary)"
                        fontFamily="var(--font-mono)"
                        fontSize="8"
                        fontWeight="700"
                      >
                        {badgeText}
                      </text>
                    </g>
                  )}

                  {/* Node Label Display */}
                  {node.label && node.label !== node.id && (
                    <text
                      y="24"
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-sans)"
                      fontSize="9"
                      pointerEvents="none"
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Playback Controls Overlay Passed as Children */}
        {children}
      </div>
    </main>
  );
});
